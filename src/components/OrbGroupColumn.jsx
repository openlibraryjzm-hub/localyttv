import React, { useEffect, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

const OrbGroupColumn = ({
    leader,
    members,
    onClose,
    onOrbSelect,
    activeOrbId
}) => {
    const columnRef = useRef(null);
    const {
        updateOrbFavorite
    } = useConfigStore();

    useEffect(() => {
        if (columnRef.current) {
            columnRef.current.scrollTop = 0;
        }
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const renderOrbVisual = (orb) => {
        const isSpill = orb.isSpillEnabled;
        const effectiveSpill = orb.orbSpill || { tl: true, tr: true, bl: true, br: true };

        return (
            <div className="relative w-full aspect-square max-w-[300px] mx-auto">
                {/* Local Defs for Member */}
                {isSpill && (
                    <svg width="0" height="0" className="absolute pointer-events-none">
                        <defs>
                            <clipPath id={`orbGroupClipPath-${orb.id}`} clipPathUnits="objectBoundingBox">
                                <circle cx="0.5" cy="0.5" r="0.5" />
                                {effectiveSpill.tl && (
                                    orb.orbAdvancedMasks?.tl && orb.orbMaskRects?.tl
                                        ? <rect x={orb.orbMaskRects.tl.x / 100} y={orb.orbMaskRects.tl.y / 100} width={orb.orbMaskRects.tl.w / 100} height={orb.orbMaskRects.tl.h / 100} />
                                        : <rect x="-50" y="-50" width="50.5" height="50.5" />
                                )}
                                {effectiveSpill.tr && (
                                    orb.orbAdvancedMasks?.tr && orb.orbMaskRects?.tr
                                        ? <rect x={orb.orbMaskRects.tr.x / 100} y={orb.orbMaskRects.tr.y / 100} width={orb.orbMaskRects.tr.w / 100} height={orb.orbMaskRects.tr.h / 100} />
                                        : <rect x="0.5" y="-50" width="50.5" height="50.5" />
                                )}
                                {effectiveSpill.bl && (
                                    orb.orbAdvancedMasks?.bl && orb.orbMaskRects?.bl
                                        ? <rect x={orb.orbMaskRects.bl.x / 100} y={orb.orbMaskRects.bl.y / 100} width={orb.orbMaskRects.bl.w / 100} height={orb.orbMaskRects.bl.h / 100} />
                                        : <rect x="-50" y="0.5" width="50.5" height="50.5" />
                                )}
                                {effectiveSpill.br && (
                                    orb.orbAdvancedMasks?.br && orb.orbMaskRects?.br
                                        ? <rect x={orb.orbMaskRects.br.x / 100} y={orb.orbMaskRects.br.y / 100} width={orb.orbMaskRects.br.w / 100} height={orb.orbMaskRects.br.h / 100} />
                                        : <rect x="0.5" y="0.5" width="50.5" height="50.5" />
                                )}
                            </clipPath>
                        </defs>
                    </svg>
                )}

                <div className={`w-full h-full rounded-full border-4 transition-all duration-200 relative overflow-visible bg-sky-50 ${activeOrbId === orb.id
                    ? 'border-sky-500 ring-4 ring-sky-200 shadow-lg'
                    : 'border-slate-200 group-hover/card:border-sky-300'
                    }`}>
                    {/* Image Layer */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center z-40"
                        style={{
                            clipPath: isSpill ? `url(#orbGroupClipPath-${orb.id})` : 'circle(50% at 50% 50%)',
                            overflow: 'visible'
                        }}
                    >
                        <img
                            src={orb.customOrbImage}
                            alt={orb.name}
                            className="max-w-none transition-all duration-500"
                            style={{
                                width: isSpill ? `calc(100% * ${orb.orbImageScale || 1})` : '100%',
                                height: isSpill ? `calc(100% * ${orb.orbImageScale || 1})` : '100%',
                                transform: isSpill ? `translate(${(orb.orbImageXOffset || 0) * 0.3}px, ${(orb.orbImageYOffset || 0) * 0.3}px)` : 'none',
                                objectFit: isSpill ? 'contain' : 'cover'
                            }}
                        />
                    </div>

                    {/* Glass Overlay */}
                    <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                        <div className="absolute inset-0 bg-sky-200/10" />
                    </div>
                </div>

                {/* Spill Badge */}
                {isSpill && (
                    <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider z-50 shadow-md">
                        Spill
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="absolute inset-0 z-[100] flex flex-col"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker background to make orbs pop
                backdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-800/50 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50 backdrop-blur-md"
            >
                <X size={24} />
            </button>

            {/* Column Container */}
            <div
                ref={columnRef}
                className="h-full overflow-y-auto overflow-x-hidden relative flex flex-col items-center py-20 gap-16 animate-in slide-in-from-bottom-10 duration-500"
                style={{ scrollbarWidth: 'none' }}
            >
                {/* Header / Leader Info */}
                <div className="flex flex-col items-center gap-2 mb-4 text-white animate-in fade-in slide-in-from-top-4 duration-700">
                    <h2 className="text-3xl font-black uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                        {leader.name}
                    </h2>
                    <p className="text-sky-400 font-bold tracking-wide uppercase text-sm bg-sky-900/30 px-3 py-1 rounded-full border border-sky-500/20">
                        {members.length} Members
                    </p>
                </div>

                {members.length === 0 && (
                    <div className="text-slate-400 text-lg font-medium">
                        No members found
                    </div>
                )}

                {/* Subordinates List */}
                {members.map((member) => (
                    <div
                        key={member.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onOrbSelect) onOrbSelect(member);
                        }}
                        className="group/card relative flex flex-row items-center gap-6 p-4 rounded-3xl transition-all duration-300 w-full max-w-[800px] hover:bg-white/5"
                    >
                        {/* Orb Visual Area */}
                        <div className="relative w-[200px] h-[200px] flex-shrink-0 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover/card:drop-shadow-[0_20px_40px_rgba(14,165,233,0.2)] transition-all cursor-pointer hover:scale-105">
                            {renderOrbVisual(member)}
                        </div>

                        {/* Control Panel (Config Sliders & Toggles) */}
                        <div
                            className="flex-1 flex flex-col items-start gap-4 bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 transition-all hover:border-sky-500/30"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Name Label */}
                            <h3 className="text-xl font-bold text-white drop-shadow-md mb-2 flex items-center gap-2">
                                {member.name}
                                {leader.id === member.id && (
                                    <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
                                        Leader
                                    </span>
                                )}
                            </h3>

                            {/* Configuration Controls */}
                            <div className="flex flex-col gap-4 w-full">
                                {/* Sliders Row */}
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    {/* Scale */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                            <span>Scale</span>
                                            <span>{(member.orbImageScale || 1).toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="3"
                                            step="0.1"
                                            value={member.orbImageScale || 1}
                                            onChange={(e) => updateOrbFavorite(member.id, { orbImageScale: parseFloat(e.target.value) })}
                                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                                        />
                                    </div>

                                    {/* Opacity (Disabled/Placeholder) */}
                                    <div className="flex flex-col gap-1 opacity-50">
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                            <span>Opacity</span>
                                            <span>100%</span>
                                        </div>
                                        <input type="range" disabled className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                    </div>

                                    {/* X-Offset */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                            <span>X-Offset</span>
                                            <span>{member.orbImageXOffset || 0}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={member.orbImageXOffset || 0}
                                            onChange={(e) => updateOrbFavorite(member.id, { orbImageXOffset: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                                        />
                                    </div>

                                    {/* Y-Offset */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                            <span>Y-Offset</span>
                                            <span>{member.orbImageYOffset || 0}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={member.orbImageYOffset || 0}
                                            onChange={(e) => updateOrbFavorite(member.id, { orbImageYOffset: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                                        />
                                    </div>
                                </div>

                                {/* Header Divider */}
                                <div className="w-full h-px bg-white/10" />

                                {/* Toggles Row */}
                                <div className="flex items-center gap-4">
                                    {/* Spill Toggle */}
                                    <button
                                        onClick={() => updateOrbFavorite(member.id, { isSpillEnabled: !(member.isSpillEnabled) })}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 ${member.isSpillEnabled
                                            ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 hover:bg-sky-500/30'
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                                            }`}
                                    >
                                        <Check size={12} className={member.isSpillEnabled ? 'opacity-100' : 'opacity-0'} />
                                        Spill
                                    </button>

                                    {/* Quadrant Toggles (Mini) */}
                                    {member.isSpillEnabled && (
                                        <div className="flex gap-1">
                                            {['tl', 'tr', 'bl', 'br'].map(q => (
                                                <button
                                                    key={q}
                                                    onClick={() => updateOrbFavorite(member.id, {
                                                        orbSpill: {
                                                            ...(member.orbSpill || { tl: true, tr: true, bl: true, br: true }),
                                                            [q]: !(member.orbSpill?.[q] ?? true)
                                                        }
                                                    })}
                                                    className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${member.orbSpill?.[q] ?? true
                                                        ? 'bg-sky-500 text-white border-sky-400'
                                                        : 'bg-slate-800 text-slate-500 border-slate-700'
                                                        }`}
                                                    title={`Toggle ${q.toUpperCase()}`}
                                                >
                                                    <span className="text-[9px] font-bold uppercase">{q}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrbGroupColumn;
