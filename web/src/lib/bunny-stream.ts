/**
 * Bunny Stream Integration
 * Handles video upload, management, and playback URLs
 *
 * Bunny Stream automatically transcodes videos to multiple resolutions
 * and provides HLS adaptive streaming.
 */

import crypto from 'crypto';

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_STREAM_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME;
// Token authentication key from Bunny Stream library settings
const BUNNY_STREAM_TOKEN_KEY = process.env.BUNNY_STREAM_TOKEN_KEY;

const BUNNY_API_BASE = 'https://video.bunnycdn.com/library';

export function isBunnyStreamEnabled(): boolean {
  return !!(BUNNY_STREAM_API_KEY && BUNNY_STREAM_LIBRARY_ID && BUNNY_STREAM_CDN_HOSTNAME);
}

export function isTokenAuthEnabled(): boolean {
  return !!BUNNY_STREAM_TOKEN_KEY;
}

/**
 * Generate a signed token for Bunny CDN Token Authentication
 * Format: Base64_URLSafe(SHA256_RAW(tokenKey + urlPath + expiryTimestamp))
 *
 * This is different from Embed Token Auth which uses:
 * SHA256_HEX(tokenKey + videoId + expiry)
 *
 * CDN Token Auth is required for direct HLS/video URL access.
 * @see https://docs.bunny.net/docs/cdn-token-authentication
 */
