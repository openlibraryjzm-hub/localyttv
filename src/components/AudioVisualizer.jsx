import React, { useEffect, useRef, useState } from 'react';
import { invoke, listen } from '../api/platformBridge';
import { smoothBarValues } from '../utils/audioProcessor';
import { useConfigStore } from '../store/configStore';

/**
 * AudioVisualizer - Circular audio visualizer matching Rainmeter VisBubble widget
 * 
 * Exact settings from Rainmeter:
 * - 113 bars in full circle (360°)
 * - Starts at 270° (bottom), rotates clockwise
 * - Bars extend outward
 * - White color, 4px width
 * - 76px base radius + 76px max extension
 * - FFT 2048, 60Hz-11kHz range
 * - 40 FPS (25ms updates)
 */
const hexToRgba = (hex, alpha = 1.0) => {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  if (Array.isArray(hex)) {
    const [r, g, b, a = 255] = hex;
    return `rgba(${r},${g},${b},${(a / 255) * alpha})`;
  }
  const cleanHex = hex.replace('#', '');
  let r = 255, g = 255, b = 255;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else if (cleanHex.startsWith('rgb')) {
    if (alpha === 1.0) return hex;
    if (hex.startsWith('rgba')) {
      return hex.replace(/[\d.]+\)$/, `${alpha})`);
    } else {
      return hex.replace('rgb', 'rgba').replace(/\)$/, `, ${alpha})`);
    }
  }
  return `rgba(${r},${g},${b},${alpha})`;
};

