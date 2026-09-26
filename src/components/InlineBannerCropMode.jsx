import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Undo2, Check, Info, Eye, EyeOff } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

/**
 * Inline Banner Crop Mode
 * Overlays the actual banner AND spill area to allow direct path drawing without a modal
 */
export default function InlineBannerCropMode({
    isActive,
    onExit,
    maskPath = [],
    setMaskPath,
    bannerImage,
    bannerScale = 100,
    bannerVerticalPosition = 0,
    bannerHorizontalOffset = 0,
    bannerSpillHeight = 0
}) {
    const overlayRef = useRef(null);
    const [hoverPoint, setHoverPoint] = useState(null);
    const [cursorPosition, setCursorPosition] = useState(null);

    // Get live preview toggle from store
    const { bannerCropLivePreview, setBannerCropLivePreview } = useConfigStore();

    // Calculate total height including spill
    const totalHeight = 200 + (bannerSpillHeight || 0);
    const bannerAreaPercentage = (200 / totalHeight) * 100;

    // Track mouse position for preview dot
    const handleMouseMove = (e) => {
        if (!overlayRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCursorPosition({ x, y });
    };

    const handleMouseLeave = () => {
        setCursorPosition(null);
    };

    // Add point on click
    const handleClick = (e) => {
        if (!overlayRef.current) return;

        // Ignore clicks on UI controls
        if (e.target.closest('button') || e.target.closest('.controls-panel')) return;

        const rect = overlayRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const currentPath = maskPath || [];

        // If we have 3+ points and clicking near the first point, close the path
        if (currentPath.length >= 3 && hoverPoint === 0) {
            return; // Path is complete
        }

        const newPath = [...currentPath, { x, y }];
        setMaskPath(newPath);
    };

    // Undo last point
    const handleUndo = () => {
        if (maskPath.length === 0) return;
        const newPath = [...maskPath];
        newPath.pop();
        setMaskPath(newPath);
    };

    // Clear all points
    const handleClear = () => {
        setMaskPath([]);
    };

    // Keyboard shortcuts
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onExit();
            } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleUndo();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                handleClear();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, maskPath]);

    if (!isActive) return null;

    const getPolygonPoints = () => {
        const points = maskPath || [];
        return points.map(p => `${p.x},${p.y}`).join(' ');
    };

    // Check if cursor is near the first point (to close the path)
    const isNearFirstPoint = (cursorPos) => {
        if (!cursorPos || maskPath.length < 3) return false;
        const firstPoint = maskPath[0];
        const distance = Math.sqrt(
            Math.pow(cursorPos.x - firstPoint.x, 2) +
            Math.pow(cursorPos.y - firstPoint.y, 2)
        );
        return distance < 3; // Within 3% distance
    };

    const nearFirst = cursorPosition && isNearFirstPoint(cursorPosition);

    return (
        <div
            ref={overlayRef}
            className="fixed top-0 left-0 right-0 z-[200] cursor-crosshair"
            style={{ height: `${totalHeight}px` }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            {/* Semi-transparent overlay to indicate edit mode */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-none" />

            {/* Banner boundary indicator line (where spill starts) */}
            {bannerSpillHeight > 0 && (
                <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-rose-400/60 pointer-events-none"
                    style={{ top: '200px' }}
                >
                    <div className="absolute left-4 -top-3 bg-rose-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        SPILL AREA BELOW
                    </div>
                </div>
            )}

            {/* SVG Layer for drawing */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {/* Current path */}
                {maskPath.length > 0 && (
                    <g>
                        {/* Line segments */}
                        <polyline
                            points={getPolygonPoints()}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="0.3"
                            strokeDasharray="0.5 0.5"
                        />

                        {/* Filled polygon preview (if 3+ points) */}
                        {maskPath.length > 2 && (
                            <polygon
                                points={getPolygonPoints()}
                                fill="rgba(56, 189, 248, 0.15)"
                                stroke="#38bdf8"
                                strokeWidth="0.3"
                            />
                        )}

                        {/* Point markers */}
                        {maskPath.map((p, idx) => (
                            <circle
                                key={idx}
                                cx={p.x}
                                cy={p.y}
                                r={idx === 0 ? 1.5 : 1}
                                fill={idx === 0 ? "#4ade80" : "#38bdf8"}
                                stroke="white"
                                strokeWidth="0.2"
                                className="pointer-events-auto cursor-pointer"
                                onMouseEnter={() => setHoverPoint(idx)}
                                onMouseLeave={() => setHoverPoint(null)}
                            />
                        ))}

                        {/* Closing line preview (when near first point) */}
                        {maskPath.length >= 3 && cursorPosition && nearFirst && (
                            <line
                                x1={maskPath[maskPath.length - 1].x}
                                y1={maskPath[maskPath.length - 1].y}
                                x2={maskPath[0].x}
                                y2={maskPath[0].y}
                                stroke="#4ade80"
                                strokeWidth="0.3"
                                strokeDasharray="0.5 0.5"
                            />
                        )}
                    </g>
                )}

                {/* Cursor preview dot */}
                {cursorPosition && maskPath.length < 50 && (
                    <circle
                        cx={cursorPosition.x}
                        cy={cursorPosition.y}
                        r={nearFirst ? 2 : 0.8}
                        fill={nearFirst ? "#4ade80" : "rgba(255, 255, 255, 0.8)"}
                        stroke={nearFirst ? "white" : "#38bdf8"}
                        strokeWidth="0.2"
                    />
                )}

                {/* Next line preview */}
                {cursorPosition && maskPath.length > 0 && !nearFirst && (
                    <line
                        x1={maskPath[maskPath.length - 1].x}
                        y1={maskPath[maskPath.length - 1].y}
                        x2={cursorPosition.x}
                        y2={cursorPosition.y}
                        stroke="rgba(56, 189, 248, 0.5)"
                        strokeWidth="0.2"
                        strokeDasharray="0.5 0.5"
                    />
                )}
            </svg>

            {/* Floating Controls Panel - Bottom Right of Viewport */}
            <div className="controls-panel fixed bottom-4 right-4 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl p-4 space-y-3 pointer-events-auto animate-in slide-in-from-bottom duration-300 z-[250]">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                        <span className="text-xs font-black uppercase text-white tracking-wider">
                            Crop Mode
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400">
                        {maskPath.length} points
                    </span>
                </div>

                {/* Instructions */}
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-start gap-2">
                        <Info size={12} className="text-sky-400 mt-0.5 flex-shrink-0" />
                        <div className="text-[10px] text-sky-300 leading-relaxed space-y-1">
                            <p><strong>Click</strong> on banner or spill to add points</p>
                            <p><strong>Green dot</strong> = start point</p>
                            <p><strong>Esc</strong> to exit • <strong>Ctrl+Z</strong> to undo</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleUndo}
                            disabled={maskPath.length === 0}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                            <Undo2 size={12} />
                            Undo
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={maskPath.length === 0}
                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                            <Trash2 size={12} />
                            Clear
                        </button>
                    </div>

                    {/* Live Preview Toggle */}
                    <button
                        onClick={() => setBannerCropLivePreview(!bannerCropLivePreview)}
                        className={`w-full px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${bannerCropLivePreview
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600'
                            }`}
                    >
                        {bannerCropLivePreview ? <Eye size={12} /> : <EyeOff size={12} />}
                        {bannerCropLivePreview ? 'Live Preview ON' : 'Live Preview OFF'}
                    </button>

                    <button
                        onClick={onExit}
                        className="w-full px-3 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Check size={14} />
                        Done
                    </button>
                </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl rounded-full px-6 py-2 border border-white/20 shadow-2xl pointer-events-none animate-in slide-in-from-bottom duration-300">
                <p className="text-xs text-white/80 font-medium">
                    {maskPath.length === 0 && "Click anywhere on the banner to start drawing"}
                    {maskPath.length === 1 && "Click to add more points"}
                    {maskPath.length === 2 && "Add at least one more point to create a shape"}
                    {maskPath.length >= 3 && !nearFirst && "Keep adding points or hover over the green dot to close"}
                    {maskPath.length >= 3 && nearFirst && "Click the green dot to close the shape"}
                </p>
            </div>
        </div>
    );
}
