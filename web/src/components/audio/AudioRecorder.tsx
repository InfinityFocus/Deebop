'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2 } from 'lucide-react';
import { useUserTier } from '@/stores/authStore';

// Tier-based recording limits in seconds
const TIER_RECORDING_LIMITS = {
  free: 60, // 1 minute
  creator: 300, // 5 minutes
  pro: 1800, // 30 minutes
  teams: 3600, // 1 hour
};

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number; // Override tier limit
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration,
  className = '',
}: AudioRecorderProps) {
  const tier = useUserTier();
  const limit = maxDuration ?? TIER_RECORDING_LIMITS[tier];

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setPermissionDenied(false);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop at limit
          if (newTime >= limit) {
            stopRecording();
            return limit;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Microphone permission denied');
      } else {
        setError('Failed to access microphone');
      }
    }
  }, [limit]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= limit) {
            stopRecording();
            return limit;
          }
          return newTime;
        });
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setIsPaused(!isPaused);
  }, [isPaused, limit, stopRecording]);

  // Play/Pause preview
  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioUrl]);

  // Discard recording
  const discardRecording = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setIsPlaying(false);
    onCancel?.();
  }, [audioUrl, onCancel]);

  // Submit recording
  const submitRecording = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, recordingTime);
    }
  }, [audioBlob, recordingTime, onRecordingComplete]);

  // Progress percentage
  const progressPercent = (recordingTime / limit) * 100;

  // If we have a recorded audio, show preview
  if (audioBlob && audioUrl) {
    return (
      <div className={`bg-gray-900 rounded-xl p-4 ${className}`}>
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="flex items-center gap-3">
          {/* Play/Pause preview */}
          <button
            onClick={togglePlayback}
            className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
          </button>

          {/* Duration */}
          <div className="flex-1">
            <p className="text-sm text-white">Recording preview</p>
            <p className="text-xs text-gray-400">{formatTime(recordingTime)}</p>
          </div>

          {/* Actions */}
          <button
            onClick={discardRecording}
            className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
            title="Discard"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={submitRecording}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Use Recording
          </button>
        </div>
      </div>
    );
  }

  // Recording interface
  return (
    <div className={`bg-gray-900 rounded-xl p-4 ${className}`}>
      {error && (
        <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
          {permissionDenied && (
            <p className="mt-1 text-xs">
              Please allow microphone access in your browser settings.
            </p>
          )}
        </div>
      )}

      {/* Recording progress */}
      {isRecording && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{formatTime(recordingTime)}</span>
            <span>Max: {formatTime(limit)}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent > 90 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          // Start recording button
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-white rounded-full font-medium transition-colors"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        ) : (
          // Recording controls
          <>
            {/* Pause/Resume */}
            <button
              onClick={togglePause}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
            </button>

            {/* Recording indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                }`}
              />
              <span className="text-white font-mono text-lg">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* Stop */}
            <button
              onClick={stopRecording}
              className="p-3 rounded-full bg-red-500 hover:bg-red-400 text-white transition-colors"
              title="Stop"
            >
              <Square className="w-5 h-5" fill="currentColor" />
            </button>
          </>
        )}
      </div>

      {!isRecording && (
        <p className="mt-3 text-center text-xs text-gray-500">
          {tier === 'free'
            ? 'Free tier: up to 1 minute'
            : tier === 'creator'
              ? 'Creator tier: up to 5 minutes'
              : tier === 'teams'
                ? 'Teams tier: up to 1 hour'
                : 'Pro tier: up to 30 minutes'}
        </p>
      )}
    </div>
  );
}

export default AudioRecorder;
