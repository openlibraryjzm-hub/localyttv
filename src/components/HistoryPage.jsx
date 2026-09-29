import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Pin } from 'lucide-react';
import { getWatchHistory, getPlaylistsForVideoIds, getAllPlaylists, getPlaylistItems, getVideoFolderAssignments, getAllFolderAssignments, getFolderMetadata, getVideosInFolder } from '../api/playlistApi';
import { getThumbnailUrl, extractVideoId } from '../utils/youtubeUtils';
import { getFolderColorById } from '../utils/folderColors';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useNavigationStore } from '../store/navigationStore';
import { usePinStore } from '../store/pinStore';
import { useConfigStore } from '../store/configStore';
import Card from './Card';
import CardThumbnail from './CardThumbnail';
import CardContent from './CardContent';
import BottomNavigation from './BottomNavigation';


const HistoryPage = ({ onVideoSelect, onSecondPlayerSelect }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playlistMap, setPlaylistMap] = useState({}); // Maps video_id to array of playlist names
  const [folderMap, setFolderMap] = useState({}); // Maps video_id -> playlist_id -> [folder_colors]
  const [folderNameMap, setFolderNameMap] = useState({}); // Maps video_id -> playlist_id -> folder_color -> folder_name
  const [allPlaylists, setAllPlaylists] = useState([]); // All playlists for name-to-ID lookup
  const [filteredPlaylist, setFilteredPlaylist] = useState(null); // Currently filtered playlist name (null = show all)
  const { inspectMode } = useLayoutStore();
  const { currentPlaylistItems, currentVideoIndex } = usePlaylistStore();
  const { setCurrentPage } = useNavigationStore();
  const { setPlaylistItems } = usePlaylistStore();
  const pinnedVideos = usePinStore(state => state.pinnedVideos);
  const priorityPinIds = usePinStore(state => state.priorityPinIds);

  // Helper to get inspect label
  const getInspectTitle = (label) => inspectMode ? label : undefined;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load playlists and history in parallel
      const [playlists, historyData] = await Promise.all([
        getAllPlaylists(),
        getWatchHistory(100)
      ]);

      setAllPlaylists(playlists || []);
      setHistory(historyData || []);

      // Fetch playlists for all videos in history
      if (historyData && historyData.length > 0) {
        const videoIds = historyData
          .map(item => item.video_id)
          .filter(id => id); // Filter out any null/undefined video_ids

        if (videoIds.length > 0) {
          try {
            const playlistsData = await getPlaylistsForVideoIds(videoIds);
            setPlaylistMap(playlistsData || {});

            // Collect all unique playlists that contain history videos
            const playlistIdsSet = new Set();
            const playlistMapById = {};
            Object.entries(playlistsData || {}).forEach(([videoId, playlistNames]) => {
              playlistNames.forEach(playlistName => {
                const playlist = playlists.find(p => p.name === playlistName);
                if (playlist) {
                  playlistIdsSet.add(playlist.id);
                  playlistMapById[playlist.id] = playlist;
                }
              });
            });

            // Build video_id -> item_id map for each playlist (cache playlist items)
            const playlistItemsCache = {}; // playlistId -> items array
            const videoToItemMap = {}; // playlistId -> { videoId -> itemId }

            // Load all playlist items in parallel
            const playlistItemsPromises = Array.from(playlistIdsSet).map(async (playlistId) => {
              try {
                const items = await getPlaylistItems(playlistId);
                playlistItemsCache[playlistId] = items || [];

                // Build video_id -> item_id map for this playlist
                const videoMap = {};
                (items || []).forEach(item => {
                  if (item.video_id) {
                    videoMap[item.video_id] = item.id;
                  }
                });
                videoToItemMap[playlistId] = videoMap;
              } catch (error) {
                console.error(`Failed to load items for playlist ${playlistId}:`, error);
                playlistItemsCache[playlistId] = [];
                videoToItemMap[playlistId] = {};
              }
            });

            await Promise.all(playlistItemsPromises);

            // Load all folder assignments in parallel using batch API
            const folderAssignmentsPromises = Array.from(playlistIdsSet).map(async (playlistId) => {
              try {
                const allAssignments = await getAllFolderAssignments(playlistId);
                return { playlistId, assignments: allAssignments || {} };
              } catch (error) {
                console.error(`Failed to load folder assignments for playlist ${playlistId}:`, error);
                return { playlistId, assignments: {} };
              }
            });

            const folderAssignmentsResults = await Promise.all(folderAssignmentsPromises);

            // Build folder assignments map: videoId -> playlistId -> [folderColors]
            const folderAssignments = {};
            folderAssignmentsResults.forEach(({ playlistId, assignments }) => {
              // assignments is { itemId: [folderColors] }
              Object.entries(assignments).forEach(([itemIdStr, folderColors]) => {
                const itemId = parseInt(itemIdStr, 10);
                // Find which video_id this item_id belongs to
                const videoId = Object.keys(videoToItemMap[playlistId] || {}).find(
                  vid => videoToItemMap[playlistId][vid] === itemId
                );

                if (videoId) {
                  if (!folderAssignments[videoId]) {
                    folderAssignments[videoId] = {};
                  }
                  if (!folderAssignments[videoId][playlistId]) {
                    folderAssignments[videoId][playlistId] = [];
                  }
                  // Add folder colors (avoid duplicates)
                  const existingColors = new Set(folderAssignments[videoId][playlistId]);
                  (folderColors || []).forEach(color => existingColors.add(color));
                  folderAssignments[videoId][playlistId] = Array.from(existingColors);
                }
              });
            });

            setFolderMap(folderAssignments);

            // Collect all unique folder colors per playlist for metadata fetching
            const playlistFolderColors = {}; // playlistId -> Set of folderColors
            Object.entries(folderAssignments).forEach(([videoId, playlists]) => {
              Object.entries(playlists).forEach(([playlistIdStr, folderColors]) => {
                const playlistId = parseInt(playlistIdStr, 10);
                if (!playlistFolderColors[playlistId]) {
                  playlistFolderColors[playlistId] = new Set();
                }
                folderColors.forEach(color => playlistFolderColors[playlistId].add(color));
              });
            });

            // Load all folder metadata in parallel
            const folderMetadataPromises = [];
            Object.entries(playlistFolderColors).forEach(([playlistIdStr, folderColors]) => {
              const playlistId = parseInt(playlistIdStr, 10);
              Array.from(folderColors).forEach(folderColor => {
                folderMetadataPromises.push(
                  getFolderMetadata(playlistId, folderColor)
                    .then(metadata => ({ playlistId, folderColor, metadata }))
                    .catch(error => {
                      console.error(`Failed to load metadata for playlist ${playlistId}, folder ${folderColor}:`, error);
                      return { playlistId, folderColor, metadata: null };
                    })
                );
              });
            });

            const folderMetadataResults = await Promise.all(folderMetadataPromises);

            // Build folder names map: videoId -> playlistId -> folderColor -> folderName
            const folderNames = {};
            folderMetadataResults.forEach(({ playlistId, folderColor, metadata }) => {
              const folderName = metadata && metadata[0]
                ? metadata[0]
                : getFolderColorById(folderColor).name;

              // Find all videos in this playlist with this folder color
              Object.entries(folderAssignments).forEach(([videoId, playlists]) => {
                const folderColors = playlists[playlistId];
                if (folderColors && folderColors.includes(folderColor)) {
                  if (!folderNames[videoId]) {
                    folderNames[videoId] = {};
                  }
                  if (!folderNames[videoId][playlistId]) {
                    folderNames[videoId][playlistId] = {};
                  }
                  folderNames[videoId][playlistId][folderColor] = folderName;
                }
              });
            });

            setFolderNameMap(folderNames);
          } catch (error) {
            console.error('Failed to load playlists for history videos:', error);
            // Don't block the UI if playlist loading fails
          }
        }
      }
    } catch (error) {
      console.error('Failed to load history data:', error);
      alert(`Failed to load watch history: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistBadgeLeftClick = (e, playlistName) => {
    e.stopPropagation(); // Prevent triggering the card click
    e.preventDefault();

    // Toggle filter: if already filtered to this playlist, clear filter; otherwise, filter to this playlist
    if (filteredPlaylist === playlistName) {
      setFilteredPlaylist(null);
    } else {
      setFilteredPlaylist(playlistName);
    }
  };

  const handlePlaylistBadgeRightClick = async (e, playlistName) => {
    e.stopPropagation(); // Prevent triggering the card click
    e.preventDefault();

    // Find playlist by name
    const playlist = allPlaylists.find(p => p.name === playlistName);
    if (!playlist) {
      console.error(`Playlist "${playlistName}" not found`);
      return;
    }

    try {
      // Preview mode: Load playlist and navigate without changing the playing video
      // This allows users to browse the playlist while keeping the current video playing
      const items = await getPlaylistItems(playlist.id);
      setPlaylistItems(items, playlist.id, null, playlist.name);
      setCurrentPage('videos');
      // Note: We intentionally do NOT call onVideoSelect here to keep the current video playing
    } catch (error) {
      console.error('Failed to load playlist items:', error);
    }
  };

  const handleFolderBadgeClick = async (e, playlistName, folderColor) => {
    e.stopPropagation(); // Prevent triggering the card click

    // Find playlist by name
    const playlist = allPlaylists.find(p => p.name === playlistName);
    if (!playlist || !folderColor) {
      console.error(`Playlist "${playlistName}" or folder not found`);
      return;
    }

    try {
      // Preview mode: Load folder videos and navigate without changing the playing video
      const items = await getVideosInFolder(playlist.id, folderColor);
      if (items.length === 0) {
        console.warn(`Folder ${folderColor} in playlist ${playlist.id} has no videos`);
        return;
      }
      setPlaylistItems(items, playlist.id, { playlist_id: playlist.id, folder_color: folderColor });
      setCurrentPage('videos');
      // Note: We intentionally do NOT call onVideoSelect here to keep the current video playing
    } catch (error) {
      console.error('Failed to load folder items:', error);
    }
  };

  const handleVideoClick = (video) => {
    if (onVideoSelect) {
      onVideoSelect(video.video_url);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

      // For older dates, show actual date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    } catch {
      return dateString;
    }
  };

  // Extract unique playlists from all history videos (must be before conditional returns)
  const uniquePlaylists = useMemo(() => {
    const playlistSet = new Set();
    Object.values(playlistMap).forEach(playlistNames => {
      playlistNames.forEach(name => playlistSet.add(name));
    });
    return Array.from(playlistSet).sort();
  }, [playlistMap]);

  // Filter history based on selected playlist
  const filteredHistory = useMemo(() => {
    if (!filteredPlaylist) {
      return history;
    }
    return history.filter(item => {
      const playlists = playlistMap[item.video_id] || [];
      return playlists.includes(filteredPlaylist);
    });
  }, [history, playlistMap, filteredPlaylist]);

  const {
    fullscreenBanner,
    bannerPreviewMode,
    bannerNavBannerId,
    bannerPresets,
  } = useConfigStore();

  let effectiveBanner = fullscreenBanner;
  if (bannerNavBannerId && !bannerPreviewMode && bannerPresets?.length) {
    const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
    if (preset?.fullscreenBanner) effectiveBanner = preset.fullscreenBanner;
  }
  const bannerImage = effectiveBanner?.image || '/banner.PNG';
  const bannerScale = effectiveBanner?.scale ?? 100;
  const bannerVertical = effectiveBanner?.verticalPosition ?? 0;
  const bannerHorizontal = effectiveBanner?.horizontalOffset ?? 0;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center w-full h-full p-12">
          <p className="text-slate-400">Loading history...</p>
        </div>
      );
    }

    if (history.length === 0) {
      return (
        <div className="flex items-center justify-center w-full h-full p-12">
          <p className="text-slate-400">No watch history yet</p>
        </div>
      );
    }

    if (filteredHistory.length === 0 && filteredPlaylist) {
      return (
        <div className="text-center text-slate-400 py-12">
          No videos from "{filteredPlaylist}" in watch history.
        </div>
      );
    }

    return (
      <div className="px-3 py-1">
        <div className="flex flex-col space-y-3 w-full">
          {filteredHistory.map((item) => {
              const thumbnailUrl = item.thumbnail_url || getThumbnailUrl(item.video_id, 'medium');

              // Check if this video is currently playing
              const currentVideo = currentPlaylistItems?.[currentVideoIndex];
              const isCurrentlyPlaying = currentVideo && (
                currentVideo.video_id === item.video_id ||
                currentVideo.id === item.id ||
                (currentVideo.video_url && extractVideoId(currentVideo.video_url) === item.video_id) ||
                (item.video_url && extractVideoId(item.video_url) === extractVideoId(currentVideo.video_url))
              );

              // Check if this video is pinned or priority pinned by video_id
              const pinnedVideo = pinnedVideos.find(v => v.video_id === item.video_id);
              const isPinnedVideo = pinnedVideo && !priorityPinIds.includes(pinnedVideo.id);
              const isPriorityPinnedVideo = pinnedVideo && priorityPinIds.includes(pinnedVideo.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleVideoClick(item)}
                  className={`flex flex-row gap-5 p-3.5 bg-slate-100 hover:bg-slate-200/95 rounded-2xl transition-all cursor-pointer group w-full border-2 shadow-md ${isCurrentlyPlaying
                    ? 'border-red-500 ring-4 ring-red-500 ring-offset-2 ring-offset-slate-900 shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]'
                    : 'border-[#052F4A]'
                    }`}
                  title={getInspectTitle(`History video: ${item.title || 'Untitled'}`)}
                >
                  {/* Left: Thumbnail */}
                  <div className={`w-64 shrink-0 aspect-video rounded-xl overflow-hidden border-2 border-[#052F4A] relative shadow-md group-hover:shadow-xl transition-all ${isCurrentlyPlaying ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-black shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]' : ''
                    }`}>
                    <CardThumbnail
                      src={thumbnailUrl}
                      alt={item.title || 'Video thumbnail'}
                    />
                  </div>

                  {/* Right: Info */}
                  <div className="flex flex-col justify-center flex-1 min-w-0 py-2">
                    <div className="relative">
                      {/* Pin Marker - To the right of title, slightly above */}
                      {(isPinnedVideo || isPriorityPinnedVideo) && (
                        <div className="absolute -top-1 right-0 z-10">
                          <div className={`p-1.5 rounded-lg backdrop-blur-md shadow-lg border ${isPriorityPinnedVideo
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                            : 'bg-sky-500/20 border-sky-500/50 text-sky-500'
                            }`}>
                            <Pin
                              size={16}
                              fill={isPriorityPinnedVideo || isPinnedVideo ? "currentColor" : "none"}
                              strokeWidth={2}
                            />
                          </div>
                        </div>
                      )}
                      <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-tight transition-colors pr-8"
                        style={{ color: '#052F4A' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#052F4A'}>
                        {item.title || 'Untitled Video'}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      {/* Time badge - watched at */}
                      <div className="text-lg font-bold leading-tight transition-colors"
                        style={{ color: '#052F4A' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#052F4A'}>
                        {formatDate(item.watched_at)}
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

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-950">
      {/* Blurred App Banner Background Layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bannerImage})`,
            backgroundPosition: `${bannerHorizontal}% ${bannerVertical}%`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: `${bannerScale}vw auto`,
            filter: 'blur(36px)',
            transform: 'scale(1.25)',
            opacity: 0.85,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto relative">
          <BottomNavigation />
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;

