import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Event, S3EventRecord, Context } from 'aws-lambda';
import sharp from 'sharp';

const s3Client = new S3Client({ region: process.env.REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PHOTOS_TABLE = process.env.PHOTOS_TABLE!;
const THUMBNAILS_BUCKET = process.env.THUMBNAILS_BUCKET!;

interface Photo {
  userId: string;
  photoId: string;
  s3Key: string;
  thumbnailKey?: string;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  status?: 'processing' | 'processed' | 'failed';
}

interface ThumbnailSize {
  suffix: string;
  width: number;
  height: number;
}

// Thumbnail configurations
const THUMBNAIL_SIZES: ThumbnailSize[] = [
  { suffix: 'small', width: 150, height: 150 },
  { suffix: 'medium', width: 300, height: 300 },
  { suffix: 'large', width: 600, height: 600 },
];

async function findPhotoByS3Key(s3Key: string): Promise<Photo | null> {
  try {
    // Extract userId from S3 key (assuming format: uploads/userId/filename)
    const keyParts = s3Key.split('/');
    if (keyParts.length < 3 || keyParts[0] !== 'uploads') {
      throw new Error('Invalid S3 key format');
    }

    const userId = keyParts[1];

    // Query DynamoDB to find the photo with this S3 key
    const command = new QueryCommand({
      TableName: PHOTOS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 's3Key = :s3Key',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':s3Key': s3Key,
      },
    });

    const result = await docClient.send(command);

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as Photo;
    }

    return null;
  } catch (error) {
    console.error('Error finding photo by S3 key:', error);
    return null;
  }
}

async function generateThumbnail(bucketName: string, objectKey: string, size: ThumbnailSize): Promise<string> {
  try {
    // Get the original image from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      throw new Error('No image data received from S3');
    }

    const imageBuffer = Buffer.from(await response.Body.transformToByteArray());

    // Generate thumbnail using Sharp
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Generate thumbnail key
    const originalKeyParts = objectKey.split('/');
    const fileName = originalKeyParts[originalKeyParts.length - 1];
    const fileNameWithoutExt = fileName.split('.')[0];
    const thumbnailKey = `thumbnails/${originalKeyParts[1]}/${fileNameWithoutExt}-${size.suffix}.jpg`;

    // Upload thumbnail to S3
    const putObjectCommand = new PutObjectCommand({
      Bucket: THUMBNAILS_BUCKET,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      Metadata: {
        originalKey: objectKey,
        size: size.suffix,
        width: size.width.toString(),
        height: size.height.toString(),
      },
    });

    await s3Client.send(putObjectCommand);

    return thumbnailKey;
  } catch (error) {
    console.error(`Error generating ${size.suffix} thumbnail:`, error);
    throw error;
  }
}

async function updatePhotoWithThumbnails(photo: Photo, thumbnailKeys: Record<string, string>): Promise<void> {
  try {
    const updateCommand = new UpdateCommand({
      TableName: PHOTOS_TABLE,
      Key: {
        userId: photo.userId,
        photoId: photo.photoId,
      },
      UpdateExpression:
        'SET thumbnailKey = :thumbnailKey, thumbnails = :thumbnails, #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':thumbnailKey': thumbnailKeys.medium || thumbnailKeys.small, // Primary thumbnail
        ':thumbnails': thumbnailKeys,
        ':status': 'processed',
        ':updatedAt': new Date().toISOString(),
      },
    });

    await docClient.send(updateCommand);
    console.log('Photo updated with thumbnail information');
  } catch (error) {
    console.error('Error updating photo with thumbnails:', error);
    throw error;
  }
}

export const handler = async (event: S3Event, context: Context): Promise<any> => {
  console.log('Thumbnail generation event:', JSON.stringify(event, null, 2));

  try {
    // Process each S3 event record
    for (const record of event.Records) {
      if (record.eventSource !== 'aws:s3') {
        console.log('Skipping non-S3 event');
        continue;
      }

      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing object: ${objectKey} from bucket: ${bucketName}`);

      // Check if this is an image file
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const fileExtension = objectKey.toLowerCase().substring(objectKey.lastIndexOf('.'));

      if (!imageExtensions.includes(fileExtension)) {
        console.log(`Skipping non-image file: ${objectKey}`);
        continue;
      }

      // Find the corresponding photo record in DynamoDB
      const photo = await findPhotoByS3Key(objectKey);
      if (!photo) {
        console.log(`No photo record found for S3 key: ${objectKey}`);
        continue;
      }

      console.log(`Found photo record: ${photo.photoId}`);

      // Generate thumbnails for all sizes
      const thumbnailKeys: Record<string, string> = {};

      for (const size of THUMBNAIL_SIZES) {
        try {
          const thumbnailKey = await generateThumbnail(bucketName, objectKey, size);
          thumbnailKeys[size.suffix] = thumbnailKey;
          console.log(`Generated ${size.suffix} thumbnail: ${thumbnailKey}`);
        } catch (error) {
          console.error(`Failed to generate ${size.suffix} thumbnail:`, error);
          // Continue with other sizes even if one fails
        }
      }

      // Update the photo record with thumbnail information
      if (Object.keys(thumbnailKeys).length > 0) {
        await updatePhotoWithThumbnails(photo, thumbnailKeys);
        console.log(`Successfully processed thumbnails for photo: ${photo.photoId}`);
      } else {
        console.error(`No thumbnails were generated for photo: ${photo.photoId}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Thumbnail generation completed successfully',
      }),
    };
  } catch (error) {
    console.error('Error in thumbnail generation:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Thumbnail generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
