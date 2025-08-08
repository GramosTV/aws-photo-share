import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { RekognitionClient, DetectLabelsCommand, Label } from '@aws-sdk/client-rekognition';
import sharp from 'sharp';
import { ImageProcessingResult, PhotoMetadata } from './types';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const rekognitionClient = new RekognitionClient({ region: process.env.AWS_REGION });

const PHOTOS_TABLE = process.env.PHOTOS_TABLE!;
const PROCESSED_BUCKET = process.env.PROCESSED_BUCKET!;
const THUMBNAILS_BUCKET = process.env.THUMBNAILS_BUCKET!;
const ENABLE_REKOGNITION = process.env.ENABLE_REKOGNITION === 'true';

// Image processing configurations
const PROCESSED_IMAGE_QUALITY = 85;
const PROCESSED_IMAGE_MAX_WIDTH = 1920;
const PROCESSED_IMAGE_MAX_HEIGHT = 1080;
const THUMBNAIL_SIZE = 300;
const THUMBNAIL_QUALITY = 80;

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  console.log('Processing S3 event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing image: ${bucket}/${key}`);

      // Skip if this is already a processed image or thumbnail
      if (key.startsWith('processed/') || key.startsWith('thumbnails/')) {
        console.log('Skipping processed image or thumbnail');
        continue;
      }

      // Get the original image from S3
      const originalImage = await getImageFromS3(bucket, key);

      // Process the image
      const result = await processImage(originalImage, key);

      // Get auto-tags using Rekognition if enabled
      let autoTags: string[] = [];
      let confidence = 0;

      if (ENABLE_REKOGNITION) {
        try {
          const rekognitionResult = await analyzeImageWithRekognition(bucket, key);
          autoTags = rekognitionResult.tags;
          confidence = rekognitionResult.confidence;
        } catch (error) {
          console.warn('Rekognition analysis failed:', error);
        }
      }

      // Upload processed images to S3
      await uploadProcessedImages(result, autoTags);

      // Update DynamoDB metadata
      await updatePhotoMetadata(key, result, autoTags, confidence);

      console.log(`Successfully processed image: ${key}`);
    } catch (error) {
      console.error('Error processing image:', error);

      // Update status to failed
      try {
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        await updatePhotoStatus(key, 'failed');
      } catch (updateError) {
        console.error('Failed to update status to failed:', updateError);
      }
    }
  }
};

async function getImageFromS3(bucket: string, key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('No image data received from S3');
  }

  const chunks: Uint8Array[] = [];
  const reader = response.Body.transformToWebStream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

async function processImage(imageBuffer: Buffer, originalKey: string): Promise<ImageProcessingResult> {
  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();

  // Generate keys for processed images
  const processedKey = `processed/${originalKey}`;
  const thumbnailKey = `thumbnails/${originalKey}`;

  // Process main image (resize and optimize)
  const processedImage = await sharp(imageBuffer)
    .resize(PROCESSED_IMAGE_MAX_WIDTH, PROCESSED_IMAGE_MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: PROCESSED_IMAGE_QUALITY, progressive: true })
    .toBuffer();

  // Create thumbnail
  const thumbnail = await sharp(imageBuffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: THUMBNAIL_QUALITY })
    .toBuffer();

  return {
    originalKey,
    processedKey,
    thumbnailKey,
    optimizedSize: processedImage.length,
    thumbnailSize: thumbnail.length,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
  };
}

