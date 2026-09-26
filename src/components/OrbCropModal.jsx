import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize, ZoomIn, Move, Check, MousePointer2, BoxSelect, PenTool, Trash2, Undo2 } from 'lucide-react';

export default function OrbCropModal({
    isOpen,
    onClose,
    image,
    spillConfig = { tl: false, tr: false, bl: false, br: false },
    scale = 1,
    xOffset = 0,
    yOffset = 0,
    // Global State Props
    advancedMasks = { tl: false, tr: false, bl: false, br: false },
    setAdvancedMasks,
    maskRects = {
        tl: { x: 0, y: 0, w: 50, h: 50 },
        tr: { x: 50, y: 0, w: 50, h: 50 },
        bl: { x: 0, y: 50, w: 50, h: 50 },
        br: { x: 50, y: 50, w: 50, h: 50 }
    },
    setMaskRects,
    // Orb Sizing Props (for consistency)
    orbSize = 150,
    orbImageScaleW = 1,
    orbImageScaleH = 1,
    // New Path Props
    maskPaths = { tl: [], tr: [], bl: [], br: [] },
    setMaskPaths,
    maskModes = { tl: 'rect', tr: 'rect', bl: 'rect', br: 'rect' },
    setMaskModes
}) {
    // Interaction State
    const containerRef = useRef(null);
    const [interaction, setInteraction] = useState(null); // { type: 'drag'|'resize', q: string, handle?: string, startX, startY, startRect }
    const [canvasScale, setCanvasScale] = useState(1);

    // Selection state
    const [selectedQ, setSelectedQ] = useState(null); // 'tl', 'tr', 'bl', 'br'

    // Path Drawing State
    const [hoverPoint, setHoverPoint] = useState(null); // Index of point being hovered

    // --- Helpers ---

    const getActiveMode = (q) => maskModes[q] || 'rect';

    const toggleAdvanced = (q) => {
        const newState = !advancedMasks[q];
        setAdvancedMasks({ ...advancedMasks, [q]: newState });

        if (newState) {
            // Select automatically when enabling
            setSelectedQ(q);

            // Initialization logic if empty
            if (getActiveMode(q) === 'rect') {
                const current = maskRects[q];
                if (current.w === 50 && current.h === 50) {
                    const defaults = {
                        tl: { x: 5, y: 5, w: 40, h: 40 },
                        tr: { x: 55, y: 5, w: 40, h: 40 },
                        bl: { x: 5, y: 55, w: 40, h: 40 },
                        br: { x: 55, y: 55, w: 40, h: 40 }
                    };
                    setMaskRects({ ...maskRects, [q]: defaults[q] });
                }
            }
        } else {
            if (selectedQ === q) setSelectedQ(null);
        }
    };

    const handleQuadrantSelect = (q) => {
        if (!spillConfig[q]) return;

        // If not enabled, enable it
        if (!advancedMasks[q]) {
            toggleAdvanced(q);
        } else {
            // Just select
            setSelectedQ(q === selectedQ ? null : q);
        }
    };

    // --- Rect Interaction ---

    const initDrag = (e, q) => {
        if (getActiveMode(q) !== 'rect') return;
        if (e.target.dataset.handle) return;
        e.preventDefault();
        e.stopPropagation();
        setInteraction({
            type: 'drag',
            q,
            startX: e.clientX,
            startY: e.clientY,
            startRect: { ...maskRects[q] }
        });
        setSelectedQ(q);
    };

    const initResize = (e, q, handle) => {
        e.preventDefault();
        e.stopPropagation();
        setInteraction({
            type: 'resize',
            q,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startRect: { ...maskRects[q] }
        });
        setSelectedQ(q);
    };

    // --- Path Interaction ---

    const handleCanvasClick = (e) => {
        if (!selectedQ) return;
        if (getActiveMode(selectedQ) !== 'path') return;
        if (!containerRef.current) return;

        // Ignore clicks on UI elements (buttons, inputs)
        if (e.target.closest('button') || e.target.closest('input')) return;

        // If clicking a point (handled by point handler), ignore here?
        // Actually, let's calculate pos
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;

        const currentPath = maskPaths[selectedQ] || [];

        // Check if we clicked near the start point to close
        if (currentPath.length >= 3 && hoverPoint === 0) {
            // Close path logic is implicit? 
            // Actually, a closed path is just > 2 points. 
            // We can just stop adding points?
            // Maybe we deselect to "finish"?
            setSelectedQ(null);
            return;
        }

        const newPath = [...currentPath, { x, y }];
        setMaskPaths({ ...maskPaths, [selectedQ]: newPath });
    };

    // Global Move/Up Listener for Rects
    useEffect(() => {
        if (!interaction || !containerRef.current) return;

        const handleMove = (e) => {
            const containerRect = containerRef.current.getBoundingClientRect();
            const deltaX = ((e.clientX - interaction.startX) / containerRect.width) * 100;
            const deltaY = ((e.clientY - interaction.startY) / containerRect.height) * 100;

            const newMaskRects = { ...maskRects };
            const q = interaction.q;
            const start = interaction.startRect;
            let newR = { ...start };

            const bounds = { minX: -150, maxX: 250, minY: -150, maxY: 250 };
            const minSize = 2;

            if (interaction.type === 'drag') {
                let proposedX = start.x + deltaX;
                let proposedY = start.y + deltaY;
                proposedX = Math.max(bounds.minX, Math.min(bounds.maxX - newR.w, proposedX));
                proposedY = Math.max(bounds.minY, Math.min(bounds.maxY - newR.h, proposedY));
                newR.x = proposedX;
                newR.y = proposedY;
            } else if (interaction.type === 'resize') {
                const h = interaction.handle;
                if (h.includes('w')) {
                    const proposedX = Math.min(start.x + start.w - minSize, Math.max(bounds.minX, start.x + deltaX));
                    newR.w = start.x + start.w - proposedX;
                    newR.x = proposedX;
                } else if (h.includes('e')) {
                    const proposedW = Math.max(minSize, Math.min(bounds.maxX - start.x, start.w + deltaX));
                    newR.w = proposedW;
                }
                if (h.includes('n')) {
                    const proposedY = Math.min(start.y + start.h - minSize, Math.max(bounds.minY, start.y + deltaY));
                    newR.h = start.y + start.h - proposedY;
                    newR.y = proposedY;
                } else if (h.includes('s')) {
                    const proposedH = Math.max(minSize, Math.min(bounds.maxY - start.y, start.h + deltaY));
                    newR.h = proposedH;
                }
            }

            newMaskRects[q] = newR;
            setMaskRects(newMaskRects);
        };

        const handleUp = () => setInteraction(null);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [interaction, maskRects, setMaskRects]);


    if (!isOpen || !image) return null;

    // --- Render Helpers ---

    const getPolygonPoints = (q) => {
        const points = maskPaths[q] || [];
        return points.map(p => `${p.x},${p.y}`).join(' ');
    };

    const QuadrantControls = () => {
        if (!selectedQ) return null;

        const mode = getActiveMode(selectedQ);
        const pathPoints = maskPaths[selectedQ] || [];

        return (
            <div className="absolute top-14 left-2 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-lg p-2 flex flex-col gap-1.5 shadow-2xl z-[60] animate-in slide-in-from-top-4 min-w-[100px]">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1">
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">
                        {selectedQ === 'tl' ? 'TL' : selectedQ === 'tr' ? 'TR' : selectedQ === 'bl' ? 'BL' : 'BR'}
                    </span>
                    <button onClick={() => toggleAdvanced(selectedQ)} className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase">
                        Off
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-md">
                    <button
                        onClick={() => setMaskModes({ ...maskModes, [selectedQ]: 'rect' })}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors ${mode === 'rect' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        <BoxSelect size={10} /> Rect
                    </button>
                    <button
                        onClick={() => setMaskModes({ ...maskModes, [selectedQ]: 'path' })}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors ${mode === 'path' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        <PenTool size={10} /> Path
                    </button>
                </div>

                {mode === 'path' && (
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                        <div className="flex-1">
                            <span className="font-mono text-white">{pathPoints.length}</span> pts
                        </div>
                        <button
                            onClick={() => {
                                const newPath = [...pathPoints];
                                newPath.pop();
                                setMaskPaths({ ...maskPaths, [selectedQ]: newPath });
                            }}
                            disabled={pathPoints.length === 0}
                            className="p-1 hover:bg-white/10 rounded text-sky-400 disabled:opacity-30"
                            title="Undo Last Point"
                        >
                            <Undo2 size={10} />
                        </button>
                        <button
                            onClick={() => setMaskPaths({ ...maskPaths, [selectedQ]: [] })}
                            disabled={pathPoints.length === 0}
                            className="p-1 hover:bg-red-500/20 rounded text-red-400 disabled:opacity-30"
                            title="Clear Path"
                        >
                            <Trash2 size={10} />
                        </button>
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className={`absolute inset-0 z-[100] flex items-center justify-center bg-[#020617] animate-in fade-in duration-300 overflow-hidden ${interaction ? 'cursor-grabbing' : ''}`}>

            {/* Header / Controls Overlay */}
            <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-50 pointer-events-none">
                <div className="space-y-0.5 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 pointer-events-auto shadow-2xl">
                    <h2 className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                        <Maximize className="text-sky-500" size={12} />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Adv. Crop
                        </span>
                    </h2>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    {/* Instructions */}
                    {selectedQ && getActiveMode(selectedQ) === 'path' && (
                        <div className="bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded text-sky-300 text-[8px] font-medium animate-pulse">
                            Add points. Close path.
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-lg border border-sky-400/30 group flex items-center gap-1 pr-2"
                    >
                        <Check size={12} className="group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Finish</span>
                    </button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div
                className={`relative w-full h-full grid place-items-center overflow-auto select-none bg-[#050510] 
                    ${selectedQ && getActiveMode(selectedQ) === 'path' ? 'cursor-crosshair' : ''}`}
                onClick={handleCanvasClick}
            >

                {/* Background Grid */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
                    }}
                />

                {/* The Reference Frame (80vmin base) */}
                <div
                    ref={containerRef}
                    className="relative flex-shrink-0 flex items-center justify-center group transition-all duration-200 ease-out"
                    style={{
                        width: `calc(80vmin * ${canvasScale})`,
                        height: `calc(80vmin * ${canvasScale})`
                    }}
                >

                    {/* Source Image */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <img
                            src={image}
                            className="max-w-none transition-all duration-500"
                            style={{
                                width: `calc(100% * ${scale} * ${orbImageScaleW})`,
                                height: `calc(100% * ${scale} * ${orbImageScaleH})`,
                                transform: `translate(calc(${xOffset}px * (80vmin * ${canvasScale} / ${orbSize})), calc(${yOffset}px * (80vmin * ${canvasScale} / ${orbSize})))`,
                                objectFit: 'contain'
                            }}
                            alt="Orb Preview"
                        />
                    </div>

                    {/* Mask Overlay (SVG) */}
                    <div className="absolute inset-0 z-20 overflow-visible pointer-events-none">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                            <defs>
                                <mask id="orbMenuMask">
                                    <rect x="-5000" y="-5000" width="10000" height="10000" fill="white" />
                                    <circle cx="50" cy="50" r="50" fill="black" />
                                    {['tl', 'tr', 'bl', 'br'].map(q => {
                                        if (!spillConfig[q]) return null;
                                        // If advanced is OFF, show infinite (or default big rects)
                                        // Wait, the logic is: mask reveals allowed area.
                                        // So black = hidden. white = visible.
                                        // The mask above starts with WHITE, then draws BLACK circle (hide enter).
                                        // The rects below are BLACK, meaning they HIDE overflow?
                                        // No, the original code had rects fill="black" which HIDES the spill area?
                                        // Wait, original code:
                                        // <rect width="10000" height="10000" fill="rgba(2, 6, 23, 0.95)" mask="url(#orbMenuMask)" />
                                        // The visualizer is a big dark overlay with HOLES punched in it.
                                        // So the MASK defines the HOLES.
                                        // In SVG mask, white = allow, black = block.
                                        // If the overlay uses the mask, areas that are WHITE in the mask will be VISIBLE (dark overlay).
                                        // Areas that are BLACK in the mask will be TRANSPARENT (reveal image).
                                        // So...
                                        // Background Rect (white) -> Overlay is Visible (Dark).
                                        // Circle (black) -> Overlay is Transparent (Show center Orb).
                                        // Spill Rects (black) -> Overlay is Transparent (Show Spill).

                                        if (!advancedMasks[q]) {
                                            // Show Default Infinite Spill
                                            // We need big black rects covering the quadrants
                                            const defaults = {
                                                tl: { x: -5000, y: -5000, width: 5050, height: 5050 },
                                                tr: { x: 50, y: -5000, width: 5050, height: 5050 },
                                                bl: { x: -5000, y: 50, width: 5050, height: 5050 },
                                                br: { x: 50, y: 50, width: 5050, height: 5050 }
                                            };
                                            const d = defaults[q];
                                            return <rect key={q} x={d.x} y={d.y} width={d.width} height={d.height} fill="black" />;
                                        }

                                        // Advanced Mode
                                        const mode = getActiveMode(q);
                                        if (mode === 'path') {
                                            const points = getPolygonPoints(q);
                                            if (!points) return null;
                                            return <polygon key={q} points={points} fill="black" />;
                                        } else {
                                            const r = maskRects[q];
                                            return <rect key={q} x={r.x} y={r.y} width={r.w} height={r.h} fill="black" />;
                                        }
                                    })}
                                </mask>
                            </defs>

                            {/* The Dark Overlay */}
                            <rect x="-5000" y="-5000" width="10000" height="10000" fill="rgba(2, 6, 23, 0.95)" mask="url(#orbMenuMask)" />

                            {/* Visual Guides */}
                            <circle cx="50" cy="50" r="50" fill="none" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="0.5" />
                            <line x1="50" y1="-1000" x2="50" y2="1000" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.2" />
                            <line x1="-1000" y1="50" x2="1000" y2="50" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.2" />

                            {/* Path Visualization (Active drawing lines) */}
                            {['tl', 'tr', 'bl', 'br'].map(q => {
                                if (!spillConfig[q] || !advancedMasks[q]) return null;
                                if (getActiveMode(q) !== 'path') return null;
                                const points = maskPaths[q] || [];
                                if (points.length === 0) return null;

                                const ptsString = points.map(p => `${p.x},${p.y}`).join(' ');

                                const isSelected = q === selectedQ;

                                return (
                                    <g key={q}>
                                        {/* The Polygon/Path itself (Stroke) */}
                                        <polyline
                                            points={ptsString}
                                            fill="none"
                                            stroke={isSelected ? "#38bdf8" : "rgba(56, 189, 248, 0.3)"}
                                            strokeWidth="0.5"
                                            strokeDasharray={isSelected ? "none" : "2 2"}
                                        />
                                        {/* Closing Line if not closed? No, polyline is open. Polygon is closed. */}
                                        {/* If we have > 2 points, we can show a lighter closing line to visualise the area */}
                                        {points.length > 2 && (
                                            <polygon
                                                points={ptsString}
                                                fill="rgba(56, 189, 248, 0.1)"
                                                stroke="none"
                                            />
                                        )}

                                        {/* Points */}
                                        {points.map((p, idx) => (
                                            <circle
                                                key={idx}
                                                cx={p.x}
                                                cy={p.y}
                                                r={isSelected ? 1.5 : 1}
                                                fill={idx === 0 && isSelected ? "#4ade80" : "#38bdf8"}
                                                className="cursor-pointer hover:r-2 transition-all"
                                                onMouseEnter={() => setHoverPoint(idx)}
                                                onMouseLeave={() => setHoverPoint(null)}
                                            />
                                        ))}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* CENTER CONTROLS */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center pointer-events-auto">
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 p-1 bg-black/50 backdrop-blur-md rounded-lg shadow-2xl border border-white/10">
                            {['tl', 'tr', 'bl', 'br'].map(q => (
                                <button
                                    key={q}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuadrantSelect(q);
                                    }}
                                    disabled={!spillConfig[q]}
                                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${!spillConfig[q] ? 'opacity-20 cursor-not-allowed bg-slate-800' :
                                        selectedQ === q ? 'bg-sky-500 text-white shadow-lg scale-110 ring-2 ring-sky-300' :
                                            advancedMasks[q] ? 'bg-slate-600 text-sky-400 border border-sky-500/30' :
                                                'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                        }`}
                                >
                                    {advancedMasks[q] ? (
                                        getActiveMode(q) === 'path' ? <PenTool size={14} /> : <BoxSelect size={14} />
                                    ) : (
                                        <MousePointer2 size={12} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rect Handles (Only render if Rect Mode) */}
                    <div className="absolute inset-0 pointer-events-none z-40">
                        {['tl', 'tr', 'bl', 'br'].map(q => {
                            if (!spillConfig[q] || !advancedMasks[q]) return null;
                            if (getActiveMode(q) !== 'rect') return null;

                            const r = maskRects[q];
                            const isSelected = selectedQ === q;

                            return (
                                <div
                                    key={q}
                                    onMouseDown={(e) => initDrag(e, q)}
                                    className={`absolute border-2 pointer-events-auto transition-all group cursor-grab active:cursor-grabbing
                                        ${isSelected ? 'border-sky-400 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.3)] z-50' : 'border-sky-500/30 hover:border-sky-500/50'}`}
                                    style={{
                                        left: `${r.x}%`,
                                        top: `${r.y}%`,
                                        width: `${r.w}%`,
                                        height: `${r.h}%`
                                    }}
                                >
                                    {/* Resize Handles - Only if Selected */}
                                    {isSelected && <>
                                        <div data-handle="nw" onMouseDown={(e) => initResize(e, q, 'nw')} className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border border-sky-500 rounded-sm cursor-nwse-resize z-50" />
                                        <div data-handle="ne" onMouseDown={(e) => initResize(e, q, 'ne')} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-sky-500 rounded-sm cursor-nesw-resize z-50" />
                                        <div data-handle="sw" onMouseDown={(e) => initResize(e, q, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border border-sky-500 rounded-sm cursor-nesw-resize z-50" />
                                        <div data-handle="se" onMouseDown={(e) => initResize(e, q, 'se')} className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border border-sky-500 rounded-sm cursor-nwse-resize z-50" />
                                    </>}
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Floating Controls */}
                <QuadrantControls />

                {/* Bottom Stats Bar */}
                <div className="absolute bottom-6 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-3 text-[9px] font-medium text-white/50 z-50">
                    <div className="flex items-center gap-1.5">
                        <ZoomIn size={10} className="text-sky-400" />
                        <span className="text-white">Scale: <span className="font-mono text-sky-400">{scale.toFixed(1)}x</span></span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <Move size={10} className="text-sky-400" />
                        <span className="text-white">Pos: <span className="font-mono text-sky-400">{xOffset},{yOffset}</span></span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <Maximize size={10} className="text-sky-400" />
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={canvasScale}
                            onChange={(e) => setCanvasScale(parseFloat(e.target.value))}
                            className="w-12 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                        />
                        <span className="font-mono text-sky-400 w-6 text-right">{(canvasScale * 100).toFixed(0)}%</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
