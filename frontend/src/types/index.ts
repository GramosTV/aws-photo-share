// Types for the photo sharing application

export interface Photo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  processedUrl?: string;
  processedKey?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
  autoTags?: string[];
  manualTags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  rekognitionConfidence?: number;
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
