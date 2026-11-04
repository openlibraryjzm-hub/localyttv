import React from 'react';

/**
 * NeonActionStreak
 * Renders a proud neon streak corresponding to the selected visualizer color
 * running horizontally behind the action buttons in the top controller menus.
 * Tapers smoothly at the edges to ensure zero obstruction of the central Orb and Audio Visualizer.
 */
export default function NeonActionStreak({ color = '#ffffff', side = 'left', className = '' }) {
  const activeColor = color || '#ffffff';

  // Left menu (Playlist): inner edge facing Orb is on the right (fades out at 100%)
  // Right menu (Video): inner edge facing Orb is on the left (fades out at 0%)
  const auraGradient = side === 'left'
    ? `linear-gradient(90deg, transparent 0%, ${activeColor} 12%, ${activeColor} 82%, transparent 100%)`
    : `linear-gradient(90deg, transparent 0%, ${activeColor} 18%, ${activeColor} 88%, transparent 100%)`;

  const coreGradient = side === 'left'
    ? `linear-gradient(90deg, transparent 0%, ${activeColor} 10%, #ffffff 40%, #ffffff 60%, ${activeColor} 85%, transparent 100%)`
    : `linear-gradient(90deg, transparent 0%, ${activeColor} 15%, #ffffff 40%, #ffffff 60%, ${activeColor} 90%, transparent 100%)`;

  return (
    <div
      className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none z-0 flex items-center justify-center overflow-visible select-none ${className}`}
      aria-hidden="true"
    >
      {/* Broad atmospheric neon glow */}
      <div
        className="w-full h-6 blur-md opacity-50 transition-all duration-300"
        style={{ background: auraGradient }}
      />
      {/* Mid-layer radiant neon tube bloom */}
      <div
        className="absolute w-full h-3 blur-[3px] opacity-85 transition-all duration-300"
        style={{
          background: auraGradient,
          boxShadow: `0 0 14px ${activeColor}, 0 0 28px ${activeColor}`,
        }}
      />
      {/* High-intensity crisp neon core filament */}
      <div
        className="absolute w-full h-[2.5px] rounded-full transition-all duration-300"
        style={{
          background: coreGradient,
          boxShadow: `0 0 4px ${activeColor}, 0 0 10px ${activeColor}, 0 0 18px ${activeColor}`,
        }}
      />
    </div>
  );
}
