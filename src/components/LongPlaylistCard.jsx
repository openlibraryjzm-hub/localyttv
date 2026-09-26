import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Shuffle,
  Grid3x3,
  RotateCcw,
  Info,
  Check,
  X,
  Folder,
  Eye,
  EyeOff,
  MoreVertical,
  ExternalLink,
  PieChart,
  Image,
  RefreshCw,
  Download,
  Trash2,
  Plus,
  Upload,
} from "lucide-react";
import CardMenu from "./NewCardMenu";
import ImageHoverPreview from "./ImageHoverPreview";
import useLongPress from "../hooks/useLongPress";
import { getFolderColorById } from "../utils/folderColors";
import { getThumbnailUrl, extractVideoId, fetchVideoMetadata } from "../utils/youtubeUtils";
import {
  getPlaylistItems,
  getPlaylistItemsPreview,
  getVideosInFolder,
  updatePlaylist,
  reorderPlaylistItem,
  addVideoToPlaylist,
  getWatchedVideoIds,
  getAllVideoProgress,
} from "../api/playlistApi";
import { usePlaylistStore } from "../store/playlistStore";
import { useLayoutStore } from "../store/layoutStore";
import { useNavigationStore } from "../store/navigationStore";
import { usePlaylistGroupStore } from "../store/playlistGroupStore";
import { useConfigStore } from "../store/configStore";
import { useShuffleStore } from "../store/shuffleStore";

