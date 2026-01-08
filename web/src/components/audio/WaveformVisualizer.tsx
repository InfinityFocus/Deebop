'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

interface WaveformVisualizerProps {
  waveformUrl?: string;
  progress: number; // 0-1
  onSeek?: (progress: number) => void;
  height?: number;
  barWidth?: number;
  barGap?: number;
  playedColor?: string;
  unplayedColor?: string;
  className?: string;
}

export function WaveformVisualizer({
  waveformUrl,
  progress,
  onSeek,
  height = 48,
  barWidth = 2,
  barGap = 1,
  playedColor = '#22c55e', // emerald-500
  unplayedColor = '#374151', // gray-700
  className = '',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch waveform data
  useEffect(() => {
    if (!waveformUrl) return;

    setIsLoading(true);
    fetch(waveformUrl)
      .then((res) => res.json())
      .then((data: WaveformData) => {
        setWaveformData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load waveform:', err);
        setIsLoading(false);
      });
  }, [waveformUrl]);

  // Draw waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { peaks } = waveformData;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, height);

    // Calculate bar dimensions
    const totalBars = Math.floor(rect.width / (barWidth + barGap));
    const samplesPerBar = Math.ceil(peaks.length / totalBars);
    const playedBars = Math.floor(progress * totalBars);

    for (let i = 0; i < totalBars; i++) {
      // Average peaks for this bar
      const start = i * samplesPerBar;
      const end = Math.min(start + samplesPerBar, peaks.length);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += peaks[j];
      }
      const avgPeak = sum / (end - start);

      // Calculate bar height (minimum 2px)
      const barHeight = Math.max(2, avgPeak * height * 0.9);
      const x = i * (barWidth + barGap);
      const y = (height - barHeight) / 2;

      // Set color based on progress
      ctx.fillStyle = i < playedBars ? playedColor : unplayedColor;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [waveformData, progress, height, barWidth, barGap, playedColor, unplayedColor]);

  // Redraw on data or progress change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => drawWaveform();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

  // Handle click/drag to seek
  const handleInteraction = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!onSeek || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const newProgress = Math.max(0, Math.min(1, x / rect.width));
      onSeek(newProgress);
    },
    [onSeek]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate placeholder bars when no data
  const renderPlaceholder = () => {
    const bars = [];
    const numBars = 50;
    for (let i = 0; i < numBars; i++) {
      const barHeight = 4 + Math.random() * 20;
      bars.push(
        <div
          key={i}
          className="bg-gray-700 rounded-sm"
          style={{
            width: barWidth,
            height: barHeight,
            marginRight: barGap,
          }}
        />
      );
    }
    return (
      <div className="flex items-center justify-center h-full opacity-50">
        {bars}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer ${className}`}
      style={{ height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isLoading || !waveformData ? (
        renderPlaceholder()
      ) : (
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ touchAction: 'none' }}
        />
      )}
    </div>
  );
}

export default WaveformVisualizer;
