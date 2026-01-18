import { NextRequest, NextResponse } from 'next/server';
import {
  isBunnyStreamEnabled,
  getBunnyPlaybackUrl,
  getBunnyThumbnailUrl,
  getBunnyDirectUrl,
  getBunnyVideoStatus,
  isVideoReady,
  getBunnyStatusLabel,
} from '@/lib/bunny-stream';

/**
 * GET /api/video/[guid]
 * Get video URLs and status from Bunny Stream
 * Returns playback URL, thumbnail URL, and video status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;

    if (!guid) {
      return NextResponse.json(
        { error: 'Video GUID is required' },
        { status: 400 }
      );
    }

    if (!isBunnyStreamEnabled()) {
      return NextResponse.json(
        { error: 'Video streaming is not configured' },
        { status: 503 }
      );
    }

    // Get video status from Bunny
    let status = 4; // Default to finished
    let statusLabel = 'finished';
    let isReady = true;
    let duration = 0;
    let width = 0;
    let height = 0;

    try {
      const videoInfo = await getBunnyVideoStatus(guid);
      status = videoInfo.status;
      statusLabel = getBunnyStatusLabel(status);
      isReady = isVideoReady(status);
      duration = videoInfo.length;
      width = videoInfo.width;
      height = videoInfo.height;
      console.log('[Video API] Video status:', { guid, status, statusLabel, isReady });
    } catch (err) {
      // If we can't get status, assume it might still be processing
      console.error('[Video API] Failed to get Bunny status:', err);
    }

    // Generate video URLs (security handled via allowed domains in Bunny settings)
    const playbackUrl = getBunnyPlaybackUrl(guid);
    const thumbnailUrl = getBunnyThumbnailUrl(guid);
    const directUrl = getBunnyDirectUrl(guid, 720);

    return NextResponse.json({
      guid,
      playbackUrl,
      thumbnailUrl,
      directUrl,
      status,
      statusLabel,
      isReady,
      duration,
      width,
      height,
    });
  } catch (error) {
    console.error('[Video API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get video URLs' },
      { status: 500 }
    );
  }
}
