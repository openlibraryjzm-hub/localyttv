import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Undo2, PenTool, Eye } from 'lucide-react';

export default function BannerCropModal({
    isOpen,
    onClose,
    image,
    maskPath = [],
    setMaskPath,
    scale = 100,
    verticalPosition = 0
}) {
    // Interaction State
    const containerRef = useRef(null);
    const [hoverPoint, setHoverPoint] = useState(null);

    // --- Image Dimension & Guideline Logic ---
    const [imgDims, setImgDims] = useState(null);
    const [guideLineY, setGuideLineY] = useState(null);

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        setImgDims({ naturalWidth, naturalHeight });
    };

    useEffect(() => {
        if (!imgDims) return;

        const REFERENCE_WIDTH = 1920;
        const displayWidth = (scale / 100) * REFERENCE_WIDTH;
        const displayHeight = displayWidth * (imgDims.naturalHeight / imgDims.naturalWidth);
        const CONTAINER_HEIGHT = 200;

        const imageTopOffset = (CONTAINER_HEIGHT - displayHeight) * ((verticalPosition || 0) / 100);
        const lineYRelative = CONTAINER_HEIGHT - imageTopOffset;
        const lineYPercent = (lineYRelative / displayHeight) * 100;

        setGuideLineY(lineYPercent);
    }, [imgDims, scale, verticalPosition]);

    // --- Path Interaction ---
    const handleCanvasClick = (e) => {
        if (!containerRef.current) return;
        if (e.target.closest('button') || e.target.closest('input')) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;

        const currentPath = maskPath || [];
        if (currentPath.length >= 3 && hoverPoint === 0) return;

        const newPath = [...currentPath, { x, y }];
        setMaskPath(newPath);
    };

    if (!isOpen || !image) return null;

    const getPolygonPoints = () => {
        const points = maskPath || [];
        return points.map(p => `${p.x},${p.y}`).join(' ');
    };

    return (
        <>
            {/* Semi-transparent overlay - only blocks clicks, not view */}
            <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            {/* Compact Right-Side Panel */}
            <div className="fixed right-0 top-0 bottom-0 w-[500px] z-[100] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <PenTool className="text-sky-500" size={24} />
                            <h2 className="text-xl font-black uppercase text-white tracking-wider">
                                Crop Shape
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sky-400/80 text-xs font-medium">
                        Click on the preview below to draw mask points. Watch the live banner update!
                    </p>
                </div>

                {/* Preview Canvas */}
                <div className="flex-1 p-6 overflow-auto">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <Eye size={14} className="text-sky-400" />
                                <span>Live Preview</span>
                            </div>
                            <span className="font-mono text-white">{maskPath.length} points</span>
                        </div>

                        {/* Interactive Preview */}
                        <div
                            ref={containerRef}
                            className="relative w-full aspect-[16/5] bg-black/50 rounded-lg border border-white/20 cursor-crosshair overflow-hidden shadow-lg"
                            onClick={handleCanvasClick}
                        >
                            {/* Background Image (dimmed) */}
                            <img
                                src={image}
                                className="absolute inset-0 w-full h-full object-cover opacity-40 select-none pointer-events-none"
                                draggable={false}
                                onLoad={handleImageLoad}
                            />

                            {/* SVG Overlay */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {/* Guideline */}
                                {guideLineY !== null && (
                                    <g>
                                        <line
                                            x1="0" y1={guideLineY}
                                            x2="100" y2={guideLineY}
                                            stroke="#f43f5e"
                                            strokeWidth="0.3"
                                            strokeDasharray="1 1"
                                            opacity="0.7"
                                        />
                                        <text
                                            x="2" y={guideLineY - 1}
                                            fill="#f43f5e"
                                            fontSize="2.5"
                                            fontWeight="bold"
                                        >
                                            BANNER EDGE
                                        </text>
                                    </g>
                                )}

                                {/* Path */}
                                {maskPath.length > 0 && (
                                    <g>
                                        <polyline
                                            points={getPolygonPoints()}
                                            fill="none"
                                            stroke="#38bdf8"
                                            strokeWidth="0.5"
                                        />
                                        {maskPath.length > 2 && (
                                            <polygon
                                                points={getPolygonPoints()}
                                                fill="rgba(56, 189, 248, 0.15)"
                                            />
                                        )}
                                        {maskPath.map((p, idx) => (
                                            <circle
                                                key={idx}
                                                cx={p.x} cy={p.y} r={1.2}
                                                fill={idx === 0 ? "#4ade80" : "#38bdf8"}
                                                className="cursor-pointer"
                                                onMouseEnter={() => setHoverPoint(idx)}
                                                onMouseLeave={() => setHoverPoint(null)}
                                            />
                                        ))}
                                    </g>
                                )}
                            </svg>

                            {/* Masked Result Preview */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    clipPath: maskPath.length > 0
                                        ? `polygon(${maskPath.map(p => `${p.x}% ${p.y}%`).join(', ')})`
                                        : 'none'
                                }}
                            >
                                <img
                                    src={image}
                                    className="w-full h-full object-cover select-none"
                                    draggable={false}
                                />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3">
                            <p className="text-sky-300 text-xs leading-relaxed">
                                <strong>How to use:</strong> Click on the preview to add points. The mask applies to every tile.
                                Green dot = start point. Watch the actual banner at the top update in real-time!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls Footer */}
                <div className="p-6 border-t border-white/10 space-y-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const newPath = [...maskPath];
                                newPath.pop();
                                setMaskPath(newPath);
                            }}
                            disabled={maskPath.length === 0}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                            <Undo2 size={16} />
                            Undo Point
                        </button>
                        <button
                            onClick={() => setMaskPath([])}
                            disabled={maskPath.length === 0}
                            className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            Clear All
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-lg"
                    >
                        Done
                    </button>
                </div>
            </div>
        </>
    );
}
