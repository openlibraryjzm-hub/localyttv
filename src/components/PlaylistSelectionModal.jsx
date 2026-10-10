import React, { useState, useEffect } from 'react';
import { getAllPlaylists, getAllPlaylistMetadata } from '../api/playlistApi';
import { getThumbnailUrl } from '../utils/youtubeUtils';

const PlaylistSelectionModal = ({ isOpen, onClose, onSelect, title = 'Select Playlist' }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadPlaylists();
        }
    }, [isOpen]);

    const loadPlaylists = async () => {
        try {
            setLoading(true);
            const [playlistsData, metadataList] = await Promise.all([
                getAllPlaylists(),
                getAllPlaylistMetadata().catch(() => [])
            ]);

            const metadataMap = new Map();
            if (Array.isArray(metadataList)) {
                metadataList.forEach(m => metadataMap.set(m.playlist_id, m));
            }

            const playlistsWithThumbs = (playlistsData || []).map(playlist => {
                const meta = metadataMap.get(playlist.id);
                let thumbnailUrl = null;
                let itemCount = meta ? meta.count : 0;

                if (playlist.custom_thumbnail_url) {
                    thumbnailUrl = playlist.custom_thumbnail_url;
                } else if (meta && meta.first_video) {
                    const vid = meta.first_video;
                    thumbnailUrl = vid.thumbnail_url || (vid.video_id ? getThumbnailUrl(vid.video_id, 'medium') : null);
                }

                return {
                    ...playlist,
                    itemCount,
                    thumbnailUrl
                };
            });

            setPlaylists(playlistsWithThumbs);
        } catch (err) {
            console.error('Failed to load playlists:', err);
            setError('Failed to load playlists');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-xl border-2 border-[#052F4A] max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-[#052F4A] bg-slate-200/80">
                    <h3 className="text-base font-bold text-[#052F4A]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#052F4A] hover:bg-[#052F4A]/10 transition-colors border border-[#052F4A]/20"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="w-8 h-8 border-4 border-[#052F4A] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center text-red-600 font-medium">
                            {error}
                            <button
                                onClick={loadPlaylists}
                                className="block mx-auto mt-2 text-sm text-[#052F4A] hover:underline font-bold"
                            >
                                Retry
                            </button>
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="p-8 text-center text-[#052F4A]/70 font-medium">
                            No playlists found.
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    onClick={() => onSelect(playlist.id)}
                                    className="w-full text-left px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200/80 border border-[#052F4A]/20 transition-all flex items-center gap-3.5 group shadow-sm hover:border-[#052F4A]/50"
                                >
                                    {playlist.thumbnailUrl ? (
                                        <img
                                            src={playlist.thumbnailUrl}
                                            alt={playlist.name}
                                            className="w-14 h-10 rounded-lg object-cover flex-shrink-0 border border-[#052F4A]/20 shadow-sm"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                if (e.target.nextSibling) {
                                                    e.target.nextSibling.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="w-14 h-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 text-[#052F4A] group-hover:bg-[#052F4A] group-hover:text-white transition-colors border border-[#052F4A]/20"
                                        style={{ display: playlist.thumbnailUrl ? 'none' : 'flex' }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-[#052F4A] font-bold text-sm truncate">{playlist.name}</h4>
                                            <span className="text-[11px] font-semibold text-[#052F4A]/70 bg-slate-100 px-2 py-0.5 rounded-md border border-[#052F4A]/10 shrink-0">
                                                {playlist.itemCount} {playlist.itemCount === 1 ? 'item' : 'items'}
                                            </span>
                                        </div>
                                        {playlist.description && (
                                            <p className="text-xs text-[#052F4A]/70 truncate mt-0.5">{playlist.description}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t-2 border-[#052F4A] bg-slate-200/80 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-white hover:bg-slate-100 text-[#052F4A] font-bold rounded-xl border border-[#052F4A]/30 transition-colors text-sm shadow-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaylistSelectionModal;
