'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, Minimize2, RotateCcw, Move, Loader2 } from 'lucide-react';

// Pannellum types
declare global {
  interface Window {
    pannellum: {
      viewer: (container: string | HTMLElement, config: PannellumConfig) => PannellumViewer;
    };
  }
}

interface PannellumConfig {
  type: 'equirectangular';
  panorama: string;
  autoLoad?: boolean;
  autoRotate?: number;
  compass?: boolean;
  showControls?: boolean;
  mouseZoom?: boolean;
  keyboardZoom?: boolean;
  draggable?: boolean;
  friction?: number;
  minHfov?: number;
  maxHfov?: number;
  hfov?: number;
  yaw?: number;
  pitch?: number;
  haov?: number;
  vaov?: number;
  vOffset?: number;
  orientationOnByDefault?: boolean;
  hotSpotDebug?: boolean;
}

interface PannellumViewer {
  destroy: () => void;
  getYaw: () => number;
  getPitch: () => number;
  getHfov: () => number;
  setYaw: (yaw: number, animated?: boolean) => void;
  setPitch: (pitch: number, animated?: boolean) => void;
  setHfov: (hfov: number, animated?: boolean) => void;
  lookAt: (pitch: number, yaw: number, hfov?: number, animated?: boolean) => void;
  startAutoRotate: (speed?: number) => void;
  stopAutoRotate: () => void;
  toggleFullscreen: () => void;
  isLoaded: () => boolean;
  on: (event: string, callback: () => void) => void;
}

interface PanoramaViewerProps {
  src: string;
  autoRotate?: boolean;
  defaultYaw?: number;
  defaultPitch?: number;
  className?: string;
  showControls?: boolean;
  onLoad?: () => void;
}

// Load Pannellum script dynamically
let pannellumLoaded = false;
let pannellumLoadPromise: Promise<void> | null = null;

function loadPannellum(): Promise<void> {
  if (pannellumLoaded) return Promise.resolve();
  if (pannellumLoadPromise) return pannellumLoadPromise;

  pannellumLoadPromise = new Promise((resolve, reject) => {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
    script.onload = () => {
      pannellumLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return pannellumLoadPromise;
}

export function PanoramaViewer({
  src,
  autoRotate = false,
  defaultYaw = 0,
  defaultPitch = 0,
  className = '',
  showControls = true,
  onLoad,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize viewer
  useEffect(() => {
    let mounted = true;

    const initViewer = async () => {
      if (!containerRef.current) return;

      try {
        await loadPannellum();

        if (!mounted || !containerRef.current) return;

        // Destroy existing viewer
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }

        // Create new viewer
        viewerRef.current = window.pannellum.viewer(containerRef.current, {
          type: 'equirectangular',
          panorama: src,
          autoLoad: true,
          autoRotate: autoRotate ? -2 : 0,
          compass: false,
          showControls: false,
          mouseZoom: true,
          keyboardZoom: true,
          draggable: true,
          friction: 0.15,
          minHfov: 30,
          maxHfov: 120,
          hfov: 100,
          yaw: defaultYaw,
          pitch: defaultPitch,
        });

        viewerRef.current.on('load', () => {
          setIsLoading(false);
          onLoad?.();
        });
      } catch (error) {
        console.error('Failed to initialize Pannellum:', error);
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
      mounted = false;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [src, autoRotate, defaultYaw, defaultPitch, onLoad]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleAutoRotate = useCallback(() => {
    if (!viewerRef.current) return;

    if (isRotating) {
      viewerRef.current.stopAutoRotate();
    } else {
      viewerRef.current.startAutoRotate(-2);
    }
    setIsRotating(!isRotating);
  }, [isRotating]);

  const resetView = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.lookAt(defaultPitch, defaultYaw, 100, true);
  }, [defaultPitch, defaultYaw]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  return (
    <div className={`relative bg-gray-900 ${className}`}>
      {/* Pannellum container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '300px' }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading panorama...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && !isLoading && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={toggleAutoRotate}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
              isRotating
                ? 'bg-purple-500 text-white'
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}
            title={isRotating ? 'Stop rotation' : 'Auto rotate'}
          >
            <RotateCcw size={20} className={isRotating ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={resetView}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
            title="Reset view"
          >
            <Move size={20} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      )}

      {/* 360 badge */}
      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm flex items-center gap-1">
        <span className="text-purple-400">360°</span>
      </div>

      {/* Drag hint */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-gray-300 text-xs">
          Drag to look around
        </div>
      )}
    </div>
  );
}
