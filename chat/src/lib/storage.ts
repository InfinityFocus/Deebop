import { getServiceClient } from './db';

// Storage bucket name for voice messages
const VOICE_BUCKET = 'voice-messages';

/**
 * Upload a voice message to Supabase Storage
 * @param childId - The child's ID (used in path)
 * @param file - The audio blob
 * @returns The public URL of the uploaded file
 */
export async function uploadVoiceMessage(
  childId: string,
  file: Buffer | Blob,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getServiceClient();

  // Generate unique key
  const timestamp = Date.now();
  const key = `${childId}/${timestamp}.webm`;

  // Convert Blob to Buffer if needed
  const fileData = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

  // Upload to storage
  const { error: uploadError } = await client
    .storage
    .from(VOICE_BUCKET)
    .upload(key, fileData, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Failed to upload voice message: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = client
    .storage
    .from(VOICE_BUCKET)
    .getPublicUrl(key);

  return {
    key,
    url: urlData.publicUrl,
  };
}

/**
 * Delete a voice message from storage
 * @param key - The storage key
 */
export async function deleteVoiceMessage(key: string): Promise<void> {
  const client = getServiceClient();

  const { error } = await client
    .storage
    .from(VOICE_BUCKET)
    .remove([key]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete voice message: ${error.message}`);
  }
}

/**
 * Get a signed URL for a voice message (if using private bucket)
 * @param key - The storage key
 * @param expiresIn - Expiry time in seconds (default 1 hour)
 */
export async function getSignedVoiceUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getServiceClient();

  const { data, error } = await client
    .storage
    .from(VOICE_BUCKET)
    .createSignedUrl(key, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
