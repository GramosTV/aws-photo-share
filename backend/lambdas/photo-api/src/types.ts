export interface Photo {
  id: string; // Primary key (same as photoId)
  userId: string;
  photoId: string;
  title: string;
  description?: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
  thumbnailKey?: string;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  status?: 'processing' | 'processed' | 'failed';
  sharedWith?: string[];
}

export interface CreatePhotoRequest {
  title?: string;
  description?: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface SharePhotoRequest {
  isPublic?: boolean;
  sharedWith?: string[];
}

export interface GetUploadUrlRequest {
  fileName: string;
  fileType: string;
}

export interface GetUploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  fields: {
    key: string;
    'Content-Type': string;
  };
}

export interface ApiResponse<T = any> {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
