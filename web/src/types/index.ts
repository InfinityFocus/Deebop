/**
 * Type exports
 */

export * from './database';

// Content filter types (for feed tabs)
export type ContentFilter = 'all' | 'images' | 'videos' | 'panoramas' | 'shouts';

// Feed item with resolved relations
export interface FeedItem {
  id: string;
  type: 'post' | 'ad' | 'boost';
  post?: import('./database').PostWithEngagement;
  ad?: {
    id: string;
    image_url: string;
    headline: string;
    description?: string;
    destination_url: string;
  };
}

// Media upload state
export interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

// Presigned URL response
export interface PresignedUrlResponse {
  upload_url: string;
  storage_key: string;
  expires_in: number;
}
