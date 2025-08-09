export interface ImageProcessingResult {
  originalKey: string;
  processedKey: string;
  thumbnailKey: string;
  optimizedSize: number;
  thumbnailSize: number;
  width: number;
  height: number;
  format: string;
  tags?: string[];
  confidence?: number;
  processedImage?: Buffer;
  thumbnail?: Buffer;
}

export interface PhotoMetadata {
  id: string;
  userId: string;
  photoId: string;
  s3Key: string;
  processedKey?: string;
  thumbnailKey?: string;
  fileName: string;
  fileSize: number;
  processedSize?: number;
  thumbnailSize?: number;
  mimeType: string;
  width?: number;
  height?: number;
  format?: string;
  tags: string[];
  autoTags?: string[];
  rekognitionConfidence?: number;
  status: 'processing' | 'processed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
