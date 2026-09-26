import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import CardThumbnail from './CardThumbnail';
import CardContent from './CardContent';
import CardActions from './CardActions';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import { getFolderColorById } from '../utils/folderColors';
import { getAllPlaylists, getPlaylistItems } from '../api/playlistApi';
import { MoreHorizontal, Edit2, Trash2, FolderOpen, Play } from 'lucide-react';

const GroupCard = ({
    group,
    onGroupClick,
    onEditClick,
    onDeleteClick,
    index,
    isDeleting = false
}) => {
    const [thumbnails, setThumbnails] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load sample thumbnails from playlists in this group
    useEffect(() => {
        let isMounted = true;

        const loadThumbnails = async () => {
            if (!group.playlistIds || group.playlistIds.length === 0) {
                if (isMounted) {
                    setThumbnails([]);
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            try {
                const allPlaylists = await getAllPlaylists();
                const groupPlaylists = allPlaylists.filter(p => group.playlistIds.some(id => String(id) === String(p.id)));

                // We'll try to find up to 4 different thumbnails
                let foundThumbnails = [];

                for (const playlist of groupPlaylists) {
                    if (foundThumbnails.length >= 4) break;

                    try {
                        const items = await getPlaylistItems(playlist.id);
                        if (items && items.length > 0) {
                            const video = items[0];
                            const thumbUrl = video.thumbnail_url || getThumbnailUrl(video.video_id, 'medium');
                            if (thumbUrl) {
                                foundThumbnails.push(thumbUrl);
                            }
                        }
                    } catch (err) {
                        console.warn('Failed to load items for playlist', playlist.id);
                    }
                }

                if (isMounted) {
                    setThumbnails(foundThumbnails);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load thumbnails for group', group.id, err);
                if (isMounted) setLoading(false);
            }
        };

        loadThumbnails();

        return () => { isMounted = false; };
    }, [group.playlistIds]);

    // Handle the menu actions
    const [showMenu, setShowMenu] = useState(false);

    const handleMenuClick = (e, action) => {
        e.stopPropagation();
        setShowMenu(false);
        if (action === 'edit' && onEditClick) onEditClick(group);
        if (action === 'delete' && onDeleteClick) onDeleteClick(group);
    };

    return (
        <Card
            onClick={() => onGroupClick && onGroupClick(group)}
            className={`relative group ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="relative aspect-video bg-slate-800 rounded-t-xl overflow-hidden flex flex-col">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                        <div className="w-8 h-8 border-4 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
                    </div>
                ) : thumbnails.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-800">
                        <FolderOpen size={48} className="opacity-20" />
                    </div>
                ) : (
                    <div className={`absolute inset-0 grid ${thumbnails.length > 1 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1'} gap-0.5 bg-slate-900`}>
                        {thumbnails.map((url, i) => (
                            <div key={i} className="relative w-full h-full overflow-hidden bg-slate-800">
                                <img
                                    src={url}
                                    alt={`Group thumbnail ${i}`}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                        ))}
                        {/* Fill remaining slots if any */}
                        {thumbnails.length > 1 && thumbnails.length < 4 && Array.from({ length: 4 - thumbnails.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-slate-800 w-full h-full" />
                        ))}
                    </div>
                )}

                {/* Play Overlay (matches other cards) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-300">
                        <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                </div>
            </div>

            <CardContent>
                <div className="flex justify-between items-start pt-2">
                    <div className="min-w-0 pr-4">
                        <h3 className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                            {group.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 flex items-center gap-1 rounded font-medium border border-slate-700/50">
                                {group.playlistIds ? group.playlistIds.length : 0} Playlists
                            </span>
                        </div>
                        {group.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{group.description}</p>
                        )}
                    </div>

                    <div className="relative z-20" data-ignore-card-click="true">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                    <button
                                        onClick={(e) => handleMenuClick(e, 'edit')}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-200"
                                    >
                                        <Edit2 size={14} />
                                        Edit Group
                                    </button>
                                    <button
                                        onClick={(e) => handleMenuClick(e, 'delete')}
                                        className="w-full text-left px-4 py-2 hover:bg-rose-500/20 hover:text-rose-400 flex items-center gap-2 text-sm text-slate-200"
                                    >
                                        <Trash2 size={14} />
                                        Delete Group
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GroupCard;
