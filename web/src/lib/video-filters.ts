/**
 * Video Filter Presets
 * CSS filters for live preview, FFmpeg filters for server-side burn-in
 */

export interface VideoFilter {
  id: string;
  name: string;
  description: string;
  /**
   * CSS filter string for live preview in the browser
   * Applied via canvas.style.filter or element style
   */
  css: string;
  /**
   * FFmpeg filter string for server-side processing
   * null means no filter applied
   */
  ffmpeg: string | null;
  /**
   * Thumbnail background gradient for filter selector UI
   */
  thumbnail: string;
}

export const VIDEO_FILTERS: Record<string, VideoFilter> = {
  none: {
    id: 'none',
    name: 'None',
    description: 'Original video, no filter applied',
    css: 'none',
    ffmpeg: null,
    thumbnail: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Warm, faded retro look',
    css: 'sepia(0.35) saturate(0.85) contrast(0.95) brightness(1.05)',
    ffmpeg: 'colorbalance=rs=0.2:gs=-0.05:bs=-0.15,curves=master=0/0.05 1/0.95',
    thumbnail: 'linear-gradient(135deg, #d4a574 0%, #a67c52 100%)',
  },
  blackAndWhite: {
    id: 'blackAndWhite',
    name: 'B&W',
    description: 'Classic black and white',
    css: 'grayscale(1) contrast(1.1)',
    ffmpeg: 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3,eq=contrast=1.1',
    thumbnail: 'linear-gradient(135deg, #e0e0e0 0%, #4a4a4a 100%)',
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    description: 'Cozy, golden tones',
    css: 'sepia(0.15) saturate(1.25) brightness(1.05)',
    ffmpeg: 'colorbalance=rs=0.12:gs=0.05:bs=-0.08',
    thumbnail: 'linear-gradient(135deg, #ffc371 0%, #ff5f6d 100%)',
  },
  cool: {
    id: 'cool',
    name: 'Cool',
    description: 'Fresh, blue-tinted tones',
    css: 'hue-rotate(10deg) saturate(1.1) brightness(1.02)',
    ffmpeg: 'colorbalance=rs=-0.08:gs=0:bs=0.12',
    thumbnail: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  },
  highContrast: {
    id: 'highContrast',
    name: 'Contrast',
    description: 'Bold, punchy colors',
    css: 'contrast(1.35) saturate(1.2)',
    ffmpeg: 'eq=contrast=1.35:saturation=1.2',
    thumbnail: 'linear-gradient(135deg, #0f0f0f 0%, #ffffff 100%)',
  },
  fade: {
    id: 'fade',
    name: 'Fade',
    description: 'Soft, matte look',
    css: 'contrast(0.85) brightness(1.1) saturate(0.9)',
    ffmpeg: 'curves=master=0/0.1 1/0.9,eq=saturation=0.9',
    thumbnail: 'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)',
  },
  cinema: {
    id: 'cinema',
    name: 'Cinema',
    description: 'Cinematic color grading',
    css: 'contrast(1.15) saturate(1.1) brightness(0.98) sepia(0.05)',
    ffmpeg: 'colorbalance=rs=0.05:gs=-0.03:bs=0.08,eq=contrast=1.15:saturation=1.1:brightness=-0.02',
    thumbnail: 'linear-gradient(135deg, #2c3e50 0%, #4a6741 100%)',
  },
  vivid: {
    id: 'vivid',
    name: 'Vivid',
    description: 'Vibrant, saturated colors',
    css: 'saturate(1.5) contrast(1.1) brightness(1.05)',
    ffmpeg: 'eq=saturation=1.5:contrast=1.1:brightness=0.05',
    thumbnail: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #ffe66d 100%)',
  },
  moody: {
    id: 'moody',
    name: 'Moody',
    description: 'Dark, atmospheric tones',
    css: 'brightness(0.9) contrast(1.2) saturate(0.85) sepia(0.1)',
    ffmpeg: 'eq=brightness=-0.1:contrast=1.2:saturation=0.85,colorbalance=rs=0.03:gs=-0.02:bs=0.05',
    thumbnail: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Golden hour warmth',
    css: 'sepia(0.25) saturate(1.3) brightness(1.05) hue-rotate(-5deg)',
    ffmpeg: 'colorbalance=rs=0.18:gs=0.08:bs=-0.1,eq=saturation=1.3:brightness=0.05',
    thumbnail: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    description: 'High contrast black and white',
    css: 'grayscale(1) contrast(1.4) brightness(0.95)',
    ffmpeg: 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3,eq=contrast=1.4:brightness=-0.05',
    thumbnail: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #333333 100%)',
  },
};

/**
 * Get all available filters as an array for UI rendering
 */
export const getFilterList = (): VideoFilter[] => Object.values(VIDEO_FILTERS);

/**
 * Get a specific filter by ID
 */
export const getFilter = (filterId: string): VideoFilter => {
  return VIDEO_FILTERS[filterId] || VIDEO_FILTERS.none;
};

/**
 * Get CSS filter string for a filter ID
 */
export const getCssFilter = (filterId: string | null): string => {
  if (!filterId) return 'none';
  return VIDEO_FILTERS[filterId]?.css || 'none';
};

/**
 * Get FFmpeg filter string for a filter ID
 */
export const getFfmpegFilter = (filterId: string | null): string | null => {
  if (!filterId) return null;
  return VIDEO_FILTERS[filterId]?.ffmpeg || null;
};

