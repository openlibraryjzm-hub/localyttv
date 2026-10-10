import React, { useMemo } from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

/**
 * BannerPresetCard
 * Displays a banner preset as a simplified card with thumbnail, name, assigned playlists, and delete button.
 */
const BannerPresetCard = ({
    preset,
    allPlaylists = [],
    onClick,
    onDelete,
    isSelected,
    className = ''
}) => {
    const { removeBannerPreset } = useConfigStore();

    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(preset.id);
        } else {
            removeBannerPreset(preset.id);
        }
    };

    // Calculate active playlist names for display
    const activePlaylistNames = useMemo(() => {
        if (!preset?.playlistIds || preset.playlistIds.length === 0) return "No Playlists";
        return allPlaylists
            .filter(p => preset.playlistIds.includes(p.id))
            .map(p => p.name)
            .join(", ");
    }, [preset?.playlistIds, allPlaylists]);

    const bannerImage = preset?.splitscreenBanner?.image || preset?.customBannerImage || preset?.fullscreenBanner?.image;

    return (
        <div
            className={`group relative bg-white dark:bg-slate-800 rounded-2xl border border-black dark:border-black shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full cursor-pointer ${isSelected ? 'ring-2 ring-sky-500' : ''} ${className}`}
            onClick={onClick}
        >
            {/* Thumbnail Section */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                {bannerImage ? (
                    <img
                        src={bannerImage}
                        alt={preset?.name || "Banner Preset"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                    </div>
                )}

                {/* Overlay Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>

            {/* Content Section: Name, Assigned Playlists & Delete Button */}
            <div className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight truncate">
                        {preset?.name || "Untitled Banner"}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5" title={activePlaylistNames}>
                        {activePlaylistNames}
                    </p>
                </div>

                {/* Delete Button */}
                <button
                    type="button"
                    onClick={handleDelete}
                    className="p-1.5 rounded-full transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                    title="Delete Banner Preset"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

export default BannerPresetCard;
