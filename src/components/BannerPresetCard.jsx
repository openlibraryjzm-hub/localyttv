import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, Plus, MoreHorizontal, Image as ImageIcon, Trash2 } from 'lucide-react';

/**
 * BannerPresetCard
 * Displays a banner preset as a card, similar to VideoCard and OrbCard.
 * Allows assigning the preset to playlists via a dropdown menu.
 */
const BannerPresetCard = ({
    preset,
    allPlaylists = [],
    onUpdatePlaylists,
    onClick,
    isSelected,
    className = '',
    currentPlaylistId
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const togglePlaylist = (playlistId) => {
        if (!onUpdatePlaylists) return;

        const currentIds = preset.playlistIds || [];
        const newIds = currentIds.includes(playlistId)
            ? currentIds.filter(id => id !== playlistId)
            : [...currentIds, playlistId];

        onUpdatePlaylists(preset.id, newIds);
    };

    const handleRemoveFromCurrentPlaylist = (e) => {
        e.stopPropagation();
        if (!currentPlaylistId || !onUpdatePlaylists) return;

        if (window.confirm(`Remove "${preset.name}" from this playlist?`)) {
            const currentIds = preset.playlistIds || [];
            // Filter out current playlist ID (handle string/number mismatch)
            const newIds = currentIds.filter(id => String(id) !== String(currentPlaylistId));
            onUpdatePlaylists(preset.id, newIds);
        }
    };

    // Calculate active playlist names for display/tooltip
    const activePlaylistNames = useMemo(() => {
        if (!preset.playlistIds || preset.playlistIds.length === 0) return "No Playlists";
        return allPlaylists
            .filter(p => preset.playlistIds.includes(p.id))
            .map(p => p.name)
            .join(", ");
    }, [preset.playlistIds, allPlaylists]);

    return (
        <div
            className={`group relative bg-white dark:bg-slate-800 rounded-2xl border border-black dark:border-black shadow-sm hover:shadow-md transition-all overflow-visible flex flex-col h-full ${isSelected ? 'ring-2 ring-sky-500' : ''} ${className}`}
            onClick={onClick}
        >
            {/* Thumbnail Section */}
            <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-900">
                {preset.splitscreenBanner?.image || preset.customBannerImage || preset.fullscreenBanner?.image ? (
                    <img
                        src={preset.splitscreenBanner?.image || preset.customBannerImage || preset.fullscreenBanner?.image}
                        alt={preset.name || "Banner Preset"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>

            {/* Content Section */}
            <div className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-2">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight truncate">
                        {preset.name || "Untitled Banner"}
                    </h3>
                    <p className="text-xs text-slate-500 truncate" title={activePlaylistNames}>
                        {activePlaylistNames}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {/* Remove Button (Only if in a playlist context) */}
                    {currentPlaylistId && (
                        <button
                            onClick={handleRemoveFromCurrentPlaylist}
                            className="p-1.5 rounded-full transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Remove from this playlist"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}

                    {/* Playlist Assignment Menu */}
                    <div className="relative">
                        <button
                            ref={buttonRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className={`p-1.5 rounded-full transition-colors ${isMenuOpen
                                ? 'bg-sky-500 text-white'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                }`}
                            title="Assign to Playlists"
                        >
                            {preset.playlistIds?.length > 0 ? <Check size={14} /> : <Plus size={14} />}
                        </button>

                        {isMenuOpen && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                    <span className="font-bold text-xs uppercase text-slate-500 pl-2">Assign to Playlists</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-1">
                                    {allPlaylists.map(playlist => {
                                        const isSelected = preset.playlistIds?.includes(playlist.id);
                                        return (
                                            <button
                                                key={playlist.id}
                                                onClick={() => togglePlaylist(playlist.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${isSelected
                                                    ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                <span className="truncate">{playlist.name}</span>
                                                {isSelected && <Check size={14} />}
                                            </button>
                                        );
                                    })}
                                    {allPlaylists.length === 0 && (
                                        <div className="px-3 py-4 text-center text-slate-400 italic text-xs">
                                            No playlists found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannerPresetCard;
