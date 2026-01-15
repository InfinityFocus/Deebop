'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, X } from 'lucide-react';

// Max recording duration for kids (30 seconds)
const MAX_DURATION = 30;

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  disabled,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Stop recording function (declared before useCallback that uses it)
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder with best available format
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
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Please allow microphone access to record voice messages');
      } else {
        setError('Could not access microphone');
      }
    }
  }, [stopRecording]);

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
    onCancel();
  }, [audioUrl, onCancel]);

  // Submit recording
  const submitRecording = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, recordingTime);
    }
  }, [audioBlob, recordingTime, onRecordingComplete]);

  // Progress percentage
  const progressPercent = (recordingTime / MAX_DURATION) * 100;

  // Error state
  if (error) {
    return (
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Check your browser settings to enable microphone access.
        </p>
      </div>
    );
  }

  // Preview state (recording done, ready to send or discard)
  if (audioBlob && audioUrl) {
    return (
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlayback}
            className="p-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Duration */}
          <div className="flex-1">
            <p className="text-sm text-white">Voice message</p>
            <p className="text-xs text-gray-400">{formatTime(recordingTime)}</p>
          </div>

          {/* Discard */}
          <button
            onClick={discardRecording}
            className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
            title="Discard"
          >
            <Trash2 size={20} />
          </button>

          {/* Send */}
          <button
            onClick={submitRecording}
            disabled={disabled}
            className="p-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50"
            title="Send"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Recording state
  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      {/* Progress bar */}
      {isRecording && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{formatTime(recordingTime)}</span>
            <span>{formatTime(MAX_DURATION)}</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent > 80 ? 'bg-red-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {!isRecording ? (
          // Start recording
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-full font-medium transition-colors"
          >
            <Mic size={18} />
            Tap to record
          </button>
        ) : (
          // Recording in progress
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-mono">{formatTime(recordingTime)}</span>
            </div>
            <button
              onClick={stopRecording}
              className="p-3 bg-red-500 hover:bg-red-400 text-white rounded-full transition-colors"
              title="Stop"
            >
              <Square size={20} fill="currentColor" />
            </button>
          </div>
        )}

        <div className="w-8" /> {/* Spacer */}
      </div>

      {!isRecording && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Up to {MAX_DURATION} seconds
        </p>
      )}
    </div>
  );
}
