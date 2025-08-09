// Types for the photo sharing application

export interface Photo {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  photoUrl: string; // Generated signed URL for the main image
  thumbnailUrl?: string; // Generated signed URL for thumbnail
  processedUrl?: string;
  processedKey?: string;
  thumbnailKey?: string;
  userId: string;
  photoId: string;
  createdAt: string;
  updatedAt: string;
  status: 'processing' | 'processed' | 'failed'; // Processing status
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
  autoTags?: string[];
  manualTags?: string[];
  tags?: string[]; // Combined tags
  isPublic: boolean;
  dimensions?: {
    width: number;
    height: number;
  };
  rekognitionConfidence?: number;
  url?: string; // Legacy fallback
}

export interface FileWithMetadata extends File {
  title: string;
  preview?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}
