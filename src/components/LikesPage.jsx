import React, { useState, useEffect, useMemo } from 'react';
import { usePlaylistStore } from '../store/playlistStore';
import { useNavigationStore } from '../store/navigationStore';
import { getAllPlaylists, getPlaylistItems, createPlaylist, getPlaylistsForVideoIds } from '../api/playlistApi';
import VideoCard from './VideoCard';

import { useLayoutStore } from '../store/layoutStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BottomNavigation from './BottomNavigation';

const ITEMS_PER_PAGE = 24;

const LikesPage = ({ onVideoSelect }) => {
    const [likesPlaylistId, setLikesPlaylistId] = useState(null);
    const [likedVideos, setLikedVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [playlistMap, setPlaylistMap] = useState({}); // Maps video_id to array of playlist names
    const [allPlaylists, setAllPlaylists] = useState([]); // All playlists for name-to-ID lookup
    const [filteredPlaylist, setFilteredPlaylist] = useState(null); // Currently filtered playlist name (null = show all)

    const { currentVideoIndex, currentPlaylistItems, setPlaylistItems } = usePlaylistStore();
    const { setCurrentPage: setCurrentPageNav } = useNavigationStore();
    const { inspectMode } = useLayoutStore();

    useEffect(() => {
        const initLikes = async () => {
            setLoading(true);
            try {
                const playlists = await getAllPlaylists();
                setAllPlaylists(playlists || []);
                let likesPlaylist = playlists.find(p => p.name === 'Likes');

                // Create if doesn't exist (consistency with PlayerController)
                if (!likesPlaylist) {
                    const newId = await createPlaylist('Likes', 'Videos you have liked');
                    setLikesPlaylistId(newId);
                    setLikedVideos([]);
                    setPlaylistMap({});
                } else {
                    setLikesPlaylistId(likesPlaylist.id);
                    const items = await getPlaylistItems(likesPlaylist.id);
                    setLikedVideos(items || []);

                    // Load playlist associations for all liked videos
                    if (items && items.length > 0) {
                        const videoIds = items
                            .map(item => item.video_id)
                            .filter(id => id);

                        if (videoIds.length > 0) {
                            try {
                                const playlistsData = await getPlaylistsForVideoIds(videoIds);
                                setPlaylistMap(playlistsData || {});
                            } catch (error) {
                                console.error('Failed to load playlists for liked videos:', error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load likes:', error);
            } finally {
                setLoading(false);
            }
        };
        initLikes();
    }, []);

    // Extract unique playlists from all liked videos (must be before conditional returns)
    const uniquePlaylists = useMemo(() => {
        const playlistSet = new Set();
        Object.values(playlistMap).forEach(playlistNames => {
            playlistNames.forEach(name => {
                if (name !== 'Likes') { // Exclude 'Likes' itself
                    playlistSet.add(name);
                }
            });
        });
        return Array.from(playlistSet).sort();
    }, [playlistMap]);

    // Filter liked videos based on selected playlist
    const filteredLikedVideos = useMemo(() => {
        if (!filteredPlaylist) {
            return likedVideos;
        }
        return likedVideos.filter(video => {
            const playlists = playlistMap[video.video_id] || [];
            return playlists.includes(filteredPlaylist);
        });
    }, [likedVideos, playlistMap, filteredPlaylist]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredLikedVideos.length / ITEMS_PER_PAGE);
    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLikedVideos.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredLikedVideos, currentPage]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredPlaylist]);

    const handlePlaylistBadgeLeftClick = (e, playlistName) => {
        e.stopPropagation();
        e.preventDefault();

        // Toggle filter: if already filtered to this playlist, clear filter; otherwise, filter to this playlist
        if (filteredPlaylist === playlistName) {
            setFilteredPlaylist(null);
        } else {
            setFilteredPlaylist(playlistName);
        }
    };

    const handlePlaylistBadgeRightClick = async (e, playlistName) => {
        e.stopPropagation();
        e.preventDefault();

        // Find playlist by name
        const playlist = allPlaylists.find(p => p.name === playlistName);
        if (!playlist) {
            console.error(`Playlist "${playlistName}" not found`);
            return;
        }

        try {
            // Preview mode: Load playlist and navigate without changing the playing video
            const items = await getPlaylistItems(playlist.id);
            setPlaylistItems(items, playlist.id, null, playlist.name);
            setCurrentPageNav('videos');
        } catch (error) {
            console.error('Failed to load playlist items:', error);
        }
    };

    // Render video cards
    const renderVideos = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center p-12 text-slate-400">
                    <p>Loading liked videos...</p>
                </div>
            );
        }

        if (!likedVideos || likedVideos.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="text-xl font-medium mb-2">No Liked Videos</h3>
                    <p>Videos you like will appear here.</p>
                </div>
            );
        }

        if (filteredLikedVideos.length === 0 && filteredPlaylist) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="text-xl font-medium mb-2">No Liked Videos</h3>
                    <p>No liked videos from "{filteredPlaylist}".</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 animate-fade-in">
                {currentItems.map((video, index) => {
                    const isCurrentlyPlaying = currentPlaylistItems?.[currentVideoIndex]?.id === video.id;
                    const displayIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;

                    return (
                        <VideoCard
                            key={video.id || `liked-${index}`}
                            video={video}
                            index={displayIndex}
                            originalIndex={displayIndex}
                            isSelected={false}
                            isCurrentlyPlaying={isCurrentlyPlaying}
                            videoFolders={[]}
                            onVideoSelect={onVideoSelect}
                            onVideoClick={() => onVideoSelect(video.video_url)}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <BottomNavigation />


                <div className="px-4 pb-8 pt-0">
                    {renderVideos()}

                    {/* Pagination Controls (Bottom) */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8 pb-4">
                            <div className="flex items-center gap-2 bg-slate-900/60 rounded-full px-4 py-2 border border-white/10 backdrop-blur-md shadow-lg">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5) {
                                            if (currentPage > 3) {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            if (pageNum > totalPages) {
                                                pageNum = totalPages - 4 + i;
                                            }
                                        }

                                        if (pageNum < 1) pageNum = i + 1;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${currentPage === pageNum
                                                    ? 'bg-blue-500 text-white shadow-lg scale-110'
                                                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LikesPage;
