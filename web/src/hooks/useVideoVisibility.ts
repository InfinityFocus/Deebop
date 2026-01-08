'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVideoVisibilityOptions {
  threshold?: number;
  onVisible?: () => void;
  onHidden?: () => void;
}

export function useVideoVisibility(options: UseVideoVisibilityOptions = {}) {
  const { threshold = 0.7, onVisible, onHidden } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const visible = entry.isIntersecting && entry.intersectionRatio >= threshold;

        setIsVisible(visible);

        if (visible) {
          onVisible?.();
        } else {
          onHidden?.();
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [threshold, onVisible, onHidden]);

  return { videoRef, isVisible };
}

interface UseViewTrackingOptions {
  postId: string;
  minViewDuration?: number; // seconds
  enabled?: boolean;
}

export function useViewTracking(options: UseViewTrackingOptions) {
  const { postId, minViewDuration = 3, enabled = true } = options;
  const viewStartTime = useRef<number | null>(null);
  const hasTrackedView = useRef(false);

  const startTracking = useCallback(() => {
    if (!enabled || hasTrackedView.current) return;
    viewStartTime.current = Date.now();
  }, [enabled]);

  const stopTracking = useCallback(async () => {
    if (!enabled || hasTrackedView.current || !viewStartTime.current) return;

    const viewDuration = (Date.now() - viewStartTime.current) / 1000;
    viewStartTime.current = null;

    if (viewDuration >= minViewDuration) {
      hasTrackedView.current = true;

      try {
        await fetch(`/api/posts/${postId}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: viewDuration }),
        });
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    }
  }, [postId, minViewDuration, enabled]);

  const resetTracking = useCallback(() => {
    viewStartTime.current = null;
    hasTrackedView.current = false;
  }, []);

  return { startTracking, stopTracking, resetTracking };
}
