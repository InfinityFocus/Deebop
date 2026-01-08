import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Audio metadata interface
export interface AudioMetadata {
  duration: number;
  codec: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
}

// Tier limits interface for audio
export interface AudioTierLimits {
  maxDuration: number;
  maxFileSizeMB: number;
  outputBitrate: string;
}

// Tier-based audio limits
export const TIER_AUDIO_LIMITS: Record<string, AudioTierLimits> = {
  free: {
    maxDuration: 60,
    maxFileSizeMB: 10,
    outputBitrate: '128k',
  },
  standard: {
    maxDuration: 300, // 5 minutes
    maxFileSizeMB: 50,
    outputBitrate: '192k',
  },
  pro: {
    maxDuration: 1800, // 30 minutes
    maxFileSizeMB: 200,
    outputBitrate: '256k',
  },
};

// Validation result
export interface AudioValidationResult {
  valid: boolean;
  errors: string[];
}

// Waveform data structure
export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

/**
 * Get audio metadata using FFprobe
 */
export async function getAudioMetadata(inputPath: string): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get audio metadata: ${err.message}`));
        return;
      }

      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
      if (!audioStream) {
        reject(new Error('No audio stream found'));
        return;
      }

      const duration = metadata.format.duration || 0;
      const codec = audioStream.codec_name || 'unknown';
      const bitrate = metadata.format.bit_rate ? Number(metadata.format.bit_rate) : 0;
      const sampleRate = audioStream.sample_rate ? Number(audioStream.sample_rate) : 44100;
      const channels = audioStream.channels || 2;

      resolve({
        duration,
        codec,
        bitrate,
        sampleRate,
        channels,
      });
    });
  });
}

/**
 * Validate audio against tier limits
 */
export function validateAudioForTier(
  metadata: AudioMetadata,
  fileSizeBytes: number,
  tier: string
): AudioValidationResult {
  const limits = TIER_AUDIO_LIMITS[tier] || TIER_AUDIO_LIMITS.free;
  const errors: string[] = [];

  // Check duration
  if (metadata.duration > limits.maxDuration) {
    const maxMinutes = Math.floor(limits.maxDuration / 60);
    const durationMinutes = Math.floor(metadata.duration / 60);
    const durationSeconds = Math.floor(metadata.duration % 60);
    errors.push(
      `Audio duration (${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}) exceeds ${tier} tier limit of ${maxMinutes} minutes`
    );
  }

  // Check file size
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  if (fileSizeMB > limits.maxFileSizeMB) {
    errors.push(
      `File size (${fileSizeMB.toFixed(1)}MB) exceeds ${tier} tier limit of ${limits.maxFileSizeMB}MB`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize and transcode audio to AAC/M4A with loudness normalization
 */
export async function normalizeAudio(
  inputPath: string,
  outputPath: string,
  bitrate: string = '128k',
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath)
      .audioCodec('aac')
      .audioBitrate(bitrate)
      .audioChannels(2)
      .audioFrequency(44100)
      .audioFilters([
        // EBU R128 loudness normalization
        'loudnorm=I=-16:TP=-1.5:LRA=11',
      ])
      .outputOptions([
        '-movflags +faststart', // Enable fast start for web playback
      ])
      .output(outputPath);

    if (onProgress) {
      command.on('progress', (progress) => {
        if (progress.percent) {
          onProgress(Math.round(progress.percent));
        }
      });
    }

    command
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`Audio normalization failed: ${err.message}`)))
      .run();
  });
}

/**
 * Generate waveform data from audio file
 * Returns an array of peak values (0-1) for visualization
 */
export async function generateWaveformData(
  inputPath: string,
  numPeaks: number = 200
): Promise<WaveformData> {
  return new Promise((resolve, reject) => {
    // Get audio duration first
    ffmpeg.ffprobe(inputPath, async (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to analyze audio: ${err.message}`));
        return;
      }

      const duration = metadata.format.duration || 0;
      const sampleRate = 44100;

      // Use FFmpeg to extract audio samples and calculate peaks
      // We'll downsample to get approximately numPeaks samples
      const samplesPerPeak = Math.max(1, Math.floor((duration * sampleRate) / numPeaks));

      const tempWavPath = inputPath.replace(/\.[^.]+$/, '_waveform.raw');

      try {
        // Extract raw audio samples
        await new Promise<void>((res, rej) => {
          ffmpeg(inputPath)
            .audioChannels(1)
            .audioFrequency(sampleRate)
            .format('f32le') // 32-bit float little-endian
            .output(tempWavPath)
            .on('end', () => res())
            .on('error', (e) => rej(e))
            .run();
        });

        // Read raw samples and calculate peaks
        const rawData = fs.readFileSync(tempWavPath);
        const samples = new Float32Array(rawData.buffer, rawData.byteOffset, rawData.length / 4);

        const peaks: number[] = [];
        const totalSamples = samples.length;
        const samplesPerChunk = Math.floor(totalSamples / numPeaks);

        for (let i = 0; i < numPeaks; i++) {
          const start = i * samplesPerChunk;
          const end = Math.min(start + samplesPerChunk, totalSamples);

          let maxAbs = 0;
          for (let j = start; j < end; j++) {
            const abs = Math.abs(samples[j]);
            if (abs > maxAbs) maxAbs = abs;
          }

          // Normalize to 0-1 range
          peaks.push(Math.min(1, maxAbs));
        }

        // Clean up temp file
        try {
          fs.unlinkSync(tempWavPath);
        } catch {
          // Ignore cleanup errors
        }

        resolve({
          peaks,
          duration,
          sampleRate,
        });
      } catch (error) {
        // Clean up on error
        try {
          fs.unlinkSync(tempWavPath);
        } catch {
          // Ignore cleanup errors
        }
        reject(error);
      }
    });
  });
}

/**
 * Create a temporary directory for audio processing
 */
export function createAudioTempDir(): string {
  const tempDir = path.join(os.tmpdir(), `audio-processing-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Clean up temporary files
 */
export function cleanupAudioTempDir(tempDir: string): void {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Failed to cleanup temp dir:', error);
  }
}

/**
 * Format audio duration for display
 */
export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