const MiniPreviewItem = ({
  item,
  index,
  slotKey,
  thumbSrc,
  showImg,
  isVideo,
  isTweet,
  isCover = false,
  onVideoSelect,
  handleMiniVideoRightClick,
  setMiniImageErrors,
  getPreviewItemTitle
}) => {
  const longPress = useLongPress(
    (e) => handleMiniVideoRightClick(e, item, index),
    (e) => {
      e.stopPropagation();
      if (isVideo && item.video_url && onVideoSelect) onVideoSelect(item.video_url);
    }
  );

  const isOrb = item?.isOrb;

  return (
    <div
      key={slotKey}
      className={`relative aspect-square overflow-hidden transition-all cursor-pointer group/mini shadow-sm border ${
        isCover ? "ring-2 ring-sky-400 border-sky-400" : ""
      } ${
        isOrb 
          ? "rounded-full border-amber-500/30 bg-amber-900/20 hover:border-amber-400 hover:ring-4 hover:ring-amber-500/20" 
          : "rounded-xl border-[#052F4A]/30 bg-slate-900/40 hover:border-sky-500/50 hover:ring-4 hover:ring-sky-500/20"
      }`}
      {...longPress}
      onContextMenu={(e) => handleMiniVideoRightClick(e, item, index)}
      title={getPreviewItemTitle(item)}
    >
      {isOrb ? (
        /* Orb Rendering: Centered Circle */
        <div className="w-full h-full flex items-center justify-center">
            {showImg ? (
                <img
                    src={thumbSrc}
                    alt=""
                    className="w-full h-full object-cover rounded-full transition-all duration-500 group-hover/mini:scale-110"
                    onError={() => setMiniImageErrors((prev) => new Set(prev).add(slotKey))}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center rounded-full bg-amber-900/40 text-amber-200 border-2 border-amber-500/30">
                    <span className="text-[8px] font-bold uppercase tracking-wider">Orb</span>
                </div>
            )}
            {/* Gloss Effect for Orbs */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none rounded-full" />
        </div>
      ) : (
        /* Video Rendering: Mini-Card Style */
        <div className="w-full h-full bg-white flex flex-col">
            {/* Thumbnail: Aspect Video on Top */}
            <div className="relative aspect-video w-full overflow-hidden flex-shrink-0 bg-slate-900">
                {showImg ? (
                    <img
                        src={thumbSrc}
                        alt=""
                        className="w-full h-full object-cover transition-all duration-500 group-hover/mini:scale-105"
                        onError={() => setMiniImageErrors((prev) => new Set(prev).add(slotKey))}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800/40">
                         <span className="text-[10px] font-bold uppercase">{item.isBannerPreset ? "Banner" : "Video"}</span>
                    </div>
                )}
            </div>

            {/* Title Area: White space at bottom */}
            <div className="flex-1 p-1.5 flex flex-col justify-center min-h-0">
                <h4 className="text-[9px] leading-[1.1] font-bold text-[#052F4A] line-clamp-2 break-words" title={getPreviewItemTitle(item)}>
                    {getPreviewItemTitle(item)}
                </h4>
            </div>
        </div>
      )}

      {isVideo && showImg && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/mini:opacity-100 bg-black/20 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-sky-500/80 flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Play size={14} className="text-white fill-current translate-x-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};

const LongPlaylistCard = ({
  playlist,
  folders = [],
  activeThumbnailUrl,
  itemCount,
  videoCount = itemCount,
  orbCount = 0,
  bannerCount = 0,
  initialPreviewVideos = [],
  globalInfoToggle,
  folderMetadata = {},
  deletingPlaylistId,
  expandedPlaylists,
  onVideoSelect,
  togglePlaylistExpand,
  handleExportPlaylist,
  handleDeletePlaylist,
  loadPlaylists,
  onAssignToGroupClick,
  onEnterFromGroup,
  onFolderModeToggle,
}) => {
  const { currentPlaylistId, setPlaylistItems, setPreviewPlaylist } = usePlaylistStore();
  const { viewMode, setViewMode, setFullscreenInfoBlanked } = useLayoutStore();
  const { setCurrentPage } = useNavigationStore();
  const { getGroupIdsForPlaylist, removePlaylistFromGroup } = usePlaylistGroupStore();
  const { hiddenPlaylists, hidePlaylist, unhidePlaylist, quickAssignSlots, setQuickAssignSlot, playlistVideoFilters } = useConfigStore();
  
  const groupIdsForPlaylist = getGroupIdsForPlaylist(playlist.id);
  const isInAnyCarousel = groupIdsForPlaylist.length > 0;
  const isHidden = (hiddenPlaylists || []).includes(playlist.id);

  const [previewThumbnail, setPreviewThumbnail] = useState(null);
  const [localPreviewVideos, setLocalPreviewVideos] = useState(initialPreviewVideos);
  const [activeFolderFilter, setActiveFolderFilter] = useState(null);
  const [miniImageErrors, setMiniImageErrors] = useState(new Set());
  const [imageError, setImageError] = useState(false);

  const { shuffleStates } = useShuffleStore();

  const [shufflePage, setShufflePage] = useState(1);
  const [totalPlaylistPages, setTotalPlaylistPages] = useState(1);

  const getSortedPool = async () => {
    try {
      const orbsAndBanners = (initialPreviewVideos || []).filter(item => item.isOrb || item.isBannerPreset);
      const dbVideos = await getPlaylistItems(playlist.id);
      let pool = [...orbsAndBanners, ...dbVideos];

      const currentFilters = playlistVideoFilters?.[playlist.id] || { sortBy: 'shuffle', sortDirection: 'desc', selectedRatings: [] };
      const sortBy = currentFilters.sortBy || 'shuffle';
      const sortDirection = currentFilters.sortDirection || 'desc';
      const selectedRatings = currentFilters.selectedRatings || [];

      // Filter by rating
      if (selectedRatings.length > 0) {
        const ratingSet = new Set(selectedRatings);
        pool = pool.filter(v => {
          if (v.isOrb || v.isBannerPreset) return true;
          const r = v.drumstick_rating ?? 0;
          return ratingSet.has(r);
        });
      }

      // Sort pool
      if (sortBy === 'chronological') {
        pool.sort((a, b) => {
          const dateA = new Date(a.published_at || a.added_at || 0).getTime();
          const dateB = new Date(b.published_at || b.added_at || 0).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        });
      } else if (sortBy === 'addedToApp') {
        pool.sort((a, b) => {
          const dateA = new Date(a.added_at || 0).getTime();
          const dateB = new Date(b.added_at || 0).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        });
      } else if (sortBy === 'shuffle') {
        const state = shuffleStates[playlist.id];
        const getStableRank = (id) => {
          if (state?.map && state.map[id] !== undefined) return state.map[id];
          let hash = 0;
          const str = String(id);
          for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
          }
          return (hash + 2147483648) / 4294967296;
        };
        pool.sort((a, b) => getStableRank(a.id) - getStableRank(b.id));
      } else if (sortBy === 'progress' || sortBy === 'lastViewed' || sortBy === 'watchCount') {
        try {
          const allProgress = await getAllVideoProgress();
          const progressMap = new Map();
          for (const progress of allProgress) {
            progressMap.set(progress.video_id, {
              percentage: progress.progress_percentage,
              hasFullyWatched: progress.has_fully_watched,
              last_updated: progress.last_updated,
              watchCount: progress.watch_count || 0
            });
          }

          if (sortBy === 'progress') {
            pool.sort((a, b) => {
              const idA = extractVideoId(a.video_url) || a.video_id || a.id;
              const idB = extractVideoId(b.video_url) || b.video_id || b.id;
              const dataA = progressMap.get(idA);
              const dataB = progressMap.get(idB);
              const progressA = dataA ? dataA.percentage : 0;
              const progressB = dataB ? dataB.percentage : 0;

              if (progressA === progressB) {
                const dateA = new Date(a.published_at || a.added_at || 0).getTime();
                const dateB = new Date(b.published_at || b.added_at || 0).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
              }
              return sortDirection === 'asc' ? progressA - progressB : progressB - progressA;
            });
          } else if (sortBy === 'watchCount') {
            pool.sort((a, b) => {
              const idA = extractVideoId(a.video_url) || a.video_id || a.id;
              const idB = extractVideoId(b.video_url) || b.video_id || b.id;
              const dataA = progressMap.get(idA);
              const dataB = progressMap.get(idB);
              const watchCountA = dataA ? dataA.watchCount : 0;
              const watchCountB = dataB ? dataB.watchCount : 0;

              if (watchCountA === watchCountB) {
                const dateA = new Date(a.published_at || a.added_at || 0).getTime();
                const dateB = new Date(b.published_at || b.added_at || 0).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
              }
              return sortDirection === 'asc' ? watchCountA - watchCountB : watchCountB - watchCountA;
            });
          } else if (sortBy === 'lastViewed') {
            pool.sort((a, b) => {
              const idA = extractVideoId(a.video_url) || a.video_id || a.id;
              const idB = extractVideoId(b.video_url) || b.video_id || b.id;
              const dataA = progressMap.get(idA);
              const dataB = progressMap.get(idB);
              const lastUpdatedA = dataA?.last_updated ? new Date(dataA.last_updated).getTime() : 0;
              const lastUpdatedB = dataB?.last_updated ? new Date(dataB.last_updated).getTime() : 0;

              if (lastUpdatedA === lastUpdatedB) {
                const dateA = new Date(a.published_at || a.added_at || 0).getTime();
                const dateB = new Date(b.published_at || b.added_at || 0).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
              }
              return sortDirection === 'asc' ? lastUpdatedA - lastUpdatedB : lastUpdatedB - lastUpdatedA;
            });
          }
        } catch (err) {
          console.error("Failed to sort by progress/lastViewed in LongPlaylistCard:", err);
        }
      }

      return pool;
    } catch (error) {
      console.error("Failed to get sorted pool:", error);
      return [];
    }
  };

  useEffect(() => {
    let active = true;
    const calculateTotalPages = async () => {
      const pool = await getSortedPool();
      if (active) {
        setTotalPlaylistPages(Math.max(1, Math.ceil(pool.length / 8)));
      }
    };
    calculateTotalPages();
    return () => {
      active = false;
    };
  }, [playlist.id, initialPreviewVideos, playlistVideoFilters]);

  useEffect(() => {
    if (shufflePage > totalPlaylistPages) {
      setShufflePage(totalPlaylistPages);
    }
  }, [totalPlaylistPages, shufflePage]);

  const changeShufflePage = async (newPage) => {
    setShufflePage(newPage);
    if (previewThumbnail?.isShuffled) {
      try {
        const pool = await getSortedPool();
        if (pool.length === 0) return;
        
        const startIndex = (newPage - 1) * 8;
        const endIndex = startIndex + 8;
        const pagePool = pool.slice(startIndex, endIndex);
        if (pagePool.length === 0) return;

        const randomItem = pagePool[Math.floor(Math.random() * pagePool.length)];
        setPreviewThumbnail(previewThumbnailFromItem(randomItem));
        const shuffled = [...pagePool].sort(() => 0.5 - Math.random());
        setLocalPreviewVideos(shuffled.slice(0, 8));
      } catch (error) {
        console.error("Failed to auto-shuffle on page change:", error);
      }
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredPieSegment, setHoveredPieSegment] = useState(null);

  const pieChartRef = useRef(null);
  const pieDataRef = useRef({ folders, hoveredSegment: hoveredPieSegment });

  useEffect(() => {
    pieDataRef.current = { folders, hoveredSegment: hoveredPieSegment };
  }, [folders, hoveredPieSegment]);

  useEffect(() => {
    if (!previewThumbnail?.isShuffled) {
      setLocalPreviewVideos(initialPreviewVideos);
    }
  }, [initialPreviewVideos, previewThumbnail?.isShuffled]);

  // Handle Global Info Toggle (copied logic)
  useEffect(() => {
    const fetchTitle = async () => {
      if (globalInfoToggle && !previewThumbnail?.title) {
        try {
          const items = await getPlaylistItems(playlist.id);
          if (items.length > 0) {
            let targetVideo = items[0];
            if (activeThumbnailUrl) {
              const coverMatch = items.find((item) => {
                const maxThumb = item.thumbnail_url?.replace(/name=[a-z]+/, "name=large") || getThumbnailUrl(item.video_id, "max");
                const stdThumb = item.thumbnail_url?.replace(/name=[a-z]+/, "name=medium") || getThumbnailUrl(item.video_id, "standard");
                return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
              });
              if (coverMatch) targetVideo = coverMatch;
            }
            setPreviewThumbnail((prev) => ({
              ...prev,
              title: targetVideo.title,
              videoId: targetVideo.video_id,
              videoUrl: targetVideo.video_url,
              url: prev?.url || activeThumbnailUrl,
              isShuffled: prev?.isShuffled || false,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch title for global toggle", error);
        }
      }
    };
    fetchTitle();
  }, [globalInfoToggle, playlist.id, previewThumbnail?.title, activeThumbnailUrl]);

  const displayedThumbnailUrl = previewThumbnail?.url || activeThumbnailUrl;

  const getPreviewItemThumbnail = (item) => {
    if (!item) return null;
    if (item.isOrb) return item.customOrbImage ?? item.image ?? null;
    if (item.isBannerPreset) return item.splitscreenBanner?.image || item.customBannerImage || item.fullscreenBanner?.image || item.image || null;
    return item.thumbnail_url?.replace(/name=[a-z]+/, "name=medium") || getThumbnailUrl(item.video_id, "medium");
  };
  const getPreviewItemTitle = (item) => item?.title ?? "";
  const getPreviewItemKey = (item, index) => item?.id ?? item?.video_id ?? `preview-${index}`;

  const previewThumbnailFromItem = (item) => {
    if (!item) return null;
    const url = item.isOrb
      ? (item.customOrbImage ?? null)
      : item.isBannerPreset
        ? (item.splitscreenBanner?.image || item.customBannerImage || item.fullscreenBanner?.image || item.image || null)
        : (item.thumbnail_url?.replace(/name=[a-z]+/, "name=large") || getThumbnailUrl(item.video_id, "max"));
    return {
      url: url || null,
      title: getPreviewItemTitle(item),
      videoId: item.video_id ?? null,
      videoUrl: item.video_url ?? null,
      isShuffled: true,
      originalItem: item,
    };
  };

  const handleCardClick = async (e) => {
    if (e.target.closest('[data-card-action="true"]')) return;
    if (typeof onEnterFromGroup === "function") onEnterFromGroup(null);
    
    try {
      const items = await getPlaylistItems(playlist.id);
      setPlaylistItems(items, playlist.id, null, playlist.name);

      if (items.length > 0 && onVideoSelect) {
        if (previewThumbnail?.videoUrl) {
          onVideoSelect(previewThumbnail.videoUrl);
        } else {
          let targetVideo = items[0];
          if (activeThumbnailUrl) {
            const coverMatch = items.find((item) => {
              const maxThumb = item.thumbnail_url?.replace(/name=[a-z]+/, "name=large") || getThumbnailUrl(item.video_id, "max");
              const stdThumb = item.thumbnail_url?.replace(/name=[a-z]+/, "name=medium") || getThumbnailUrl(item.video_id, "standard");
              return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
            });
            if (coverMatch) targetVideo = coverMatch;
          }
          onVideoSelect(targetVideo.video_url);
        }
      }
    } catch (error) {
      console.error("Failed to load playlist items:", error);
    }
  };

  const handleQuickAdd = async (playImmediately = false, e) => {
    e?.stopPropagation?.();
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        console.warn("Clipboard is empty");
        return;
      }
      const videoId = extractVideoId(text);
      if (!videoId) {
        console.warn("Clipboard does not contain a valid YouTube video URL");
        return;
      }

      const tempTitle = `Added Video ${videoId}`;
      const fallbackThumbnailUrl = getThumbnailUrl(videoId, 'hqdefault');
      let finalTitle = tempTitle;
      let authorName = 'Unknown';
      let viewCountStr = '0';
      let pubAt = null;
      let finalThumbnailUrl = fallbackThumbnailUrl;
      let durSecs = null;
      let desc = null;
      let tagsStr = null;
      const meta = await fetchVideoMetadata(videoId);
      if (meta) {
        finalTitle = meta.title || finalTitle;
        authorName = meta.author || authorName;
        viewCountStr = meta.viewCount || viewCountStr;
        pubAt = meta.publishedAt || pubAt;
        finalThumbnailUrl = meta.thumbnailUrl || finalThumbnailUrl;
        durSecs = meta.durationSeconds || null;
        desc = meta.description || null;
        tagsStr = meta.tags || null;
      }

      await addVideoToPlaylist(playlist.id, text, videoId, finalTitle, finalThumbnailUrl, authorName, viewCountStr, pubAt, false, null, durSecs, desc, tagsStr);
      console.log(`Added ${finalTitle} to playlist ${playlist.name}`);

      const items = await getPlaylistItems(playlist.id);
      if (currentPlaylistId === playlist.id) {
        setPlaylistItems(items, playlist.id);
      }
      loadPlaylists?.();

      if (playImmediately) {
        const newVideo = items.find(v => v.video_id === videoId) || items[items.length - 1];
        if (newVideo && onVideoSelect) {
          onVideoSelect(newVideo.video_url);
        }
      }
    } catch (err) {
      console.error('Failed to quick add clipboard to playlist:', err);
    }
  };

  const handlePreviewPlaylist = async (e) => {
    e.stopPropagation();
    try {
      const items = await getPlaylistItems(playlist.id);
      setPreviewPlaylist(items, playlist.id, null);
      if (viewMode === "full") {
        setFullscreenInfoBlanked(true);
        requestAnimationFrame(() => {
          setCurrentPage("videos");
          setViewMode("half");
        });
      } else {
        setCurrentPage("videos");
      }
    } catch (error) {
      console.error("Failed to load playlist items for preview:", error);
    }
  };

  const handleShuffle = async (e) => {
    e.stopPropagation();
    try {
      const pool = await getSortedPool();
      if (pool.length === 0) return;
      
      const startIndex = (shufflePage - 1) * 8;
      const endIndex = startIndex + 8;
      const pagePool = pool.slice(startIndex, endIndex);
      if (pagePool.length === 0) return;

      const randomItem = pagePool[Math.floor(Math.random() * pagePool.length)];
      setPreviewThumbnail(previewThumbnailFromItem(randomItem));
      const shuffled = [...pagePool].sort(() => 0.5 - Math.random());
      setLocalPreviewVideos(shuffled.slice(0, 8));
    } catch (error) {
      console.error("Failed to shuffle thumbnail:", error);
    }
  };

  const handleResetShuffle = async (e) => {
    e.stopPropagation();
    setPreviewThumbnail(null);
    setLocalPreviewVideos(initialPreviewVideos.slice(0, 8));
  };

  const handleSetAsCover = async (e) => {
    e.stopPropagation();
    try {
      if (displayedThumbnailUrl) {
        await updatePlaylist(playlist.id, null, null, null, displayedThumbnailUrl);
        if (localPreviewVideos && previewThumbnail?.isShuffled) {
          let videoPosition = 1;
          for (const item of localPreviewVideos) {
            if (!item.isOrb && !item.isBannerPreset && item.id != null) {
              await reorderPlaylistItem(playlist.id, item.id, videoPosition);
              videoPosition++;
            }
          }
        }
        await loadPlaylists?.();
        if (previewThumbnail?.isShuffled) setPreviewThumbnail(null);
      }
    } catch (error) {
      console.error("Failed to set playlist cover:", error);
    }
  };

  const handleMiniVideoRightClick = async (e, clickedItem, index) => {
    e.preventDefault();
    e.stopPropagation();
    const currentMainItem = previewThumbnail?.originalItem || {
      video_id: previewThumbnail?.videoId,
      video_url: previewThumbnail?.videoUrl,
      title: previewThumbnail?.title,
      thumbnail_url: previewThumbnail?.url,
    } || localPreviewVideos[0];

    if (currentMainItem) {
      setPreviewThumbnail(previewThumbnailFromItem(clickedItem));
      setLocalPreviewVideos((prev) => {
        const next = [...prev];
        next[index] = currentMainItem;
        return next;
      });
    }
  };

  const togglePieMenu = (e) => {
    e.stopPropagation();
    if (isMenuOpen) {
      setIsMenuOpen(false);
    } else {
      if (folders.length > 0) {
        setHoveredPieSegment(folders[0].folder_color);
      }
      setIsMenuOpen(true);
    }
  };

  const totalVideosInFolders = folders.reduce((acc, f) => acc + (f.video_count || 1), 0);
  let cumulativeAngle = 0;
  const pieSegments = folders.map((folder) => {
    const folderColorData = getFolderColorById(folder.folder_color);
    const folderMetaKey = `${folder.playlist_id}:${folder.folder_color}`;
    const customName = folderMetadata[folderMetaKey]?.name;
    const displayName = customName || folderColorData.name;
    const videoCount = folder.video_count || 1;
    const angle = (videoCount / totalVideosInFolders) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    return {
      folder,
      folderColorData,
      displayName,
      videoCount,
      startAngle,
      endAngle: cumulativeAngle,
      angle,
      percentage: (videoCount / totalVideosInFolders) * 100,
    };
  });

  const hoveredSegmentData = pieSegments.find(
    (s) => s.folder.folder_color === hoveredPieSegment,
  );

  const isExpanded = expandedPlaylists?.has(playlist.id);
  const activeFolderCount = folders.filter((f) => (f.video_count || 0) > 0).length;

  return (
    <div
      onClick={handleCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleExportPlaylist?.(playlist.id, playlist.name);
      }}
      className="group relative w-full bg-transparent border-0 shadow-none cursor-pointer p-1"
      data-active-playlist={String(playlist.id) === String(currentPlaylistId) ? "true" : "false"}
    >
        {/* Background Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Top Header: Info Metrics, Centered Title & Action Controls */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-2.5 relative z-10 bg-slate-100 border-2 border-[#052F4A] rounded-xl shadow-md">
            {/* Info Bar (Metrics) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/50 border border-[#052F4A]/10 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1 text-[#052F4A]/70">
                        <Play size={12} className="text-sky-600" fill="currentColor" />
                        <span className="text-xs font-bold">{videoCount}</span>
                    </div>
                    {orbCount > 0 && (
                        <div className="flex items-center gap-1 text-[#052F4A]/70">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-xs font-bold">{orbCount}</span>
                        </div>
                    )}
                    {bannerCount > 0 && (
                        <div className="flex items-center gap-1 text-[#052F4A]/70">
                            <Image size={12} className="text-indigo-500" />
                            <span className="text-xs font-bold">{bannerCount}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Centered Playlist Title */}
            <h3 className="text-xl font-black text-[#052F4A] truncate leading-tight group-hover:text-sky-600 transition-colors text-center flex-1 mx-2" title={playlist.name}>
                {playlist.name}
            </h3>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Grid Preview */}
                <button
                    data-card-action="true"
                    onClick={handlePreviewPlaylist}
                    className="w-9 h-9 rounded-xl bg-white border border-[#052F4A]/10 flex items-center justify-center text-[#052F4A] hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm active:scale-95"
                    title="Preview Grid"
                >
                    <Grid3x3 size={16} />
                </button>

                {/* Folder Distribution */}
                <button
                    data-card-action="true"
                    onClick={(e) => { e.stopPropagation(); onFolderModeToggle?.(playlist.id); }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm border border-[#052F4A]/10"
                    style={{ 
                        backgroundColor: activeFolderCount > 0 ? '#052F4A' : '#f1f5f9',
                        color: activeFolderCount > 0 ? 'white' : '#64748b'
                    }}
                    title="Folder Distribution Mode"
                >
                    <Folder size={16} fill={activeFolderCount > 0 ? "currentColor" : "none"} />
                </button>

                {/* Flash Add Menu */}
                <div data-card-action="true">
                    <CardMenu
                        customButton={
                            <button
                                type="button"
                                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-600 text-white flex items-center justify-center hover:from-sky-600 hover:to-sky-700 transition-all shadow-md hover:shadow-sky-500/25 active:scale-95 border border-sky-400/30"
                                title="Add Options"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        }
                        options={[
                            { label: "Open in Playlist Uploader", action: "openUploader", icon: <Upload size={16} className="text-sky-400" /> },
                            {
                                render: (closeMenu) => (
                                    <div className="flex items-center w-full">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleQuickAdd(false);
                                                closeMenu();
                                            }}
                                            className="flex-1 text-left px-4 py-2.5 text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-3 rounded-l-md"
                                            title="Add clipboard to playlist in background"
                                        >
                                            <Plus size={16} className="text-emerald-400 flex-shrink-0" />
                                            <span className="truncate">Quick Add</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleQuickAdd(true);
                                                closeMenu();
                                            }}
                                            className="px-4 py-2.5 hover:bg-slate-700 transition-colors flex items-center justify-center border-l border-slate-700 text-emerald-400 hover:text-emerald-300 rounded-r-md"
                                            title="Add and Play immediately"
                                        >
                                            <Play size={14} className="fill-current flex-shrink-0" />
                                        </button>
                                    </div>
                                )
                            },
                            {
                                label: "Assign to Quick Slot...",
                                submenu: "quickAssign",
                                icon: <Grid3x3 size={16} className="text-amber-400" />
                            }
                        ]}
                        submenuOptions={{
                            quickAssign: [0, 1, 2, 3].map(i => ({
                                label: `Slot ${i + 1}: ${quickAssignSlots?.[i]?.name || 'Empty'}`,
                                action: `assignSlot${i}`,
                                icon: <Plus size={14} className={quickAssignSlots?.[i]?.id === playlist.id ? "text-emerald-400" : "text-slate-400"} />
                            }))
                        }}
                        onOptionClick={(opt) => {
                            if (opt.action === "openUploader") handleExportPlaylist?.(playlist.id, playlist.name);
                            else if (opt.action?.startsWith("assignSlot")) {
                                const slotIdx = parseInt(opt.action.replace("assignSlot", ""), 10);
                                setQuickAssignSlot(slotIdx, playlist.id, playlist.name);
                                console.log(`Assigned Slot ${slotIdx + 1} to playlist: ${playlist.name}`);
                            }
                        }}
                    />
                </div>
                
                {/* Shuffle */}
                <button
                    data-card-action="true"
                    onClick={handleShuffle}
                    className="w-9 h-9 rounded-xl bg-[#052F4A] text-white flex items-center justify-center hover:bg-[#074066] transition-all shadow-md active:scale-95"
                    title="Shuffle Playlist"
                >
                    <Shuffle size={16} />
                </button>

                {/* Shuffle Page Selector */}
                <button
                    type="button"
                    data-card-action="true"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (totalPlaylistPages <= 1) return;
                        const next = (shufflePage % totalPlaylistPages) + 1;
                        changeShufflePage(next);
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (totalPlaylistPages <= 1) return;
                        const prev = (shufflePage - 2 + totalPlaylistPages) % totalPlaylistPages + 1;
                        changeShufflePage(prev);
                    }}
                    className="w-9 h-9 rounded-xl bg-white border border-[#052F4A]/10 flex items-center justify-center text-[#052F4A] hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 font-bold text-xs transition-all shadow-sm active:scale-95 select-none"
                    title={`Shuffle Page Filter (1-${totalPlaylistPages}) - Left-Click: +1, Right-Click: -1`}
                >
                    {shufflePage}
                </button>

                {/* Conditional Actions */}
                {previewThumbnail?.isShuffled && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                        <button
                            data-card-action="true"
                            onClick={handleResetShuffle}
                            className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-all shadow-md active:scale-95"
                            title="Reset Preview"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            data-card-action="true"
                            onClick={handleSetAsCover}
                            className="w-9 h-9 rounded-xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-md active:scale-95"
                            title="Set as Playlist Cover"
                        >
                            <Check size={18} strokeWidth={3} />
                        </button>
                    </div>
                )}

                {/* Management Menu */}
                <div data-card-action="true">
                    <CardMenu
                        customButton={
                            <button className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#052F4A] transition-all flex items-center justify-center shadow-sm">
                                <MoreVertical size={18} strokeWidth={2.5} />
                            </button>
                        }
                        options={[
                            { label: "Open in Playlist Uploader", action: "openUploader", icon: <Upload size={16} className="text-sky-400" /> },
                            { label: isExpanded ? "Collapse Folders" : "Expand Folders", action: "toggleFolders", icon: <Folder size={16} /> },
                            { label: "Export Playlist", action: "export", icon: <ExternalLink size={16} /> },
                            { label: "Assign to group", action: "openAssignToGroup", icon: <Grid3x3 size={16} className="text-sky-500" /> },
                            ...(isInAnyCarousel ? [{ label: "Remove from carousel(s)", action: "removeFromCarousel", icon: <X size={16} className="text-red-500" />, danger: true }] : []),
                            { label: isHidden ? "Unhide" : "Hide", action: isHidden ? "unhide" : "hide", icon: isHidden ? <Eye size={16} /> : <EyeOff size={16} /> },
                            { label: "Delete", action: "delete", danger: true, icon: <X size={16} /> }
                        ]}
                        onOptionClick={(opt) => {
                            if (opt.action === "openUploader") handleExportPlaylist?.(playlist.id, playlist.name);
                            else if (opt.action === "toggleFolders") togglePlaylistExpand?.(playlist.id);
                            else if (opt.action === "export") handleExportPlaylist?.(playlist.id, playlist.name);
                            else if (opt.action === "delete") handleDeletePlaylist?.(playlist.id, playlist.name, { stopPropagation: () => { } });
                            else if (opt.action === "openAssignToGroup") onAssignToGroupClick?.();
                            else if (opt.action === "removeFromCarousel") groupIdsForPlaylist.forEach(gid => removePlaylistFromGroup(gid, playlist.id));
                            else if (opt.action === "hide") hidePlaylist?.(playlist.id);
                            else if (opt.action === "unhide") unhidePlaylist?.(playlist.id);
                        }}
                    />
                </div>
            </div>
        </div>

        <div className="p-3 relative z-10">
            {isMenuOpen ? (
                <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 shadow-2xl animate-in zoom-in-95 duration-200 h-full flex items-center" data-card-action="true">
                    <div className="flex items-center gap-4 w-full">
                        <div className="relative w-28 h-28 flex-shrink-0" ref={(el) => {
                            if (el && pieChartRef.current !== el) {
                                pieChartRef.current = el;
                                const wheelHandler = (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const segments = pieDataRef.current.folders || [];
                                    if (segments.length === 0) return;
                                    const currentHovered = pieDataRef.current.hoveredSegment;
                                    const currentIndex = segments.findIndex((s) => s.folder_color === currentHovered);
                                    let newIndex;
                                    if (e.deltaY > 0) newIndex = currentIndex < segments.length - 1 ? currentIndex + 1 : 0;
                                    else newIndex = currentIndex > 0 ? currentIndex - 1 : segments.length - 1;
                                    setHoveredPieSegment(segments[newIndex].folder_color);
                                };
                                el.addEventListener("wheel", wheelHandler, { passive: false });
                            }
                        }}>
                            <svg viewBox="-100 -100 200 200" className="transform -rotate-90 w-full h-full">
                                {pieSegments.map((segment) => {
                                    const outerRadius = 85;
                                    const innerRadius = 40;
                                    const startRad = (segment.startAngle * Math.PI) / 180;
                                    const endRad = (segment.endAngle * Math.PI) / 180;
                                    const x1 = Math.cos(startRad) * outerRadius;
                                    const y1 = Math.sin(startRad) * outerRadius;
                                    const x2 = Math.cos(endRad) * outerRadius;
                                    const y2 = Math.sin(endRad) * outerRadius;
                                    const x3 = Math.cos(endRad) * innerRadius;
                                    const y3 = Math.sin(endRad) * innerRadius;
                                    const x4 = Math.cos(startRad) * innerRadius;
                                    const y4 = Math.sin(startRad) * innerRadius;
                                    const largeArcFlag = segment.angle > 180 ? 1 : 0;
                                    const isHovered = hoveredPieSegment === segment.folder.folder_color;

                                    return (
                                        <path
                                            key={segment.folder.folder_color}
                                            d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`}
                                            fill={segment.folderColorData.hex}
                                            className="cursor-pointer transition-all duration-300"
                                            style={{
                                                opacity: hoveredPieSegment && !isHovered ? 0.3 : 1,
                                                transform: isHovered ? "scale(1.08)" : "scale(1)",
                                                filter: isHovered ? `drop-shadow(0 0 12px ${segment.folderColorData.hex})` : 'none',
                                            }}
                                            onClick={async () => {
                                                const items = await getVideosInFolder(playlist.id, segment.folder.folder_color);
                                                setPlaylistItems(items, playlist.id, { playlist_id: playlist.id, folder_color: segment.folder.folder_color }, playlist.name);
                                                if (items.length > 0 && onVideoSelect) onVideoSelect(items[0].video_url);
                                            }}
                                        />
                                    );
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-black text-white leading-none">{totalVideosInFolders}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tagged</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            {hoveredSegmentData ? (
                                <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: hoveredSegmentData.folderColorData.hex }} />
                                        <h4 className="text-lg font-bold text-white truncate">{hoveredSegmentData.displayName}</h4>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-sky-400">{hoveredSegmentData.videoCount}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Videos</span>
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {hoveredSegmentData.percentage.toFixed(1)}%
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm italic">Explore folders</p>
                            )}
                        </div>
                        <button 
                            onClick={() => setIsMenuOpen(false)}
                            className="p-3 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            ) : (
                /* Full 2x4 Mini Previews Grid (8 Slots) */
                <div className="grid grid-cols-4 gap-2.5 w-full">
                    {localPreviewVideos.slice(0, 8).map((item, index) => {
                        const slotKey = getPreviewItemKey(item, index);
                        const thumbSrc = getPreviewItemThumbnail(item);
                        const showImg = !!thumbSrc && !miniImageErrors.has(slotKey);
                        const isVideo = !item.isOrb && !item.isBannerPreset;
                        const isTweet = !item.isOrb && !item.isBannerPreset && item.thumbnail_url?.includes("twimg.com");
                        const isCover = Boolean(
                            item && displayedThumbnailUrl && (
                                thumbSrc === displayedThumbnailUrl ||
                                (item.thumbnail_url && displayedThumbnailUrl.includes(item.video_id))
                            )
                        );

                        return (
                            <div key={slotKey} data-card-action="true" className="flex items-center justify-center">
                                <MiniPreviewItem
                                    item={item}
                                    index={index}
                                    slotKey={slotKey}
                                    thumbSrc={thumbSrc}
                                    showImg={showImg}
                                    isVideo={isVideo}
                                    isTweet={isTweet}
                                    isCover={isCover}
                                    onVideoSelect={onVideoSelect}
                                    handleMiniVideoRightClick={handleMiniVideoRightClick}
                                    setMiniImageErrors={setMiniImageErrors}
                                    getPreviewItemTitle={getPreviewItemTitle}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

export default LongPlaylistCard;