const AudioVisualizer = ({
  enabled = false,
  isActive = true, // NEW PROP: Controls audio capture separately from rendering
  orbSize = 154,
  barCount = 113,
  barWidth = 4,
  radius = 76,
  radiusY = 76,
  maxBarLength = 76,
  minBarLength = 7,
  colors = [255, 255, 255, 255], // White RGBA
  smoothing = 0.4,
  preAmpGain = 4.0,
  angleTotal = Math.PI * 2, // 360°
  angleStart = -Math.PI / 2, // 270° (bottom)
  clockwise = true,
  inward = false,
  fftSize = 1024, // Reduced from 2048 for performance
  freqMin = 60,
  freqMax = 11000,
  sensitivity = 64,
  updateRate = 16, // 16ms = 60 FPS (Snappy response)
}) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const barValuesRef = useRef(null);
  const previousBarValuesRef = useRef(null);
  const smoothedValuesRef = useRef(new Uint8Array(barCount));
  const gradientRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const sampleRateRef = useRef(48000); // Default, will be updated from audio data
  const isCapturingRef = useRef(false); // Track capture state for cleanup
  const { visualizerGradient, visualizerSensitivity = 1.0, visualizerMode = 'bar', visualizerColor = '#ffffff' } = useConfigStore();
  const activeColor = visualizerColor || colors;

  // Combine default gain with user sensitivity
  const effectiveGain = preAmpGain * visualizerSensitivity;

  // Initialize sample rate (will be updated from audio data)
  useEffect(() => {
    if (!enabled) return;
    
    // Sample rate will be updated when we receive audio data
    // Default to 48000 Hz (common for Windows audio)
    sampleRateRef.current = 48000;
  }, [enabled]);

  // Start/stop audio capture
  useEffect(() => {
    let mounted = true;

    const manageCapture = async () => {
      if (!enabled || !isActive) {
        // Stop capture if disabled OR inactive
        if (isCapturingRef.current) {
          console.log('[AudioVisualizer] Stopping audio capture...');
          try {
            await invoke('stop_audio_capture');
            if (mounted) {
              isCapturingRef.current = false;
              setIsCapturing(false);
            }
          } catch (error) {
            console.error('[AudioVisualizer] Error stopping capture:', error);
          }
        }
        return;
      }

      // Always try to stop first to ensure clean state
      if (isCapturingRef.current) {
        console.log('[AudioVisualizer] Stopping existing capture before restart...');
        try {
          await invoke('stop_audio_capture');
        } catch (error) {
          // Ignore errors if not running
          console.log('[AudioVisualizer] Stop error (may be expected):', error);
        }
        isCapturingRef.current = false;
        setIsCapturing(false);
        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Start capture
      if (!mounted) return;

      try {
        console.log('[AudioVisualizer] Starting audio capture...');

        // Test command invocation first
        try {
          const testResult = await invoke('test_audio_command');
          console.log('[AudioVisualizer] Test command result:', testResult);
        } catch (testError) {
          console.error('[AudioVisualizer] Test command failed:', testError);
        }

        await invoke('start_audio_capture');
        if (mounted) {
          isCapturingRef.current = true;
          setIsCapturing(true);
          console.log('[AudioVisualizer] Audio capture started successfully');
        }
      } catch (error) {
        console.error('[AudioVisualizer] Failed to start audio capture:', error);
        if (mounted) {
          isCapturingRef.current = false;
          setIsCapturing(false);
        }
      }
    };

    manageCapture();

    return () => {
      mounted = false;
      if (isCapturingRef.current) {
        console.log('[AudioVisualizer] Stopping audio capture (cleanup)...');
        invoke('stop_audio_capture').catch(console.error);
        isCapturingRef.current = false;
        setIsCapturing(false);
      }
    };
  }, [enabled, isActive]);

  // Listen to audio data events and process
  useEffect(() => {
    if (!enabled || !isActive) return;

    let unlisten = null;
    let eventCount = 0;

    const setupListener = async () => {
      try {
        console.log('[AudioVisualizer] Setting up audio bin listener...');
        unlisten = await listen('audio-bins', (event) => {
          const bins = event.payload; // Uint8Array of 113 bar values

          if (!bins || !Array.isArray(bins) || bins.length === 0) {
            return;
          }

          eventCount++;

          // Apply smoothing in JS (very lightweight, in-place to avoid GC)
          const target = smoothedValuesRef.current;
          const prev = previousBarValuesRef.current || target;
          const s = smoothing;
          const invS = 1 - s;
          
          for (let i = 0; i < bins.length; i++) {
            target[i] = Math.round(bins[i] * invS + prev[i] * s);
          }

          // Apply sensitivity
          const adjusted = new Uint8Array(target.length);
          const sensFactor = sensitivity / 64;
          for (let i = 0; i < target.length; i++) {
            adjusted[i] = Math.min(255, Math.round(target[i] * sensFactor));
          }

          barValuesRef.current = adjusted;
          previousBarValuesRef.current = new Uint8Array(target); // Clone for next frame store

          if (eventCount === 1 || eventCount % 200 === 0) {
            console.log('[AudioVisualizer] Received', eventCount, 'audio bin events');
          }
        });
        console.log('[AudioVisualizer] Audio listener set up successfully, waiting for events...');

        // Set a timeout to warn if no events are received
        setTimeout(() => {
          if (eventCount === 0) {
            console.warn('[AudioVisualizer] ⚠️ No audio events received after 2 seconds. Check Rust console for audio capture logs.');
          }
        }, 2000);
      } catch (error) {
        console.error('[AudioVisualizer] Failed to set up audio listener:', error);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [enabled, isActive, sensitivity, smoothing]);

  // Rendering loop
  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const totalRadius = radius + maxBarLength;
    const canvasSize = totalRadius * 2 + 20; // Extra padding
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;

    const strokeColor = hexToRgba(activeColor, 1.0);

    // Create or retrieve cached gradient
    if (visualizerGradient && !gradientRef.current) {
      const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + maxBarLength);
      const base = hexToRgba(activeColor, 1.0);
      const tip = hexToRgba(activeColor, 0.1);
      gradient.addColorStop(0, base);
      gradient.addColorStop(0.2, base);
      gradient.addColorStop(1, tip);
      gradientRef.current = gradient;
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (visualizerGradient && gradientRef.current) {
        ctx.strokeStyle = gradientRef.current;
      } else {
        ctx.strokeStyle = strokeColor;
      }
      ctx.lineWidth = barWidth;
      ctx.lineCap = 'round'; // Softer look

      if (!barValuesRef.current) {
        // Draw test pattern when no data (so visualizer is visible)
        if (visualizerMode === 'bubble') {
          ctx.beginPath();
          for (let i = 0; i < barCount; i++) {
            const barIndex = clockwise ? i : (barCount - 1 - i);
            const angle = angleStart + (angleTotal / barCount) * barIndex;
            const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const endX = centerX + (radius + minBarLength) * Math.cos(normalizedAngle);
            const endY = centerY + (radiusY + minBarLength) * Math.sin(normalizedAngle);
            if (i === 0) ctx.moveTo(endX, endY);
            else ctx.lineTo(endX, endY);
          }
          ctx.closePath();
          ctx.stroke();
        } else if (visualizerMode === 'light') {
          for (let i = 0; i < barCount; i++) {
            const barIndex = clockwise ? i : (barCount - 1 - i);
            const angle = angleStart + (angleTotal / barCount) * barIndex;
            const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const x = centerX + (radius + minBarLength) * Math.cos(normalizedAngle);
            const y = centerY + (radiusY + minBarLength) * Math.sin(normalizedAngle);
            ctx.beginPath();
            ctx.arc(x, y, barWidth * 0.75, 0, Math.PI * 2);
            ctx.fillStyle = visualizerGradient && gradientRef.current ? gradientRef.current : strokeColor;
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        } else if (visualizerMode === 'light2') {
          const staticBarLength = minBarLength + maxBarLength * 0.2;
          ctx.beginPath();
          for (let i = 0; i < barCount; i++) {
            const barIndex = clockwise ? i : (barCount - 1 - i);
            const angle = angleStart + (angleTotal / barCount) * barIndex;
            const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const baseX = centerX + radius * Math.cos(normalizedAngle);
            const baseY = centerY + radiusY * Math.sin(normalizedAngle);
            const endX = baseX + staticBarLength * Math.cos(normalizedAngle);
            const endY = baseY + staticBarLength * Math.sin(normalizedAngle);
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(endX, endY);
          }
          ctx.globalAlpha = 0.4;
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          for (let i = 0; i < barCount; i++) {
            const barIndex = clockwise ? i : (barCount - 1 - i);
            const angle = angleStart + (angleTotal / barCount) * barIndex;
            const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const x = centerX + (radius + staticBarLength) * Math.cos(normalizedAngle);
            const y = centerY + (radiusY + staticBarLength) * Math.sin(normalizedAngle);
            ctx.beginPath();
            ctx.arc(x, y, barWidth * 0.75, 0, Math.PI * 2);
            ctx.fillStyle = visualizerGradient && gradientRef.current ? gradientRef.current : strokeColor;
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        } else {
          ctx.beginPath();
          for (let i = 0; i < barCount; i++) {
            const barIndex = clockwise ? i : (barCount - 1 - i);
            const angle = angleStart + (angleTotal / barCount) * barIndex;
            const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

            // Draw minimum length bar so it's visible
            const baseX = centerX + radius * Math.cos(normalizedAngle);
            const baseY = centerY + radiusY * Math.sin(normalizedAngle);
            const endX = baseX + minBarLength * Math.cos(normalizedAngle);
            const endY = baseY + minBarLength * Math.sin(normalizedAngle);

            ctx.moveTo(baseX, baseY);
            ctx.lineTo(endX, endY);
          }
          ctx.stroke();
        }
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const barValues = barValuesRef.current;

      if (visualizerMode === 'bubble') {
        ctx.beginPath();
        for (let i = 0; i < barCount; i++) {
          const barIndex = clockwise ? i : (barCount - 1 - i);
          const angle = angleStart + (angleTotal / barCount) * barIndex;
          const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

          const value = barValues[i] || 0;
          const normalizedValue = value / 255;
          const barLength = minBarLength + (normalizedValue * (maxBarLength - minBarLength));

          const endX = centerX + (radius + barLength) * Math.cos(normalizedAngle);
          const endY = centerY + (radiusY + barLength) * Math.sin(normalizedAngle);

          if (i === 0) ctx.moveTo(endX, endY);
          else ctx.lineTo(endX, endY);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (visualizerMode === 'light') {
        for (let i = 0; i < barCount; i++) {
          const barIndex = clockwise ? i : (barCount - 1 - i);
          const angle = angleStart + (angleTotal / barCount) * barIndex;
          const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

          const value = barValues[i] || 0;
          const normalizedValue = value / 255;

          const dotRadius = barWidth * 0.75 + (normalizedValue * barWidth * 1.5);
          const distanceOffset = minBarLength + (normalizedValue * maxBarLength * 0.3);

          const x = centerX + (radius + distanceOffset) * Math.cos(normalizedAngle);
          const y = centerY + (radiusY + distanceOffset) * Math.sin(normalizedAngle);

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = visualizerGradient && gradientRef.current ? gradientRef.current : strokeColor;
          ctx.globalAlpha = 0.15 + normalizedValue * 0.85;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      } else if (visualizerMode === 'light2') {
        const staticBarLength = minBarLength + maxBarLength * 0.2;
        ctx.beginPath();
        for (let i = 0; i < barCount; i++) {
          const barIndex = clockwise ? i : (barCount - 1 - i);
          const angle = angleStart + (angleTotal / barCount) * barIndex;
          const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const baseX = centerX + radius * Math.cos(normalizedAngle);
          const baseY = centerY + radiusY * Math.sin(normalizedAngle);
          const endX = baseX + staticBarLength * Math.cos(normalizedAngle);
          const endY = baseY + staticBarLength * Math.sin(normalizedAngle);
          ctx.moveTo(baseX, baseY);
          ctx.lineTo(endX, endY);
        }
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        for (let i = 0; i < barCount; i++) {
          const barIndex = clockwise ? i : (barCount - 1 - i);
          const angle = angleStart + (angleTotal / barCount) * barIndex;
          const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

          const value = barValues[i] || 0;
          const normalizedValue = value / 255;

          const dotRadius = barWidth * 0.75 + (normalizedValue * barWidth * 2.0);
          const x = centerX + (radius + staticBarLength) * Math.cos(normalizedAngle);
          const y = centerY + (radiusY + staticBarLength) * Math.sin(normalizedAngle);

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = visualizerGradient && gradientRef.current ? gradientRef.current : strokeColor;
          ctx.globalAlpha = 0.15 + normalizedValue * 0.85;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      } else {
        // Standard bar mode
        ctx.beginPath();
        for (let i = 0; i < barCount; i++) {
          const barIndex = clockwise ? i : (barCount - 1 - i);
          const angle = angleStart + (angleTotal / barCount) * barIndex;
          const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

          const value = barValues[i] || 0;
          const normalizedValue = value / 255;
          const barLength = minBarLength + (normalizedValue * (maxBarLength - minBarLength));

          const baseX = centerX + radius * Math.cos(normalizedAngle);
          const baseY = centerY + radiusY * Math.sin(normalizedAngle);
          const endX = baseX + barLength * Math.cos(normalizedAngle);
          const endY = baseY + barLength * Math.sin(normalizedAngle);

          ctx.moveTo(baseX, baseY);
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();
      }

      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      gradientRef.current = null; // Clear on dependency change
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, barCount, barWidth, radius, radiusY, maxBarLength, minBarLength, activeColor, angleTotal, angleStart, clockwise, visualizerGradient, visualizerMode]);

  if (!enabled) {
    return null;
  }

  const totalRadius = radius + maxBarLength;
  const canvasSize = totalRadius * 2 + 20;

  return (
    <canvas
      ref={canvasRef}
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%) translateZ(0)',
        zIndex: 5, // Below orb buttons (z-50) but above background
        width: `${canvasSize}px`,
        height: `${canvasSize}px`,
        willChange: 'transform',
      }}
    />
  );
};

export default AudioVisualizer;