/**
 * Speed adjustment presets
 */
export interface SpeedPreset {
  value: number;
  label: string;
  ffmpegVideo: string;
  ffmpegAudio: string;
}

export const SPEED_PRESETS: SpeedPreset[] = [
  { value: 0.25, label: '0.25x', ffmpegVideo: 'setpts=4*PTS', ffmpegAudio: 'atempo=0.5,atempo=0.5' },
  { value: 0.5, label: '0.5x', ffmpegVideo: 'setpts=2*PTS', ffmpegAudio: 'atempo=0.5' },
  { value: 0.75, label: '0.75x', ffmpegVideo: 'setpts=1.33*PTS', ffmpegAudio: 'atempo=0.75' },
  { value: 1, label: '1x', ffmpegVideo: '', ffmpegAudio: '' },
  { value: 1.25, label: '1.25x', ffmpegVideo: 'setpts=0.8*PTS', ffmpegAudio: 'atempo=1.25' },
  { value: 1.5, label: '1.5x', ffmpegVideo: 'setpts=0.67*PTS', ffmpegAudio: 'atempo=1.5' },
  { value: 2, label: '2x', ffmpegVideo: 'setpts=0.5*PTS', ffmpegAudio: 'atempo=2' },
];

/**
 * Get FFmpeg filter for speed adjustment
 * Returns both video and audio filters
 */
export const getSpeedFilters = (
  speed: number
): { video: string; audio: string } => {
  // Handle exact preset matches first
  const preset = SPEED_PRESETS.find((p) => p.value === speed);
  if (preset) {
    return { video: preset.ffmpegVideo, audio: preset.ffmpegAudio };
  }

  // Calculate custom speed filters
  if (speed === 1) {
    return { video: '', audio: '' };
  }

  const videoPts = (1 / speed).toFixed(3);
  const videoFilter = `setpts=${videoPts}*PTS`;

  // FFmpeg atempo only supports 0.5-2.0 range, need to chain for extremes
  let audioFilter = '';
  if (speed > 0 && speed < 0.5) {
    // Chain multiple atempo filters for very slow speeds
    const factor1 = 0.5;
    const factor2 = speed / 0.5;
    audioFilter = `atempo=${factor1},atempo=${factor2.toFixed(3)}`;
  } else if (speed > 2) {
    // Chain multiple atempo filters for very fast speeds
    const factor1 = 2;
    const factor2 = speed / 2;
    audioFilter = `atempo=${factor1},atempo=${factor2.toFixed(3)}`;
  } else {
    audioFilter = `atempo=${speed}`;
  }

  return { video: videoFilter, audio: audioFilter };
};

/**
 * Font options for text overlays
 */
export interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  ffmpegFont: string; // FFmpeg font name (may differ from CSS)
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'sans', name: 'Sans Serif', fontFamily: 'sans-serif', ffmpegFont: 'Arial' },
  { id: 'serif', name: 'Serif', fontFamily: 'serif', ffmpegFont: 'Times New Roman' },
  { id: 'mono', name: 'Monospace', fontFamily: 'monospace', ffmpegFont: 'Courier New' },
  { id: 'impact', name: 'Impact', fontFamily: 'Impact, sans-serif', ffmpegFont: 'Impact' },
  { id: 'comic', name: 'Comic', fontFamily: '"Comic Sans MS", cursive', ffmpegFont: 'Comic Sans MS' },
];

/**
 * Text overlay color presets
 */
export const TEXT_COLOR_PRESETS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
];

/**
 * Generate FFmpeg drawtext filter for a text overlay
 */
export const generateDrawtextFilter = (
  text: string,
  options: {
    x: number; // percentage 0-100
    y: number;
    fontSize: number;
    fontColor: string;
    fontFamily?: string;
    startTime?: number;
    endTime?: number | null;
    backgroundColor?: string | null;
  }
): string => {
  const escapedText = text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\n/g, '\\n');

  // Convert percentage position to FFmpeg format
  const xPos = `(w*${options.x / 100})`;
  const yPos = `(h*${options.y / 100})`;

  // Convert hex color to FFmpeg format
  const colorHex = options.fontColor.replace('#', '');
  const fontColor = `0x${colorHex}`;

  let filter = `drawtext=text='${escapedText}'`;
  filter += `:fontsize=${options.fontSize}`;
  filter += `:fontcolor=${fontColor}`;
  filter += `:x=${xPos}`;
  filter += `:y=${yPos}`;

  // Add font if specified
  if (options.fontFamily) {
    const fontOption = FONT_OPTIONS.find((f) => f.fontFamily === options.fontFamily);
    if (fontOption) {
      filter += `:font='${fontOption.ffmpegFont}'`;
    }
  }

  // Add timing if specified
  if (options.startTime !== undefined || options.endTime !== undefined) {
    const start = options.startTime ?? 0;
    const end = options.endTime;
    if (end !== null && end !== undefined) {
      filter += `:enable='between(t,${start},${end})'`;
    } else {
      filter += `:enable='gte(t,${start})'`;
    }
  }

  // Add background box if specified
  if (options.backgroundColor) {
    const bgHex = options.backgroundColor.replace('#', '');
    filter += `:box=1:boxcolor=0x${bgHex}@0.7:boxborderw=8`;
  }

  return filter;
};
