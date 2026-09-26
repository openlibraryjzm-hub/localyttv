import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

const PageGroupColumn = ({
    leader,
    members,
    onClose,
    onSelect,
    activeId
}) => {
    const columnRef = useRef(null);
    const {
        updateLayer2Image // Added this for the new sliders
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

    const renderBannerVisual = (banner) => {
        return (
            <div className="relative w-full aspect-video mx-auto">
                <div className={`w-full h-full rounded-lg border-2 transition-all duration-200 relative overflow-hidden bg-slate-800 ${activeId === banner.id
                    ? 'border-purple-500 ring-4 ring-purple-500/30 shadow-lg'
                    : 'border-slate-600 group-hover/card:border-purple-400'
                    }`}>
                    <img
                        src={banner.image}
                        alt={banner.folderName || 'Banner'}
                        className="w-full h-full object-cover transition-all duration-500 group-hover/card:scale-105"
                        style={{
                            transform: `scale(${(banner.scale || 100) / 100}) translate(${(banner.xOffset || 50) - 50}%, ${(banner.yOffset || 50) - 50}%)`
                        }}
                    />

                    {/* Glass Overlay just for sheen */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                </div>
            </div>
        );
    };

    return (
        <div
            className="absolute inset-0 z-[100] flex flex-col"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(12px)'
            }}
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-800/80 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50 backdrop-blur-md"
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
                    <h2 className="text-3xl font-black uppercase tracking-widest drop-shadow-md text-center">
                        {leader.folderName || 'Banner Group'}
                    </h2>
                    <p className="text-purple-300 font-bold tracking-wide uppercase text-sm bg-purple-900/40 px-3 py-1 rounded-full border border-purple-500/30">
                        {members.length} Members
                    </p>
                </div>

                {members.length === 0 && (
                    <div className="text-slate-400 text-lg font-medium">
                        No members found
                    </div>
                )}

                {/* Members List */}
                {members.map((member) => {
                    return (
                        <div
                            key={member.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onSelect) onSelect(member);
                            }}
                            className="group/card relative flex flex-row items-center gap-6 p-4 rounded-3xl transition-all duration-300 w-full max-w-[900px] hover:bg-white/5"
                        >
                            {/* Banner Visual Area */}
                            <div className="relative w-[300px] flex-shrink-0 shadow-2xl transition-all cursor-pointer hover:scale-105">
                                {renderBannerVisual(member)}
                            </div>

                            {/* Control Panel (Config Sliders) */}
                            <div
                                className="flex-1 flex flex-col items-start gap-4 bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 transition-all hover:border-purple-500/30 min-h-[169px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Name Label */}
                                {member.folderName && (
                                    <h3 className="text-sm font-bold text-white drop-shadow-md mb-2 bg-black/50 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 w-fit">
                                        {member.folderName} / {member.id.substring(0, 4)}
                                        {member.id === leader.id && (
                                            <span className="text-[9px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm ml-1">
                                                Leader
                                            </span>
                                        )}
                                    </h3>
                                )}

                                {/* Configuration Controls */}
                                <div className="flex flex-col gap-4 w-full">
                                    {/* Sliders Row */}
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        {/* Scale */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                                <span>Scale</span>
                                                <span>{(member.scale || 100).toFixed(0)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="50"
                                                max="200"
                                                value={member.scale || 100}
                                                onChange={(e) => updateLayer2Image(member.folderId, member.id, { scale: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
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
                                                <span>{member.xOffset || 50}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={member.xOffset || 50}
                                                onChange={(e) => updateLayer2Image(member.folderId, member.id, { xOffset: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                                            />
                                        </div>

                                        {/* Y-Offset */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                                <span>Y-Offset</span>
                                                <span>{member.yOffset || 50}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={member.yOffset || 50}
                                                onChange={(e) => updateLayer2Image(member.folderId, member.id, { yOffset: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PageGroupColumn;
