/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_USER_POOL_CLIENT_ID: string;
  readonly VITE_API_GATEWAY_URL: string;
  readonly VITE_PHOTOS_BUCKET_NAME: string;
  readonly VITE_THUMBNAILS_BUCKET_NAME: string;
  readonly VITE_CLOUDFRONT_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
