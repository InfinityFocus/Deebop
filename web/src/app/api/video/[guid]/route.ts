import { NextRequest, NextResponse } from 'next/server';
import {
  isBunnyStreamEnabled,
  isTokenAuthEnabled,
  getBunnyPlaybackUrl,
  getBunnyThumbnailUrl,
  getBunnyDirectUrl,
  getBunnyVideoStatus,
  isVideoReady,
  getBunnyStatusLabel,
} from '@/lib/bunny-stream';

/**
 * GET /api/video/[guid]
 * Get fresh signed URLs for a Bunny Stream video
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

    // Log token auth status for debugging
    const tokenAuthEnabled = isTokenAuthEnabled();
    console.log('[Video API] Token auth enabled:', tokenAuthEnabled);

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

    // Generate fresh signed URLs (valid for 24 hours)
    const playbackUrl = getBunnyPlaybackUrl(guid, 24);
    const thumbnailUrl = getBunnyThumbnailUrl(guid, 24);
    const directUrl = getBunnyDirectUrl(guid, 720, 24);

    console.log('[Video API] Generated URLs:', {
      playbackUrl: playbackUrl.substring(0, 80) + '...',
      tokenAuthEnabled
    });

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
      tokenAuthEnabled, // Include for debugging
    });
  } catch (error) {
    console.error('[Video API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get video URLs' },
      { status: 500 }
    );
  }
}