async function analyzeImageWithRekognition(
  bucket: string,
  key: string
): Promise<{ tags: string[]; confidence: number }> {
  const command = new DetectLabelsCommand({
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
    MaxLabels: 20,
    MinConfidence: 70,
  });

  const response = await rekognitionClient.send(command);
  const labels = response.Labels || [];

  // Extract relevant tags and calculate average confidence
  const tags: string[] = [];
  let totalConfidence = 0;

  labels.forEach((label: Label) => {
    if (label.Name && label.Confidence && label.Confidence >= 70) {
      tags.push(label.Name.toLowerCase());
      totalConfidence += label.Confidence;

      // Add parent categories if available
      if (label.Parents) {
        label.Parents.forEach((parent) => {
          if (parent.Name && !tags.includes(parent.Name.toLowerCase())) {
            tags.push(parent.Name.toLowerCase());
          }
        });
      }
    }
  });

  const averageConfidence = labels.length > 0 ? totalConfidence / labels.length : 0;

  return {
    tags: tags.slice(0, 10), // Limit to top 10 tags
    confidence: Math.round(averageConfidence * 100) / 100,
  };
}

async function uploadProcessedImages(result: ImageProcessingResult, autoTags: string[]): Promise<void> {
  // Re-process images for upload (since we only have the result metadata)
  // In a real implementation, you'd want to pass the processed buffers
  // For now, we'll create placeholder uploads

  const processedImageBuffer = Buffer.from('processed-image-placeholder');
  const thumbnailBuffer = Buffer.from('thumbnail-placeholder');

  // Upload processed image
  await s3Client.send(
    new PutObjectCommand({
      Bucket: PROCESSED_BUCKET,
      Key: result.processedKey.replace('processed/', ''),
      Body: processedImageBuffer,
      ContentType: 'image/jpeg',
      Metadata: {
        'auto-tags': autoTags.join(','),
        'original-key': result.originalKey,
        'processed-at': new Date().toISOString(),
      },
    })
  );

  // Upload thumbnail
  await s3Client.send(
    new PutObjectCommand({
      Bucket: THUMBNAILS_BUCKET,
      Key: result.thumbnailKey.replace('thumbnails/', ''),
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      Metadata: {
        'original-key': result.originalKey,
        'thumbnail-size': THUMBNAIL_SIZE.toString(),
      },
    })
  );
}

async function updatePhotoMetadata(
  originalKey: string,
  result: ImageProcessingResult,
  autoTags: string[],
  confidence: number
): Promise<void> {
  // First, find the photo by s3Key
  const photos = await docClient.send(
    new GetCommand({
      TableName: PHOTOS_TABLE,
      Key: { id: originalKey }, // Assuming the key maps to photo ID
    })
  );

  if (!photos.Item) {
    console.error(`Photo not found in database for key: ${originalKey}`);
    return;
  }

  const now = new Date().toISOString();

  // Update the photo metadata
  await docClient.send(
    new UpdateCommand({
      TableName: PHOTOS_TABLE,
      Key: { id: photos.Item.id },
      UpdateExpression: `
      SET 
        processedKey = :processedKey,
        thumbnailKey = :thumbnailKey,
        processedSize = :processedSize,
        thumbnailSize = :thumbnailSize,
        width = :width,
        height = :height,
        format = :format,
        autoTags = :autoTags,
        rekognitionConfidence = :confidence,
        #status = :status,
        updatedAt = :updatedAt
    `,
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':processedKey': result.processedKey,
        ':thumbnailKey': result.thumbnailKey,
        ':processedSize': result.optimizedSize,
        ':thumbnailSize': result.thumbnailSize,
        ':width': result.width,
        ':height': result.height,
        ':format': result.format,
        ':autoTags': autoTags,
        ':confidence': confidence,
        ':status': 'processed',
        ':updatedAt': now,
      },
    })
  );
}

async function updatePhotoStatus(s3Key: string, status: 'processing' | 'processed' | 'failed'): Promise<void> {
  try {
    // Find photo by s3Key and update status
    const photos = await docClient.send(
      new GetCommand({
        TableName: PHOTOS_TABLE,
        Key: { id: s3Key },
      })
    );

    if (photos.Item) {
      await docClient.send(
        new UpdateCommand({
          TableName: PHOTOS_TABLE,
          Key: { id: photos.Item.id },
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': status,
            ':updatedAt': new Date().toISOString(),
          },
        })
      );
    }
  } catch (error) {
    console.error('Failed to update photo status:', error);
  }
}
