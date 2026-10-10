import React, { useMemo } from 'react';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

const OrbCard = ({ orb, onClick, onDelete }) => {
    const { removeOrbFavorite } = useConfigStore();

    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(orb.id);
        } else {
            removeOrbFavorite(orb.id);
        }
    };

    const visualizerBars = 113;

    // Calculate SVG path once for all bars to reduce DOM node count by 113x
    const visualizerPath = useMemo(() => {
        let d = "";
        for (let i = 0; i < visualizerBars; i++) {
            const angle = (i / visualizerBars) * Math.PI * 2;
            const x1 = 100 + 80 * Math.sin(angle);
            const y1 = 100 - 80 * Math.cos(angle);
            const x2 = 100 + 86 * Math.sin(angle);
            const y2 = 100 - 86 * Math.cos(angle);
            d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
        }
        return d;
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div
                className="group relative aspect-square w-[75%] max-w-[200px] mx-auto rounded-full overflow-visible transition-all flex items-center justify-center cursor-pointer"
                onClick={onClick}
            >
                {/* Aesthetic Dormant Visualizer Ring */}
                <svg viewBox="0 0 200 200" className="absolute inset-[-15%] w-[130%] h-[130%] pointer-events-none transform -rotate-[90deg] z-0">
                    <path
                        d={visualizerPath}
                        stroke={orb.visualizerColor || "currentColor"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        className="text-black dark:text-white/80 opacity-80 group-hover:opacity-100 group-hover:dark:text-white transition-all duration-300 drop-shadow-sm"
                    />
                </svg>

                {/* Circular mask for the background */}
                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-md group-hover:shadow-lg transition-shadow z-10">
                    {orb.customOrbImage ? (
                        <img
                            src={orb.customOrbImage}
                            alt={orb.name || "Orb Preset"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                        </div>
                    )}

                    {/* Hover Overlay: Name & Delete Option */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between items-center text-center p-3">
                        <div className="flex-1 flex items-center justify-center w-full px-1 pt-2">
                            <h3 className="font-bold text-white text-xs leading-tight truncate w-full drop-shadow-md">
                                {orb.name || "Untitled Orb"}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="p-1.5 rounded-full transition-colors bg-red-500/80 hover:bg-red-600 text-white shadow-sm border border-black/10 flex items-center justify-center mb-1 shrink-0"
                            title="Delete Orb"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrbCard;