function generateCdnToken(urlPath: string, expiryTimestamp: number): string {
  if (!BUNNY_STREAM_TOKEN_KEY) {
    throw new Error('BUNNY_STREAM_TOKEN_KEY is not configured');
  }

  // CDN Token format: Base64(SHA256_RAW(key + path + expiry))
  const stringToHash = BUNNY_STREAM_TOKEN_KEY + urlPath + expiryTimestamp.toString();
  const hash = crypto.createHash('sha256').update(stringToHash).digest('base64');

  // URL-safe Base64: replace + with -, / with _, remove = and newlines
  return hash
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function getBunnyConfig() {
  if (!isBunnyStreamEnabled()) {
    throw new Error('Bunny Stream is not configured. Set BUNNY_STREAM_API_KEY, BUNNY_STREAM_LIBRARY_ID, and BUNNY_STREAM_CDN_HOSTNAME.');
  }
  return {
    apiKey: BUNNY_STREAM_API_KEY!,
    libraryId: BUNNY_STREAM_LIBRARY_ID!,
    cdnHostname: BUNNY_STREAM_CDN_HOSTNAME!,
  };
}

interface BunnyVideoResponse {
  videoLibraryId: number;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number;
  status: number; // 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=finished, 5=error
  framerate: number;
  rotation: number | null;
  width: number;
  height: number;
  availableResolutions: string;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  captions: unknown[];
  hasMP4Fallback: boolean;
  collectionId: string;
  thumbnailFileName: string;
  averageWatchTime: number;
  totalWatchTime: number;
  category: string;
  chapters: unknown[];
  moments: unknown[];
  metaTags: unknown[];
  transcodingMessages: unknown[];
}

/**
 * Create a new video in Bunny Stream library
 * Returns the video GUID needed for upload
 */
export async function createBunnyVideo(title: string): Promise<{ guid: string }> {
  const { apiKey, libraryId } = getBunnyConfig();

  const response = await fetch(`${BUNNY_API_BASE}/${libraryId}/videos`, {
    method: 'POST',
    headers: {
      'AccessKey': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[BunnyStream] Create video failed:', response.status, errorText);
    throw new Error(`Failed to create Bunny video: ${response.status}`);
  }

  const data: BunnyVideoResponse = await response.json();
  return { guid: data.guid };
}

/**
 * Upload video file to Bunny Stream
 * The video must be created first with createBunnyVideo()
 */
export async function uploadToBunnyStream(videoGuid: string, buffer: Buffer): Promise<void> {
  const { apiKey, libraryId } = getBunnyConfig();

  // Convert Buffer to Uint8Array for fetch compatibility
  const uint8Array = new Uint8Array(buffer);

  const response = await fetch(`${BUNNY_API_BASE}/${libraryId}/videos/${videoGuid}`, {
    method: 'PUT',
    headers: {
      'AccessKey': apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: uint8Array,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[BunnyStream] Upload failed:', response.status, errorText);
    throw new Error(`Failed to upload to Bunny Stream: ${response.status}`);
  }
}

/**
 * Get video status and details from Bunny Stream
 */
export async function getBunnyVideoStatus(videoGuid: string): Promise<BunnyVideoResponse> {
  const { apiKey, libraryId } = getBunnyConfig();

  const response = await fetch(`${BUNNY_API_BASE}/${libraryId}/videos/${videoGuid}`, {
    method: 'GET',
    headers: {
      'AccessKey': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Bunny video status: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a video from Bunny Stream
 */
export async function deleteBunnyVideo(videoGuid: string): Promise<void> {
  const { apiKey, libraryId } = getBunnyConfig();

  const response = await fetch(`${BUNNY_API_BASE}/${libraryId}/videos/${videoGuid}`, {
    method: 'DELETE',
    headers: {
      'AccessKey': apiKey,
    },
  });

  if (!response.ok) {
    console.error('[BunnyStream] Delete failed:', response.status);
    throw new Error(`Failed to delete Bunny video: ${response.status}`);
  }
}

/**
 * Get the HLS playlist URL for a video
 * This is the main playback URL for adaptive streaming
 * If token auth is enabled, returns a signed URL using CDN Token Authentication
 * Uses token_path to sign the entire video directory (so .ts segments also work)
 * @see https://docs.bunny.net/docs/cdn-token-authentication
 * @param expiryHours - How long the signed URL should be valid (default 24 hours)
 */
export function getBunnyPlaybackUrl(videoGuid: string, expiryHours: number = 24): string {
  const { cdnHostname } = getBunnyConfig();
  const baseUrl = `https://${cdnHostname}/${videoGuid}/playlist.m3u8`;

  if (isTokenAuthEnabled()) {
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    // Use token_path to sign the entire video directory (so .ts segments also work)
    const tokenPath = `/${videoGuid}/`;
    const token = generateCdnToken(tokenPath, expiryTimestamp);
    // token_path must be URL encoded
    const encodedTokenPath = encodeURIComponent(tokenPath);
    return `${baseUrl}?token=${token}&expires=${expiryTimestamp}&token_path=${encodedTokenPath}`;
  }

  return baseUrl;
}

/**
 * Get the direct MP4 URL for a specific resolution
 * Resolutions available: 240, 360, 480, 720, 1080
 * If token auth is enabled, returns a signed URL using CDN Token Authentication
 */
export function getBunnyDirectUrl(videoGuid: string, resolution: number = 720, expiryHours: number = 24): string {
  const { cdnHostname } = getBunnyConfig();
  const urlPath = `/${videoGuid}/play_${resolution}p.mp4`;
  const baseUrl = `https://${cdnHostname}${urlPath}`;

  if (isTokenAuthEnabled()) {
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    const token = generateCdnToken(urlPath, expiryTimestamp);
    return `${baseUrl}?token=${token}&expires=${expiryTimestamp}`;
  }

  return baseUrl;
}

/**
 * Get the thumbnail URL for a video
 * If token auth is enabled, returns a signed URL using CDN Token Authentication
 */
export function getBunnyThumbnailUrl(videoGuid: string, expiryHours: number = 24): string {
  const { cdnHostname } = getBunnyConfig();
  const urlPath = `/${videoGuid}/thumbnail.jpg`;
  const baseUrl = `https://${cdnHostname}${urlPath}`;

  if (isTokenAuthEnabled()) {
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    const token = generateCdnToken(urlPath, expiryTimestamp);
    return `${baseUrl}?token=${token}&expires=${expiryTimestamp}`;
  }

  return baseUrl;
}

/**
 * Get animated preview/gif URL
 * If token auth is enabled, returns a signed URL using CDN Token Authentication
 */
export function getBunnyPreviewUrl(videoGuid: string, expiryHours: number = 24): string {
  const { cdnHostname } = getBunnyConfig();
  const urlPath = `/${videoGuid}/preview.webp`;
  const baseUrl = `https://${cdnHostname}${urlPath}`;

  if (isTokenAuthEnabled()) {
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    const token = generateCdnToken(urlPath, expiryTimestamp);
    return `${baseUrl}?token=${token}&expires=${expiryTimestamp}`;
  }

  return baseUrl;
}

/**
 * Map Bunny status code to human-readable status
 */
export function getBunnyStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'created';
    case 1: return 'uploaded';
    case 2: return 'processing';
    case 3: return 'transcoding';
    case 4: return 'finished';
    case 5: return 'error';
    default: return 'unknown';
  }
}

/**
 * Check if video is ready for playback
 */
export function isVideoReady(status: number): boolean {
  return status === 4; // finished
}
