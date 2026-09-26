import React, { useEffect, useRef } from 'react';
import { Layers, X, Check, Plus } from 'lucide-react';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { useFolderStore } from '../store/folderStore';
import { FOLDER_COLORS } from '../utils/folderColors';

/**
 * Full-screen column overlay for assigning a playlist to a colored folder (group carousel).
 * Shows 16 slots in FOLDER_COLORS order: existing groups as cards (with that color), or a colored placeholder
 * that creates a new group for that color when clicked.
 */
const PlaylistGroupColumn = ({ playlist, onClose, playlists = [], playlistThumbnails = {}, prismPage = 1 }) => {
    const columnRef = useRef(null);
    const {
        getGroupByColorId,
        addGroup,
        addPlaylistToGroup,
        removePlaylistFromGroup,
        isPlaylistInGroup,
    } = usePlaylistGroupStore();
    const { setHoveredFolder } = useFolderStore();

    useEffect(() => {
        if (columnRef.current) {
            columnRef.current.scrollTop = 0;
        }
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleGroupClick = (e, group) => {
        e.stopPropagation();
        const inGroup = isPlaylistInGroup(playlist.id, group.id);
        if (inGroup) {
            removePlaylistFromGroup(group.id, playlist.id);
        } else {
            addPlaylistToGroup(group.id, playlist.id);
        }
    };

    const handlePlaceholderClick = (e, color) => {
        e.stopPropagation();
        const newGroupId = addGroup(color.name, color.id, prismPage);
        addPlaylistToGroup(newGroupId, playlist.id);
    };

    return (
        <div
            className="absolute inset-0 z-50 flex flex-col"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50"
                aria-label="Close"
            >
                <X size={24} />
            </button>

            <div
                ref={columnRef}
                className="h-full overflow-y-auto overflow-x-hidden relative flex flex-col items-center py-20 gap-8 animate-in slide-in-from-bottom-10 duration-300"
                style={{ scrollbarWidth: 'none' }}
            >
                <div className="text-white/90 text-center px-4 mb-2">
                    <p className="text-sm font-medium">Assign to colored folder</p>
                    <p className="text-xs text-slate-400 truncate max-w-md mt-1">{playlist?.name}</p>
                </div>

                {FOLDER_COLORS.map((color) => {
                    const group = getGroupByColorId(color.id, prismPage);
                    const isPlaceholder = !group;

                    if (isPlaceholder) {
                        return (
                            <div
                                key={color.id}
                                onClick={(e) => handlePlaceholderClick(e, color)}
                                onMouseEnter={() => setHoveredFolder(color.id)}
                                onMouseLeave={() => setHoveredFolder(undefined)}
                                className="group relative flex-shrink-0 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                                style={{ width: '500px' }}
                            >
                                <div
                                    className="border-2 rounded-xl p-2 shadow-2xl transition-all h-full flex flex-col relative overflow-hidden border-white/20 hover:border-white/50"
                                    style={{ backgroundColor: color.hex + '40' }}
                                >
                                    <div className="mb-3 px-2 flex items-center justify-between gap-2 z-10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Layers className="w-5 h-5 flex-shrink-0 opacity-80" style={{ color: color.hex }} />
                                            <h3 className="font-bold text-xl truncate text-white/90 drop-shadow-md" style={{ color: 'inherit' }}>
                                                {color.name}
                                            </h3>
                                        </div>
                                        <span className="flex items-center gap-1 text-white/80 text-sm font-medium flex-shrink-0">
                                            <Plus size={18} strokeWidth={2.5} />
                                            Add playlist
                                        </span>
                                    </div>
                                    <div
                                        className="rounded-lg overflow-hidden relative mt-auto z-10 border-2 border-white/20 flex items-center justify-center"
                                        style={{
                                            width: '100%',
                                            paddingBottom: '56.25%',
                                            backgroundColor: color.hex + '30',
                                        }}
                                    >
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                            <span className="text-4xl font-bold text-white/90 drop-shadow-lg">+</span>
                                            <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
                                                Create {color.name} carousel
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    const inGroup = playlist && isPlaylistInGroup(playlist.id, group.id);
                    const count = group.playlistIds?.length ?? 0;
                    const firstPlaylistId = group.playlistIds?.[0];
                    const thumbData = firstPlaylistId ? playlistThumbnails[firstPlaylistId] : null;
                    const thumbnailUrl = thumbData?.max || thumbData?.standard || null;

                    return (
                        <div
                            key={group.id}
                            onClick={(e) => handleGroupClick(e, group)}
                            onMouseEnter={() => setHoveredFolder(color.id)}
                            onMouseLeave={() => setHoveredFolder(undefined)}
                            className="group relative flex-shrink-0 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                            style={{ width: '500px' }}
                        >
                            <div
                                className="border-2 rounded-xl p-2 shadow-2xl transition-all h-full flex flex-col relative overflow-hidden"
                                style={{
                                    borderColor: inGroup ? color.hex : 'rgba(255,255,255,0.25)',
                                    backgroundColor: inGroup ? color.hex + '25' : color.hex + '12',
                                }}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at center, ${color.hex}, transparent 70%)` }}
                                />

                                <div className="mb-3 px-2 flex items-center justify-between gap-2 z-10">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Layers className="w-5 h-5 flex-shrink-0" style={{ color: color.hex }} />
                                        <h3 className="font-bold text-xl truncate text-[#052F4A] group-hover:opacity-90 transition-colors">
                                            {group.name}
                                        </h3>
                                    </div>
                                    {inGroup && (
                                        <span className="flex items-center gap-1 text-sm font-medium flex-shrink-0" style={{ color: color.hex }}>
                                            <Check size={18} strokeWidth={3} />
                                            In carousel
                                        </span>
                                    )}
                                </div>

                                <div
                                    className="rounded-lg overflow-hidden relative mt-auto z-10 border-2 border-[#052F4A]/30 shadow-inner"
                                    style={{
                                        width: '100%',
                                        paddingBottom: '56.25%',
                                        backgroundColor: thumbnailUrl ? undefined : color.hex + '20',
                                    }}
                                >
                                    {thumbnailUrl ? (
                                        <img
                                            src={thumbnailUrl}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                            <span className="text-2xl font-bold text-[#052F4A]">{count}</span>
                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                playlist{count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                    {thumbnailUrl && count > 0 && (
                                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                                            {count} playlist{count !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlaylistGroupColumn;
