import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  Photo,
  CreatePhotoRequest,
  SharePhotoRequest,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
  ApiResponse,
  ErrorResponse,
} from './types';

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.REGION });

const PHOTOS_TABLE = process.env.PHOTOS_TABLE!;
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET!;
const THUMBNAILS_BUCKET = process.env.THUMBNAILS_BUCKET!;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
};

function getUserIdFromEvent(event: APIGatewayProxyEvent): string {
  const claims = event.requestContext.authorizer?.claims;
  if (!claims || !claims.sub) {
    throw new Error('User not authenticated');
  }
  return claims.sub;
}

function createResponse<T>(statusCode: number, body: T | ErrorResponse): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

async function getPhotos(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);

    const command = new QueryCommand({
      TableName: PHOTOS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Most recent first
    });

    const result = await docClient.send(command);

    // Generate presigned URLs for photos and thumbnails
    const photosWithUrls = await Promise.all(
      (result.Items as Photo[]).map(async (photo) => {
        const photoUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: PHOTOS_BUCKET,
            Key: photo.s3Key,
          }),
          { expiresIn: 3600 }
        );

        let thumbnailUrl: string | null = null;
        if (photo.thumbnailKey) {
          thumbnailUrl = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: THUMBNAILS_BUCKET,
              Key: photo.thumbnailKey,
            }),
            { expiresIn: 3600 }
          );
        }

        return {
          ...photo,
          photoUrl,
          thumbnailUrl,
        };
      })
    );

    return createResponse(200, { photos: photosWithUrls });
  } catch (error) {
    console.error('Error getting photos:', error);
    return createResponse(500, { error: 'Failed to get photos' });
  }
}

async function createPhoto(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const body: CreatePhotoRequest = JSON.parse(event.body);

    if (!body.s3Key || !body.fileName || !body.fileSize || !body.mimeType) {
      return createResponse(400, { error: 'Missing required fields: s3Key, fileName, fileSize, mimeType' });
    }

    const photoId = uuidv4();
    const now = new Date().toISOString();

    const photo: Photo = {
      userId,
      photoId,
      title: body.title || 'Untitled',
      description: body.description || '',
      s3Key: body.s3Key,
      fileName: body.fileName,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      createdAt: now,
      updatedAt: now,
      isPublic: body.isPublic || false,
      tags: body.tags || [],
      status: 'processing',
    };

    const command = new PutCommand({
      TableName: PHOTOS_TABLE,
      Item: photo,
    });

    await docClient.send(command);

    return createResponse(201, { photo });
  } catch (error) {
    console.error('Error creating photo:', error);
    return createResponse(500, { error: 'Failed to create photo' });
  }
}

async function getPhoto(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const photoId = event.pathParameters?.photoId;

    if (!photoId) {
      return createResponse(400, { error: 'photoId is required' });
    }

    const command = new GetCommand({
      TableName: PHOTOS_TABLE,
      Key: {
        userId,
        photoId,
      },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return createResponse(404, { error: 'Photo not found' });
    }

    const photo = result.Item as Photo;

    // Generate presigned URLs
    const photoUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: PHOTOS_BUCKET,
        Key: photo.s3Key,
      }),
      { expiresIn: 3600 }
    );

    let thumbnailUrl: string | null = null;
    if (photo.thumbnailKey) {
      thumbnailUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: THUMBNAILS_BUCKET,
          Key: photo.thumbnailKey,
        }),
        { expiresIn: 3600 }
      );
    }

    return createResponse(200, {
      photo: {
        ...photo,
        photoUrl,
        thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Error getting photo:', error);
    return createResponse(500, { error: 'Failed to get photo' });
  }
}

async function deletePhoto(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const photoId = event.pathParameters?.photoId;

    if (!photoId) {
      return createResponse(400, { error: 'photoId is required' });
    }

    // First get the photo to get S3 keys
    const getCommand = new GetCommand({
      TableName: PHOTOS_TABLE,
      Key: {
        userId,
        photoId,
      },
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return createResponse(404, { error: 'Photo not found' });
    }

    const photo = result.Item as Photo;

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: PHOTOS_BUCKET,
        Key: photo.s3Key,
      })
    );

    if (photo.thumbnailKey) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: THUMBNAILS_BUCKET,
          Key: photo.thumbnailKey,
        })
      );
    }

    // Delete from DynamoDB
    const deleteCommand = new DeleteCommand({
      TableName: PHOTOS_TABLE,
      Key: {
        userId,
        photoId,
      },
    });

    await docClient.send(deleteCommand);

    return createResponse(200, { message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return createResponse(500, { error: 'Failed to delete photo' });
  }
}

async function sharePhoto(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const photoId = event.pathParameters?.photoId;

    if (!photoId) {
      return createResponse(400, { error: 'photoId is required' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const body: SharePhotoRequest = JSON.parse(event.body);

    // Get the photo
    const getCommand = new GetCommand({
      TableName: PHOTOS_TABLE,
      Key: {
        userId,
        photoId,
      },
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return createResponse(404, { error: 'Photo not found' });
    }

    const photo = result.Item as Photo;

    // Update photo with sharing settings
    const updateCommand = new PutCommand({
      TableName: PHOTOS_TABLE,
      Item: {
        ...photo,
        isPublic: body.isPublic || false,
        sharedWith: body.sharedWith || [],
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(updateCommand);

    return createResponse(200, { message: 'Photo sharing updated successfully' });
  } catch (error) {
    console.error('Error sharing photo:', error);
    return createResponse(500, { error: 'Failed to update photo sharing' });
  }
}

async function getUploadUrl(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const body: GetUploadUrlRequest = JSON.parse(event.body);

    if (!body.fileName || !body.fileType) {
      return createResponse(400, { error: 'fileName and fileType are required' });
    }

    const fileName = body.fileName;
    const fileType = body.fileType;
    const s3Key = `uploads/${userId}/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: PHOTOS_BUCKET,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        userId: userId,
        originalFileName: fileName,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

    const response: GetUploadUrlResponse = {
      uploadUrl,
      s3Key,
      fields: {
        key: s3Key,
        'Content-Type': fileType,
      },
    };

    return createResponse(200, response);
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return createResponse(500, { error: 'Failed to generate upload URL' });
  }
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }

  const route = event.resource;
  const method = event.httpMethod;

  try {
    switch (`${method} ${route}`) {
      case 'GET /photos':
        return await getPhotos(event);
      case 'POST /photos':
        return await createPhoto(event);
      case 'GET /photos/{photoId}':
        return await getPhoto(event);
      case 'DELETE /photos/{photoId}':
        return await deletePhoto(event);
      case 'POST /photos/{photoId}/share':
        return await sharePhoto(event);
      case 'POST /upload-url':
        return await getUploadUrl(event);
      default:
        return createResponse(404, { error: 'Route not found' });
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
