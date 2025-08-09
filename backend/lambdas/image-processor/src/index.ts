import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { RekognitionClient, DetectLabelsCommand, Label } from '@aws-sdk/client-rekognition';
// import sharp from 'sharp';  // Temporarily disabled due to runtime issues
import { ImageProcessingResult, PhotoMetadata } from './types';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const rekognitionClient = new RekognitionClient({ region: process.env.AWS_REGION });

const PHOTOS_TABLE = process.env.PHOTOS_TABLE!;
const PROCESSED_BUCKET = process.env.PROCESSED_BUCKET!;
const THUMBNAILS_BUCKET = process.env.THUMBNAILS_BUCKET!;
const ENABLE_REKOGNITION = process.env.ENABLE_REKOGNITION === 'true';

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

      // Get auto-tags using Rekognition if enabled
      let autoTags: string[] = [];
      let confidence = 0;

      if (ENABLE_REKOGNITION) {
        try {
          console.log('Analyzing image with Rekognition...');
          const rekognitionResult = await analyzeImageWithRekognition(bucket, key);
          autoTags = rekognitionResult.tags;
          confidence = rekognitionResult.confidence;
          console.log(`Rekognition found ${autoTags.length} tags with ${confidence}% confidence`);
        } catch (error) {
          console.warn('Rekognition analysis failed:', error);
        }
      }

      // Update DynamoDB metadata with AI data
      await updatePhotoMetadata(key, autoTags, confidence);

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
  if (!result.processedImage || !result.thumbnail) {
    throw new Error('Processed image buffers are missing');
  }

  // Upload processed image
  await s3Client.send(
    new PutObjectCommand({
      Bucket: PROCESSED_BUCKET,
      Key: result.processedKey.replace('processed/', ''),
      Body: result.processedImage,
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
      Body: result.thumbnail,
      ContentType: 'image/jpeg',
      Metadata: {
        'original-key': result.originalKey,
        'thumbnail-size': '300',
      },
    })
  );
}

async function updatePhotoMetadata(originalKey: string, autoTags: string[], confidence: number): Promise<void> {
  // Find the photo by s3Key using a scan (since s3Key is not a key attribute)
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: PHOTOS_TABLE,
      FilterExpression: 's3Key = :s3Key',
      ExpressionAttributeValues: {
        ':s3Key': originalKey,
      },
    })
  );

  if (!scanResult.Items || scanResult.Items.length === 0) {
    console.error(`Photo not found in database for s3Key: ${originalKey}`);
    return;
  }

  const photo = scanResult.Items[0];
  const now = new Date().toISOString();

  // Update the photo metadata using the correct primary key
  await docClient.send(
    new UpdateCommand({
      TableName: PHOTOS_TABLE,
      Key: {
        id: photo.id,
        createdAt: photo.createdAt,
      },
      UpdateExpression: `
      SET 
        autoTags = :autoTags,
        rekognitionConfidence = :confidence,
        #status = :status,
        updatedAt = :updatedAt
    `,
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
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
    // Find photo by s3Key using scan
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: PHOTOS_TABLE,
        FilterExpression: 's3Key = :s3Key',
        ExpressionAttributeValues: {
          ':s3Key': s3Key,
        },
      })
    );

    if (scanResult.Items && scanResult.Items.length > 0) {
      const photo = scanResult.Items[0];
      await docClient.send(
        new UpdateCommand({
          TableName: PHOTOS_TABLE,
          Key: {
            id: photo.id,
            createdAt: photo.createdAt,
          },
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
