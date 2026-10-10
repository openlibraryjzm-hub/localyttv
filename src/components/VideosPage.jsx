import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlaylistStore } from '../store/playlistStore';
import { useQueueStore } from '../store/queueStore';
import { useFolderStore } from '../store/folderStore';
import { useLayoutStore } from '../store/layoutStore';
import { assignVideoToFolder, unassignVideoFromFolder, getAllFolderAssignments, getVideosInFolder, removeVideoFromPlaylist, getWatchedVideoIds, getAllVideoProgress } from '../api/playlistApi';
import { FOLDER_COLORS, getFolderColorById } from '../utils/folderColors';
import { extractVideoId } from '../utils/youtubeUtils';
import VideoCard from './VideoCard';
import PlaylistSelectionModal from './PlaylistSelectionModal';
import PlaylistUploader from './PlaylistUploader';
import { addVideoToPlaylist, getPlaylistItems, getPlaylistSources } from '../api/playlistApi';
import { fetchChannelUploads } from '../utils/youtubeUtils';

import { useStickyStore } from '../store/stickyStore';
import { usePinStore } from '../store/pinStore';
import StickyVideoCarousel from './StickyVideoCarousel';
import PageBanner from './PageBanner';
import EditPlaylistModal from './EditPlaylistModal';
import UnifiedBannerBackground from './UnifiedBannerBackground';
import { useNavigationStore } from '../store/navigationStore';
import { Star, MoreVertical, Plus, Play, Check, X, ArrowUp, Clock, Heart, Pin, Settings, Cat, ChevronLeft, RotateCcw } from 'lucide-react';
import VideoCardSkeleton from './skeletons/VideoCardSkeleton';
import { updatePlaylist, getAllPlaylists, getFolderMetadata, setFolderMetadata } from '../api/playlistApi';
import { useConfigStore } from '../store/configStore';
import { useShuffleStore } from '../store/shuffleStore';
import { usePaginationStore } from '../store/paginationStore';
import TweetCard from './TweetCard';
import OrbCard from './OrbCard';
import BannerPresetCard from './BannerPresetCard';
import ChannelCard from './ChannelCard';
import PlaylistLinkCard from './PlaylistLinkCard';
import AutoTagModal from './AutoTagModal';
import FolderPrismContextMenu from './FolderPrismContextMenu';
import SubscriptionManagerModal from './SubscriptionManagerModal';
import VideoSortFilters from './VideoSortFilters';
import useLongPress from '../hooks/useLongPress';

// Sub-component for individual prism buttons to handle long-press correctly
const PrismButton = ({ 
  onClick, 
  onLongPress, 
  onMouseEnter, 
  onMouseLeave, 
  className, 
  style, 
  title, 
  children 
}) => {
  const longPress = useLongPress(onLongPress, onClick);
  return (
    <button
      {...longPress}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onLongPress}
      className={className}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
};

const FILTER_FALLBACK = { sortBy: 'shuffle', sortDirection: 'desc', selectedRatings: [] };

const VideosPage = ({ onVideoSelect, onSecondPlayerSelect }) => {
  const {
    currentPlaylistItems,
    currentVideoIndex,
    currentPlaylistId,
    setPlaylistItems,
    previewPlaylistItems,
    previewPlaylistId,
    previewFolderInfo,
    setPreviewPlaylist,
    allPlaylists,
    setAllPlaylists,
    clearPreview,
  } = usePlaylistStore();
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const {
    selectedFolder,
    setSelectedFolder,
    setHoveredFolder,
    setVideoFolders,
    videoFolderAssignments,
    loadVideoFolders,
    quickAssignFolder,
    setQuickAssignFolder,
    bulkTagMode,
    setBulkTagMode,
    clearBulkTagSelections,
    allFolderMetadata,
    setAllFolderMetadata,
  } = useFolderStore();
  const { shuffleStates, getShuffleState } = useShuffleStore();
  const {
    setViewMode,
    inspectMode,
    viewMode,
    videoCardStyle,
    showVideosUploader,
    setShowVideosUploader,
    showSubscriptionManager,
    setShowSubscriptionManager,
    requestSubscriptionRefresh,
    setRequestSubscriptionRefresh,
    requestShowAutoTagModal,
    setRequestShowAutoTagModal,
    setFullscreenInfoBlanked,
    visibleSourceTypes,
  } = useLayoutStore();
  const { currentPage: currentNavTab, setCurrentPage: setCurrentNavTab, setSelectedTweet, history, goBack } = useNavigationStore();
  const scrollContainerRef = useRef(null);
  const horizontalScrollRef = useRef(null);

  const scrollToTop = () => {
    // Scroll the main container to top
    // Since we removed horizontalScrollRef from the main list, we should target the scroll container
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (horizontalScrollRef.current) {
      // Fallback for safety if refs are mixed
      horizontalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs = [
    { id: 'playlists', label: 'Playlists' },
    { id: 'videos', label: 'Videos' },
    { id: 'history', label: 'History', icon: <Clock size={16} /> },
    { id: 'likes', label: 'Likes', icon: <Heart size={16} /> },
    { id: 'pins', label: 'Pins', icon: <Pin size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    { id: 'support', label: 'Support', icon: <Cat size={16} /> },
  ];

  const handleTabClick = (tabId) => {
    const isNavigationTab = ['playlists', 'videos', 'history', 'likes', 'pins', 'settings', 'support'].includes(tabId);
    if (isNavigationTab && viewMode === 'full') {
      setFullscreenInfoBlanked(true);
      requestAnimationFrame(() => {
        setCurrentPage(tabId);
        setViewMode('half');
      });
    } else {
      setCurrentPage(tabId);
    }
  };
  const {
    userName,
    userAvatar,
    customPageBannerImage,
    bannerHeight,
    bannerBgSize,
    playlistLayer2Overrides,
    setPlaylistLayer2Override,
    clearPlaylistLayer2Override,
    orbFavorites,
    updateOrbFavoritePlaylists,

    applyOrbFavorite,
    bannerPresets,
    updateBannerPresetPlaylists,
    applyBannerPreset,
    fullscreenBanner,
    splitscreenBanner,
    bannerPreviewMode,
    bannerNavBannerId,
    //orb navigation state setters
    setOrbNavPlaylistId,
    setOrbNavOrbId,
    //banner navigation state setters
    setBannerNavPlaylistId,
    setBannerNavBannerId,
    // playlist filters
    playlistVideoFilters,
    setPlaylistVideoFilter
  } = useConfigStore();

  // Resolve effective banner for background
  let effectiveBanner = fullscreenBanner;
  if (bannerNavBannerId && !bannerPreviewMode && bannerPresets?.length) {
    const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
    if (preset?.fullscreenBanner) effectiveBanner = preset.fullscreenBanner;
  }
  const bannerImage = effectiveBanner?.image || '/banner.PNG';
  const bannerScale = effectiveBanner?.scale ?? 100;
  const bannerVertical = effectiveBanner?.verticalPosition ?? 0;
  const bannerHorizontal = effectiveBanner?.horizontalOffset ?? 0;



  // Helper to get inspect label
  const getInspectTitle = (label) => inspectMode ? label : undefined;
  const [displayedVideos, setDisplayedVideos] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true); // Start true to show skeletons immediately

  // Use preview items if available, otherwise use current playlist items
  const activePlaylistItems = previewPlaylistItems || currentPlaylistItems;
  const activePlaylistId = previewPlaylistId || currentPlaylistId;

  const currentFilters = activePlaylistId && playlistVideoFilters[activePlaylistId] 
    ? playlistVideoFilters[activePlaylistId] 
    : FILTER_FALLBACK;

  const sortBy = currentFilters.sortBy || 'shuffle';
  const sortDirection = currentFilters.sortDirection || 'desc';
  const selectedRatings = currentFilters.selectedRatings || FILTER_FALLBACK.selectedRatings;

  const updateFilters = (updates) => {
    if (activePlaylistId) {
      setPlaylistVideoFilter(activePlaylistId, updates);
    }
  };

  const setSortBy = (val) => {
    const newVal = typeof val === 'function' ? val(sortBy) : val;
    updateFilters({ sortBy: newVal });
  };

  const setSortDirection = (val) => {
    const newVal = typeof val === 'function' ? val(sortDirection) : val;
    updateFilters({ sortDirection: newVal });
  };

  const setSelectedRatings = (val) => {
    const newVal = typeof val === 'function' ? val(selectedRatings) : val;
    updateFilters({ selectedRatings: newVal });
  };

  const [prismOnlyPopulated, setPrismOnlyPopulated] = useState(true); // when true, prism shows only segments with ≥1 item, equal width; default on for Videos page
  const [prismMenuOpen, setPrismMenuOpen] = useState(false);
  const [prismMenuPosition, setPrismMenuPosition] = useState({ top: 0, left: 0 });
  const [prismMenuContextFolder, setPrismMenuContextFolder] = useState(null);
  const [prismMenuContextLabel, setPrismMenuContextLabel] = useState("");
  const [includeUnwatched, setIncludeUnwatched] = useState(true);
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);
  const [watchedVideoIds, setWatchedVideoIds] = useState(new Set());
  const [videoProgress, setVideoProgress] = useState(new Map()); // Map<videoId, { percentage: number, hasFullyWatched: boolean }>

  // Move/Copy state
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [selectedVideoForAction, setSelectedVideoForAction] = useState(null);
  const [actionType, setActionType] = useState(null); // 'move' or 'copy'
  const [showUploader, setShowUploader] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [folderMetadata, setFolderMetadataState] = useState(null); // { custom_name, description }
  const { addToQueue } = useQueueStore();

  // Reset point tracking for chevron navigation
  // Tracks the playlist to return to when clicking the return button
  const [resetPointId, setResetPointId] = useState(null);
  const isChevronNavRef = useRef(false);

  // When activePlaylistId changes from external source (PlaylistsPage preview, controller video grid),
  // set that as the new reset point. Chevron navigation does NOT update the reset point.
  useEffect(() => {
    if (!isChevronNavRef.current && activePlaylistId) {
      setResetPointId(activePlaylistId);
    }
  }, [activePlaylistId]);

  // Show return button when we've navigated away from the reset point
  const showReturnButton = resetPointId && resetPointId !== activePlaylistId;

  // Playlist navigation handlers (for banner chevrons)
  const handleNavigatePlaylist = async (direction) => {
    if (!allPlaylists || allPlaylists.length === 0) return;

    // Find current index in allPlaylists
    const currentIndex = allPlaylists.findIndex(p => p.id === activePlaylistId);
    if (currentIndex === -1) return;

    // Calculate new index with wrapping
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allPlaylists.length;
    } else {
      newIndex = (currentIndex - 1 + allPlaylists.length) % allPlaylists.length;
    }

    const targetPlaylist = allPlaylists[newIndex];
    if (!targetPlaylist) return;

    try {
      // Mark as chevron navigation (so useEffect doesn't update reset point)
      isChevronNavRef.current = true;

      // Fetch playlist items
      const items = await getPlaylistItems(targetPlaylist.id);
      // Set as preview (doesn't affect player or controller menus)
      setPreviewPlaylist(items, targetPlaylist.id, null, targetPlaylist.name);

      // Reset flag after the state update propagates
      setTimeout(() => { isChevronNavRef.current = false; }, 0);
    } catch (error) {
      console.error('Failed to navigate to playlist:', error);
      isChevronNavRef.current = false;
    }
  };

  // Return to reset point playlist
  const handleReturnToOriginal = async () => {
    if (!resetPointId) return;

    try {
      // Mark as internal navigation (don't update reset point)
      isChevronNavRef.current = true;

      // Fetch the reset point playlist items
      const items = await getPlaylistItems(resetPointId);
      const playlist = allPlaylists.find(p => p.id === resetPointId);
      setPreviewPlaylist(items, resetPointId, null, playlist?.name);

      // Reset flag after state update
      setTimeout(() => { isChevronNavRef.current = false; }, 0);
    } catch (error) {
      console.error('Failed to return to original playlist:', error);
      isChevronNavRef.current = false;
    }
  };

  // Pagination state (from store for sharing with TopNavigation)
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    isEditingPage,
    setIsEditingPage,
    pageInputValue,
    setPageInputValue,
    itemsPerPage,
    resetPagination,
    preserveScroll,
    clearPreserveScroll,
  } = usePaginationStore();
  const pageInputRef = useRef(null);
  // Long-press "charge" progress for first/last page (0..1), per button
  const [navHoldProgress, setNavHoldProgress] = useState({ prev: 0, next: 0 });
  const navHoldIntervalRef = useRef(null);
  const navHoldTargetRef = useRef(null); // 'prev' | 'next'
  const navSingleClickTimerRef = useRef(null);
  const navLastClickTimeRef = useRef(0);
  const navDidLongClickRef = useRef(false);





  // Reset page when playlist, folder, or sort filters change
  useEffect(() => {
    resetPagination();
    scrollToTop();
    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activePlaylistId, selectedFolder, sortBy, sortDirection, selectedRatings, includeUnwatched, showOnlyCompleted, resetPagination]);

  // Scroll to left and top when page changes (unless preserveScroll is set from TopNav)
  useEffect(() => {
    if (preserveScroll) {
      // Clear the flag but don't scroll
      clearPreserveScroll();
    } else {
      scrollToTop();
      if (horizontalScrollRef.current) {
        horizontalScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage, preserveScroll, clearPreserveScroll]);

  // When TopNavigation requests open uploader or auto-tag modal
  useEffect(() => {
    if (showVideosUploader) {
      setShowUploader(true);
      setShowVideosUploader(false);
    }
  }, [showVideosUploader, setShowVideosUploader]);
  useEffect(() => {
    if (requestShowAutoTagModal) {
      setShowAutoTagModal(true);
      setRequestShowAutoTagModal(false);
    }
  }, [requestShowAutoTagModal, setRequestShowAutoTagModal]);

  // When TopNavigation requests subscription refresh (left-click on Subscriptions button)
  useEffect(() => {
    if (!requestSubscriptionRefresh || !activePlaylistId) return;
    setRequestSubscriptionRefresh(false);
    let cancelled = false;
    (async () => {
      try {
        const sources = await getPlaylistSources(activePlaylistId);
        if (cancelled || !sources || sources.length === 0) {
          if (!cancelled) alert('No subscriptions found in this playlist.');
          return;
        }
        let totalNew = 0;
        const MAX_CONCURRENT = 5;
        for (let i = 0; i < sources.length; i += MAX_CONCURRENT) {
          const chunk = sources.slice(i, i + MAX_CONCURRENT);
          await Promise.all(chunk.map(async (source) => {
            try {
              const limit = source.video_limit || 10;
              let videos = [];
              if (source.source_type === 'channel') {
                videos = await fetchChannelUploads(source.source_value, limit);
              }
              for (const v of videos) {
                try {
                  await addVideoToPlaylist(activePlaylistId, v.video_url, v.video_id, v.title, v.thumbnail_url, v.author, null, v.published_at, false, v.profile_image_url || null);
                  totalNew++;
                } catch (e) { /* ignore duplicates */ }
              }
            } catch (e) {
              console.error('Source refresh failed:', e);
            }
          }));
        }
        if (cancelled) return;
        if (totalNew > 0) {
          const items = await getPlaylistItems(activePlaylistId);
          setPlaylistItems(items, activePlaylistId);
          alert(`Refresh complete! Added ${totalNew} new videos.`);
        } else {
          alert('No new videos found.');
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          alert('Refresh failed.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [requestSubscriptionRefresh, activePlaylistId, setRequestSubscriptionRefresh, setPlaylistItems]);

  useEffect(() => {
    // Sync selected video with current playing video
    if (currentVideoIndex >= 0 && activePlaylistItems.length > 0) {
      setSelectedVideoIndex(currentVideoIndex);
    }
  }, [currentVideoIndex, activePlaylistItems]);



  const { isStickied, toggleSticky, stickiedVideos: allStickiedVideos } = useStickyStore();

  const handleToggleSticky = (playlistId, videoId) => {
    console.log(`[VideosPage] Toggling sticky for playlist ${playlistId}, video ${videoId}, folder ${selectedFolder}`);
    // Pass selectedFolder to toggle function to scope the key
    toggleSticky(playlistId, videoId, selectedFolder);
  };

  // Debug effect
  useEffect(() => {
    console.log('[VideosPage] Active Playlist:', activePlaylistId);
    console.log('[VideosPage] Sticky Data:', allStickiedVideos);
    console.log('[VideosPage] Selected Folder:', selectedFolder);
  }, [activePlaylistId, allStickiedVideos, selectedFolder]);

  // Reset selected folder when playlist changes to prevent showing wrong videos
  useEffect(() => {
    setSelectedFolder(null);
  }, [activePlaylistId, setSelectedFolder]);

  const handlePrismContextMenu = (e, folderId, label) => {
    e.preventDefault();
    e.stopPropagation();
    setPrismMenuContextFolder(folderId);
    setPrismMenuContextLabel(label);
    setPrismMenuPosition({ top: e.clientY, left: e.clientX });
    setPrismMenuOpen(true);
  };

  // Clear bulk tag selections when exiting bulk tag mode
  useEffect(() => {
    if (!bulkTagMode) {
      clearBulkTagSelections();
    }
  }, [bulkTagMode, clearBulkTagSelections]);

  // Load video progress data for sorting
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // Load watched video IDs (>= 85% progress)
        const watchedIds = await getWatchedVideoIds();
        setWatchedVideoIds(new Set(watchedIds));

        // Load all video progress
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
        setVideoProgress(progressMap);
      } catch (error) {
        console.error('Failed to load video progress:', error);
      }
    };

    loadProgress();

    // Poll for progress updates every 5 seconds to keep UI fresh
    const intervalId = setInterval(loadProgress, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Refresh video progress when current video changes (to update sorting in real-time)
  useEffect(() => {
    const refreshProgress = async () => {
      if (activePlaylistItems.length > 0 && currentVideoIndex < activePlaylistItems.length) {
        try {
          // Refresh watched video IDs
          const watchedIds = await getWatchedVideoIds();
          setWatchedVideoIds(new Set(watchedIds));

          // Refresh all progress data
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
          setVideoProgress(progressMap);
        } catch (error) {
          console.error('Failed to refresh video progress:', error);
        }
      }
    };

    // Debounce the refresh to avoid too many API calls
    const timeoutId = setTimeout(refreshProgress, 2000);
    return () => clearTimeout(timeoutId);
  }, [currentVideoIndex, activePlaylistItems]);

  // Load folder assignments when playlist changes (but don't filter here)
  useEffect(() => {
    const loadAssignments = async () => {
      // Set loading true immediately when ID changes
      setLoadingFolders(true);

      // If no playlist or it's empty, clear folders
      // Actually, even if items are empty, we might want to clear or just wait.
      // But if we have an ID, we can fetch assignments.
      if (!activePlaylistId) {
        loadVideoFolders({});
        setLoadingFolders(false);
        return;
      }

      try {
        // PERFORMANCE: Batch fetch all folder assignments in ONE call
        // This replaces the previous N+1 loop that caused massive stuttering
        const assignments = await getAllFolderAssignments(activePlaylistId);
        loadVideoFolders(assignments || {});
      } catch (error) {
        console.error('Failed to load folder assignments:', error);
        loadVideoFolders({});
      } finally {
        setLoadingFolders(false);
      }
    };

    loadAssignments();
  }, [activePlaylistId, activePlaylistItems, loadVideoFolders]);

  // Load all folder metadata when playlist changes
  useEffect(() => {
    const loadAllFolderMetadata = async () => {
      if (!activePlaylistId) {
        setAllFolderMetadata({});
        return;
      }

      try {
        // Fetch metadata for all 16 folder colors in parallel
        const metadataPromises = FOLDER_COLORS.map(async (color) => {
          try {
            const metadata = await getFolderMetadata(activePlaylistId, color.id);
            return { folderColor: color.id, metadata };
          } catch (error) {
            console.error(`Failed to load metadata for folder ${color.id}:`, error);
            return { folderColor: color.id, metadata: null };
          }
        });

        const results = await Promise.all(metadataPromises);
        const metadataMap = {};
        results.forEach(({ folderColor, metadata }) => {
          if (metadata && metadata[0]) {
            // metadata[0] is the custom name
            metadataMap[folderColor] = { name: metadata[0], description: metadata[1] };
          }
        });
        setAllFolderMetadata(metadataMap);
      } catch (error) {
        console.error('Failed to load folder metadata:', error);
        setAllFolderMetadata({});
      }
    };

    loadAllFolderMetadata();
  }, [activePlaylistId]);

  // Initialize shuffle state when entering shuffle mode or playlist loading
  useEffect(() => {
    if (activePlaylistId && activePlaylistItems.length > 0) {
      // We essentially want to ensure the shuffle map exists for this playlist
      // This is "low cost" because getShuffleState checks if it exists first
      getShuffleState(activePlaylistId, activePlaylistItems.map(v => v.id));
    }
  }, [activePlaylistId, activePlaylistItems, getShuffleState]);

  // Filter videos by selected folder - this is the main filtering logic
  useEffect(() => {
    if (!activePlaylistId || activePlaylistItems.length === 0) {
      setDisplayedVideos([]);
      return;
    }

    const isTrackerOrChannel = (video) => {
      if (!video) return false;
      const url = video.video_url || video.videoUrl || '';
      const isChannel = video.isChannel || url.includes('youtube.com/channel/') || url.includes('youtube.com/@') || url.startsWith('@');
      const isFolderTracker = video.isFolderTracker || url.startsWith('local:device_folder:');
      const isPlaylistTracker = video.isPlaylist || url.includes('youtube.com/playlist?list=') || url.startsWith('local:playlist:') || url.startsWith('local:folder:');
      return isChannel || isFolderTracker || isPlaylistTracker;
    };

    const filterVideos = async () => {
      const cleanPlaylistItems = activePlaylistItems.filter(v => !isTrackerOrChannel(v));

      if (selectedFolder === null) {
        // Show all videos when no folder is selected
        // Also include Orbs assigned to this playlist
        const assignedOrbs = orbFavorites ? orbFavorites
          .filter(orb => orb.playlistIds && orb.playlistIds.includes(activePlaylistId))
          .map(orb => ({
            ...orb,
            id: `orb-${orb.id}`, // Unique ID for React key
            originalId: orb.id,
            isOrb: true,
            title: orb.name // For search/sort consistency if needed
          })) : [];

        const assignedBanners = bannerPresets ? bannerPresets
          .filter(preset => preset.playlistIds && preset.playlistIds.map(String).includes(String(activePlaylistId)))
          .map(preset => ({
            ...preset,
            id: `banner-${preset.id}`, // Unique ID for React key
            originalId: preset.id,
            isBannerPreset: true,
            title: preset.name
          })) : [];

        setDisplayedVideos([...assignedOrbs, ...assignedBanners, ...cleanPlaylistItems]);
        return;
      }

      setLoadingFolders(true);
      setDisplayedVideos([]);
      try {
        if (selectedFolder === 'unsorted') {
          // Filter for videos with no folder assignments
          const unsortedVideos = [];
          for (const video of cleanPlaylistItems) {
            const folders = videoFolderAssignments[video.id];
            if (!folders || folders.length === 0) {
              unsortedVideos.push(video);
            }
          }
          console.log(`Unsorted filter: Found ${unsortedVideos.length} videos`);
          setDisplayedVideos(unsortedVideos);
        } else {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          const cleanVideos = (Array.isArray(videos) ? videos : []).filter(v => !isTrackerOrChannel(v));
          console.log(`Folder ${selectedFolder}: Found ${cleanVideos.length} videos with assignments`);
          setDisplayedVideos(cleanVideos);
        }
      } catch (error) {
        console.error('Failed to load folder videos:', error);
        setDisplayedVideos([]);
      } finally {
        setLoadingFolders(false);
      }
    };

    filterVideos();
  }, [selectedFolder, activePlaylistId, activePlaylistItems, videoFolderAssignments, orbFavorites, bannerPresets]);

  const handleRenameFolder = async (folderColor, newName) => {
    if (!activePlaylistId) return;
    try {
      // Keep existing description if present
      const currentMeta = allFolderMetadata[folderColor] || {};
      const description = currentMeta.description || '';

      await setFolderMetadata(activePlaylistId, folderColor, newName, description, null);

      // Update local state
      setAllFolderMetadata(prev => ({
        ...prev,
        [folderColor]: { ...prev[folderColor], name: newName }
      }));
    } catch (error) {
      console.error('Failed to rename folder:', error);
      alert('Failed to rename folder: ' + error.message);
    }
  };

  const handleMenuOptionClick = async (option, video) => {
    console.log('handleMenuOptionClick:', option.action, video.id, 'activePermission:', !!activePlaylistId);
    if (!activePlaylistId) {
      console.warn('Action attempted without activePlaylistId');
      // Temporarily allow for testing if that's the issue, or alert user
      // return; 
    }

    try {
      switch (option.action) {
        case 'delete':
          const confirmed = window.confirm(
            `Are you sure you want to remove "${video.title || 'this video'}" from the playlist?`
          );
          if (!confirmed) return;

          await removeVideoFromPlaylist(activePlaylistId, video.id);

          // Remove from displayed videos
          setDisplayedVideos(prev => prev.filter(v => v.id !== video.id));

          // Remove from active playlist items
          // Use activePlaylistItems instead of currentPlaylistItems as base if possible, 
          // but we need to update the store which expects us to update the specific list.
          // Since we are modifying the *active* playlist, we should update the store for that playlist.

          if (previewPlaylistId) {
            // We are in preview mode
            const updatedItems = previewPlaylistItems.filter(v => v.id !== video.id);
            // We need a clearPreview or setPreviewPlaylist method, but setPreviewPlaylist is safer
            setPreviewPlaylist(updatedItems, previewPlaylistId, previewFolderInfo);
          } else {
            // We are in current playback mode
            const updatedItems = currentPlaylistItems.filter(v => v.id !== video.id);
            setPlaylistItems(updatedItems, currentPlaylistId);
          }
          break;

        case 'assignFolder':
          if (option.folderColor) {
            const currentFolders = videoFolderAssignments[video.id] || [];
            const isAssigned = currentFolders.includes(option.folderColor);

            if (isAssigned) {
              await unassignVideoFromFolder(activePlaylistId, video.id, option.folderColor);
              setVideoFolders(video.id, currentFolders.filter(f => f !== option.folderColor));
            } else {
              await assignVideoToFolder(activePlaylistId, video.id, option.folderColor);
              setVideoFolders(video.id, [...currentFolders, option.folderColor]);
            }

            // Refresh folder view if viewing that folder
            if (selectedFolder === option.folderColor) {
              const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
              setDisplayedVideos(videos || []);
            }
          }
          break;

        case 'setQuickAssign':
          if (option.folderColor) {
            setQuickAssignFolder(option.folderColor);
            console.log('Quick assign folder set to:', option.folderColor);
          }
          break;

        case 'moveToPlaylist':
          setSelectedVideoForAction(video);
          setActionType('move');
          setShowPlaylistSelector(true);
          break;

        case 'copyToPlaylist':
          setSelectedVideoForAction(video);
          setActionType('copy');
          setShowPlaylistSelector(true);
          break;

        case 'addToQueue':
          addToQueue(video);
          console.log('Video added to queue:', video.title);
          break;

        default:
          console.log('Unknown action:', option.action);
      }
    } catch (error) {
      console.error('Failed to handle menu action:', error);
      alert(`Failed to ${option.label.toLowerCase()}: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStarClick = async (e, video) => {
    if (!activePlaylistId) return;

    const currentFolders = videoFolderAssignments[video.id] || [];

    // Use quick assign folder (stored preference) instead of selected folder
    const targetFolder = quickAssignFolder;
    const isAssigned = currentFolders.includes(targetFolder);

    try {
      if (isAssigned) {
        // Unassign from quick assign folder
        await unassignVideoFromFolder(activePlaylistId, video.id, targetFolder);
        const updatedFolders = currentFolders.filter(f => f !== targetFolder);
        setVideoFolders(video.id, updatedFolders);

        // Refresh folder view if viewing that folder
        if (selectedFolder === targetFolder) {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          setDisplayedVideos(videos || []);
        }
      } else {
        // Assign to quick assign folder
        await assignVideoToFolder(activePlaylistId, video.id, targetFolder);
        setVideoFolders(video.id, [...currentFolders, targetFolder]);

        // Refresh folder view if viewing that folder
        if (selectedFolder === targetFolder) {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          setDisplayedVideos(videos || []);
        }
      }
    } catch (error) {
      console.error('Failed to toggle folder assignment:', error);
      alert(`Failed to ${isAssigned ? 'unassign' : 'assign'} video: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle star color left click - assign video to folder
  const handleStarColorLeftClick = async (video, folderColor) => {
    if (!activePlaylistId) return;

    const currentFolders = videoFolderAssignments[video.id] || [];
    const isAssigned = currentFolders.includes(folderColor);

    try {
      if (isAssigned) {
        // Unassign from folder
        await unassignVideoFromFolder(activePlaylistId, video.id, folderColor);
        const updatedFolders = currentFolders.filter(f => f !== folderColor);
        setVideoFolders(video.id, updatedFolders);

        // Refresh folder view if viewing that folder
        if (selectedFolder === folderColor) {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          setDisplayedVideos(videos || []);
        }
      } else {
        // Assign to folder
        await assignVideoToFolder(activePlaylistId, video.id, folderColor);
        setVideoFolders(video.id, [...currentFolders, folderColor]);

        // Refresh folder view if viewing that folder
        if (selectedFolder === folderColor) {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          setDisplayedVideos(videos || []);
        }
      }
    } catch (error) {
      console.error('Failed to toggle folder assignment:', error);
      alert(`Failed to ${isAssigned ? 'unassign' : 'assign'} video: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle star color right click - set as quick assign default
  const handleStarColorRightClick = (folderColor) => {
    setQuickAssignFolder(folderColor);
    console.log('Quick assign folder set to:', folderColor);
  };

  const handleVideoClick = (video, index) => {
    if (bulkTagMode) return; // Don't play videos in bulk tag mode

    // If we are in preview mode, commit this playlist to be the active one
    if (previewPlaylistId) {
      // Find playlist name for title consistency
      const playlist = allPlaylists.find(p => p.id === previewPlaylistId);
      const title = playlist ? playlist.name : null;

      // Commit preview to current
      setPlaylistItems(previewPlaylistItems, previewPlaylistId, previewFolderInfo, title);

      // Clear preview state since it's now active
      // actually setPlaylistItems updates current, we might want to clear preview explicitly or let store handle it?
      // store.setPlaylistItems doesn't autoclear preview.
      // But usually checking `activePlaylistItems = preview || current` handles the view.
      // If we made it current, we should probably clear preview so we aren't "previewing" anymore, we are "playing".
      // But let's stick to the core requirement: ensure title is correct.
    }

    const originalIndex = activePlaylistItems.findIndex(v => v.id === video.id);
    setSelectedVideoIndex(originalIndex >= 0 ? originalIndex : index);
    if (onVideoSelect) {
      onVideoSelect(video.video_url);
    }
  };

  const handleBulkTagColorClick = (video, folderColor) => {
    // Instant assign/unassign (same as 3-dot menu or star click)
    handleStarColorLeftClick(video, folderColor);
  };

  const handleToggleRating = (rating) => {
    setSelectedRatings(prev =>
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating].sort((a, b) => a - b)
    );
  };

  const [showAutoTagModal, setShowAutoTagModal] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  const handleAutoTagConfirm = async (handle, videos, folderColor) => {
    if (!activePlaylistId || !folderColor) return;

    setIsAutoTagging(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Assign each video to the folder
      for (const video of videos) {
        try {
          const videoId = video.id; // Correct ID usage
          const currentFolders = videoFolderAssignments[videoId] || [];

          if (!currentFolders.includes(folderColor)) {
            await assignVideoToFolder(activePlaylistId, videoId, folderColor);

            // Update local store immediately
            setVideoFolders(videoId, [...currentFolders, folderColor]);
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to auto-tag video ${video.id}:`, err);
          errorCount++;
        }
      }

      // Refresh folder view if viewing the target folder
      if (selectedFolder === folderColor) {
        const updatedVideos = await getVideosInFolder(activePlaylistId, selectedFolder);
        setDisplayedVideos(updatedVideos || []);
      }

      // Artificial delay to show the nice loading state if it was too fast
      if (successCount < 5) await new Promise(r => setTimeout(r, 500));

      alert(`Auto-tagged ${successCount} videos from ${handle} to folder!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      setShowAutoTagModal(false);

    } catch (error) {
      console.error('Auto-tag failed:', error);
      alert('Auto-tag process failed');
    } finally {
      setIsAutoTagging(false);
    }
  };

  const handlePlaylistSelect = async (playlistId) => {
    if (!selectedVideoForAction || !actionType) return;

    try {
      const video = selectedVideoForAction;
      console.log(`${actionType === 'move' ? 'Moving' : 'Copying'} video to playlist ${playlistId}:`, video.title);

      const videoId = extractVideoId(video.video_url) || video.video_id;

      // 1. Add to destination playlist (Copy logic)
      await addVideoToPlaylist(
        playlistId,
        video.video_url,
        videoId,
        video.title,
        video.thumbnail_url
      );

      // 2. If 'move', remove from current playlist
      if (actionType === 'move' && activePlaylistId) {
        await removeVideoFromPlaylist(activePlaylistId, video.id);

        // Update UI locally to reflect removal
        setDisplayedVideos(prev => prev.filter(v => v.id !== video.id));

        // Update global store
        if (previewPlaylistId) {
          const updatedItems = previewPlaylistItems.filter(v => v.id !== video.id);
          setPreviewPlaylist(updatedItems, previewPlaylistId, previewFolderInfo);
        } else {
          const updatedItems = currentPlaylistItems.filter(v => v.id !== video.id);
          setPlaylistItems(updatedItems, currentPlaylistId);
        }
      }

      // Success feedback (could use a toast)
      console.log(`Video successfully ${actionType === 'move' ? 'moved' : 'copied'}!`);
      // Optional: alert(`Video ${actionType === 'move' ? 'moved' : 'copied'} successfully!`);

    } catch (error) {
      console.error(`Failed to ${actionType} video:`, error);
      alert(`Failed to ${actionType} video: ${error.message}`);
    } finally {
      setShowPlaylistSelector(false);
      setSelectedVideoForAction(null);
      setActionType(null);
    }
  };

  // Calculate folder counts (16 colors only)
  const folderCounts = useMemo(() => {
    const counts = {};
    if (videoFolderAssignments) {
      Object.values(videoFolderAssignments).forEach(folders => {
        if (Array.isArray(folders)) {
          folders.forEach(folderId => {
            counts[folderId] = (counts[folderId] || 0) + 1;
          });
        }
      });
    }
    return counts;
  }, [videoFolderAssignments]);

  // Count for "All" (total items) and "Unsorted" (videos with no folder) for prism labels
  const allCount = useMemo(() => {
    const orbs = orbFavorites?.filter(orb => orb.playlistIds?.includes(activePlaylistId))?.length ?? 0;
    const banners = bannerPresets?.filter(p => p.playlistIds?.map(String).includes(String(activePlaylistId)))?.length ?? 0;
    return orbs + banners + (activePlaylistItems?.length ?? 0);
  }, [activePlaylistId, activePlaylistItems, orbFavorites, bannerPresets]);

  const unsortedCount = useMemo(() => {
    if (!activePlaylistItems?.length) return 0;
    return activePlaylistItems.filter(v => {
      const folders = videoFolderAssignments?.[v.id];
      return !folders || folders.length === 0;
    }).length;
  }, [activePlaylistItems, videoFolderAssignments]);

  // Segments to show in "only populated" prism mode: All, Unsorted (if ≥1), and colors with ≥1 item
  const prismPopulatedSegments = useMemo(() => {
    const segments = [{ type: 'all', id: null, count: allCount, label: null, hex: null }];
    if (unsortedCount >= 1) segments.push({ type: 'unsorted', id: 'unsorted', count: unsortedCount, label: null, hex: null });
    FOLDER_COLORS.forEach(color => {
      const count = folderCounts[color.id] || 0;
      if (count >= 1) segments.push({ type: 'color', id: color.id, count, label: color.name, hex: color.hex });
    });
    return segments;
  }, [allCount, unsortedCount, folderCounts]);

  // Get available folders (those with videos, plus "all" and "unsorted")
  const availableFolders = useMemo(() => {
    const folders = [];
    // Always include "all" (null) and "unsorted"
    folders.push({ id: null, name: 'All' });
    folders.push({ id: 'unsorted', name: 'Unsorted' });
    // Add folders with videos, in FOLDER_COLORS order
    FOLDER_COLORS.forEach(color => {
      if (folderCounts[color.id] > 0) {
        folders.push({ id: color.id, name: color.name });
      }
    });
    return folders;
  }, [folderCounts]);

  // Navigate to previous folder
  const handleFolderNavigatePrev = () => {
    const currentIndex = availableFolders.findIndex(f => f.id === selectedFolder);
    if (currentIndex > 0) {
      setSelectedFolder(availableFolders[currentIndex - 1].id);
    } else {
      // Wrap to last folder
      setSelectedFolder(availableFolders[availableFolders.length - 1].id);
    }
  };

  // Navigate to next folder
  const handleFolderNavigateNext = () => {
    const currentIndex = availableFolders.findIndex(f => f.id === selectedFolder);
    if (currentIndex < availableFolders.length - 1) {
      setSelectedFolder(availableFolders[currentIndex + 1].id);
    } else {
      // Wrap to first folder
      setSelectedFolder(availableFolders[0].id);
    }
  };

  const handleUploadComplete = async (dbPlaylistId) => {
    setShowUploader(false);

    // Refresh all playlists globally so that any newly created/modified playlist shows up immediately
    try {
      const playlists = await getAllPlaylists();
      setAllPlaylists(playlists);
    } catch (error) {
      console.error('Failed to reload playlists after upload:', error);
    }

    // Determine target playlist ID to load
    const targetPlaylistId = dbPlaylistId || activePlaylistId;

    if (targetPlaylistId) {
      try {
        const items = await getPlaylistItems(targetPlaylistId);
        if (previewPlaylistId) {
          setPreviewPlaylist(items, targetPlaylistId, previewFolderInfo);
        } else {
          setPlaylistItems(items, targetPlaylistId);
        }
      } catch (error) {
        console.error('Failed to reload playlist after upload:', error);
      }
    }
  };

  const handleCloseSubscriptionManager = async () => {
    setShowSubscriptionManager(false);
    if (activePlaylistId) {
      try {
        const items = await getPlaylistItems(activePlaylistId);
        if (previewPlaylistId) {
          setPreviewPlaylist(items, previewPlaylistId, previewFolderInfo);
        } else {
          setPlaylistItems(items, currentPlaylistId);
        }
      } catch (error) {
        console.error('Failed to reload playlist after closing subscription manager:', error);
      }
    }
  };

  // Fetch folder metadata when selected folder changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (activePlaylistId && selectedFolder && selectedFolder !== 'unsorted') {
        try {
          const metadata = await getFolderMetadata(activePlaylistId, selectedFolder);
          // API returns [name, description] or null.
          // Wait, check rust implementation: returns (String, String) or None.
          // Check JS implementation: returns result || null.
          // So if result is array/tuple, it's [name, desc].
          // Let's verify what Tauri returns for tuple. It usually returns array.

          if (metadata) {
            // Destructure carefully if it's array
            setFolderMetadataState({ name: metadata[0], description: metadata[1], customAscii: metadata[2] });
          } else {
            setFolderMetadataState(null);
          }
        } catch (error) {
          console.error("Failed to fetch folder metadata:", error);
          setFolderMetadataState(null);
        }
      } else {
        setFolderMetadataState(null);
      }
    };

    fetchMetadata();
  }, [activePlaylistId, selectedFolder]);


  const handleUpdateMetadata = async (data) => {
    if (!activePlaylistId) return;

    try {
      if (selectedFolder) {
        // Update Folder Metadata (including 'unsorted')
        await setFolderMetadata(activePlaylistId, selectedFolder, data.name, data.description, data.customAscii);
        // Refresh local state
        setFolderMetadataState({ name: data.name, description: data.description, customAscii: data.customAscii });

        // Refresh the global zustand store that powers TopNavigation and other global spots
        setAllFolderMetadata(prev => ({
          ...prev,
          [selectedFolder]: { ...prev[selectedFolder], name: data.name, description: data.description }
        }));
      } else {
        // Update Playlist Metadata
        await updatePlaylist(activePlaylistId, data.name, data.description, data.customAscii);

        // Update Page Banner Override (Layer 2)
        // Determine the override key (playlist ID or composite "playlist:folder")
        // If selectedFolder is set, we use composite key. Otherwise just playlist ID.
        const overrideKey = selectedFolder
          ? `${activePlaylistId}:${selectedFolder}`
          : activePlaylistId;

        console.log('[VideosPage] Saving Banner Override:', {
          activePlaylistId,
          selectedFolder,
          overrideKey,
          hasImage: !!data.bannerImage
        });

        if (data.bannerImage) {
          setPlaylistLayer2Override(overrideKey, {
            image: data.bannerImage,
            scale: data.bannerScale ?? 100,
            xOffset: data.bannerXOffset ?? 50,
            yOffset: data.bannerYOffset ?? 50
          });
        } else {
          // If image is removed/null, clear the override
          clearPlaylistLayer2Override(overrideKey);
        }

        // Update global state store by reloading all playlists
        const playlists = await getAllPlaylists();
        setAllPlaylists(playlists);
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
      throw error;
    }
  };

  // Derived state for visible items (Playlists Items + Orbs OR Folder Content)
  const visibleItems = useMemo(() => {
    let items = [];
    if (selectedFolder === null) {
      // Include Orbs assigned to this playlist
      const assignedOrbs = orbFavorites ? orbFavorites
        .filter(orb => orb.playlistIds?.includes(activePlaylistId))
        .map(orb => ({
          ...orb,
          id: `orb-${orb.id}`,
          originalId: orb.id,
          isOrb: true,
          title: orb.name
        })) : [];

      // Include Banners assigned to this playlist
      const assignedBanners = bannerPresets ? bannerPresets
        .filter(preset => preset.playlistIds && preset.playlistIds.map(String).includes(String(activePlaylistId)))
        .map(preset => ({
          ...preset,
          id: `banner-${preset.id}`, // Unique ID for React key
          originalId: preset.id,
          isBannerPreset: true,
          title: preset.name
        })) : [];

      items = [...assignedOrbs, ...assignedBanners, ...activePlaylistItems];
    } else {
      items = displayedVideos;
    }

    // Filter by visible source types
    return items.filter(video => {
      if (video.isOrb) {
        return visibleSourceTypes?.orb !== false;
      }
      if (video.isBannerPreset) {
        return visibleSourceTypes?.banner !== false;
      }
      const isTweet = !video.is_local && (video.video_url?.includes('twitter.com') || video.video_url?.includes('x.com') || video.thumbnail_url?.includes('twimg.com'));
      if (isTweet) {
        return visibleSourceTypes?.tweet !== false;
      }
      const isChannel = video.video_url?.includes('youtube.com/channel/') ||
        video.video_url?.includes('youtube.com/@') ||
        video.video_url?.startsWith('@') ||
        video.isChannel;
      if (isChannel) {
        return false;
      }
      const isPlaylistTracker = video.isPlaylist || video.video_url?.includes('youtube.com/playlist?list=') || video.isFolderTracker || video.video_url?.startsWith('local:device_folder:') || video.video_url?.startsWith('local:playlist:') || video.video_url?.startsWith('local:folder:');
      if (isPlaylistTracker) {
        return false;
      }
      const isImage = video.video_url && /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(video.video_url);
      if (isImage) {
        return visibleSourceTypes?.image !== false;
      }
      return visibleSourceTypes?.video !== false;
    });
  }, [selectedFolder, displayedVideos, activePlaylistItems, orbFavorites, bannerPresets, activePlaylistId, visibleSourceTypes]);

  // Sort videos based on selected sort option
  // IMPORTANT: This hook must be called BEFORE any early returns
  const sortedVideos = useMemo(() => {
    // Determine which videos to display (folder filtered or all)
    let baseVideos = visibleItems;

    // Rating filter: when any drumstick rating is selected, filter to those ratings
    if (selectedRatings && selectedRatings.length > 0) {
      const ratingSet = new Set(selectedRatings);
      baseVideos = baseVideos.filter(v => {
        if (v.isOrb || v.isBannerPreset) return true; // Keep non-video items
        const r = v.drumstick_rating ?? 0;
        return ratingSet.has(r);
      });
    }

    // Handle empty arrays
    if (!baseVideos || baseVideos.length === 0) {
      return [];
    }

    if (sortBy === 'chronological') {
      return [...baseVideos].sort((a, b) => {
        const dateA = new Date(a.published_at || a.added_at || 0).getTime();
        const dateB = new Date(b.published_at || b.added_at || 0).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    if (sortBy === 'addedToApp') {
      return [...baseVideos].sort((a, b) => {
        const dateA = new Date(a.added_at || 0).getTime();
        const dateB = new Date(b.added_at || 0).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    if (sortBy === 'shuffle') {
      const state = shuffleStates[activePlaylistId];

      const getStableRank = (id) => {
        if (state?.map && state.map[id] !== undefined) return state.map[id];
        // Deterministic hash based on ID as a stable fallback
        let hash = 0;
        const str = String(id);
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0;
        }
        return (hash + 2147483648) / 4294967296;
      };

      return [...baseVideos].sort((a, b) => getStableRank(a.id) - getStableRank(b.id));
    }

    if (sortBy === 'progress') {
      let filtered = [...baseVideos];

      // Filter: Hide Unwatched
      if (!includeUnwatched) {
        filtered = filtered.filter(video => {
          const videoId = extractVideoId(video.video_url) || video.video_id || video.id;
          const data = videoProgress.get(videoId);
          const percentage = data ? (typeof data === 'number' ? data : data.percentage) : 0;
          const isLocal = video.is_local || (!video.video_url?.includes('youtube.com') && !video.video_url?.includes('youtu.be'));
          return percentage > 0 || isLocal; // Keep local content if we can't track it easily yet
        });
      }

      if (showOnlyCompleted) {
        filtered = filtered.filter(video => {
          const videoId = extractVideoId(video.video_url) || video.video_id || video.id;
          const data = videoProgress.get(videoId);
          const hasFullyWatched = data ? (typeof data === 'object' ? data.hasFullyWatched : false) : false;
          return !hasFullyWatched;
        });
      }

      const sorted = filtered.sort((a, b) => {
        const idA = extractVideoId(a.video_url) || a.video_id || a.id;
        const idB = extractVideoId(b.video_url) || b.video_id || b.id;

        const dataA = videoProgress.get(idA);
        const dataB = videoProgress.get(idB);

        const progressA = dataA ? (typeof dataA === 'number' ? dataA : dataA.percentage) : 0;
        const progressB = dataB ? (typeof dataB === 'number' ? dataB : dataB.percentage) : 0;

        // If progress is equal, fallback to date
        if (progressA === progressB) {
          const dateA = new Date(a.published_at || a.added_at || 0).getTime();
          const dateB = new Date(b.published_at || b.added_at || 0).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }

        return sortDirection === 'asc'
          ? progressA - progressB
          : progressB - progressA;
      });
      return sorted;
    }

    if (sortBy === 'lastViewed') {
      const sorted = [...baseVideos].sort((a, b) => {
        const idA = extractVideoId(a.video_url) || a.video_id || a.id;
        const idB = extractVideoId(b.video_url) || b.video_id || b.id;

        const dataA = videoProgress.get(idA);
        const dataB = videoProgress.get(idB);

        const lastUpdatedA = dataA?.last_updated ? new Date(dataA.last_updated).getTime() : 0;
        const lastUpdatedB = dataB?.last_updated ? new Date(dataB.last_updated).getTime() : 0;

        if (lastUpdatedA === lastUpdatedB) {
          const dateA = new Date(a.published_at || a.added_at || 0).getTime();
          const dateB = new Date(b.published_at || b.added_at || 0).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }

        return sortDirection === 'asc'
          ? lastUpdatedA - lastUpdatedB
          : lastUpdatedB - lastUpdatedA;
      });
      return sorted;
    }

    if (sortBy === 'watchCount') {
      const sorted = [...baseVideos].sort((a, b) => {
        const idA = extractVideoId(a.video_url) || a.video_id || a.id;
        const idB = extractVideoId(b.video_url) || b.video_id || b.id;

        const dataA = videoProgress.get(idA);
        const dataB = videoProgress.get(idB);

        const watchCountA = dataA?.watchCount || 0;
        const watchCountB = dataB?.watchCount || 0;

        if (watchCountA === watchCountB) {
          const dateA = new Date(a.published_at || a.added_at || 0).getTime();
          const dateB = new Date(b.published_at || b.added_at || 0).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }

        return sortDirection === 'asc'
          ? watchCountA - watchCountB
          : watchCountB - watchCountA;
      });
      return sorted;
    }

    return baseVideos;
  }, [selectedFolder, displayedVideos, activePlaylistItems, sortBy, sortDirection, selectedRatings, videoProgress, includeUnwatched, showOnlyCompleted, shuffleStates, activePlaylistId]);

  // Determine which videos to display (for count display)
  const videosToDisplay = visibleItems;

  // Split sorted videos into stickied and regular
  // Use allStickiedVideos to ensure reactivity
  // Sticky videos should NOT be affected by filters, so we use videosToDisplay (unfiltered) instead of sortedVideos
  const stickiedVideos = videosToDisplay.filter(v => {
    // Check specific folder key
    const folderKey = selectedFolder === null ? 'root' : selectedFolder;
    const key = `${activePlaylistId}::${folderKey}`;
    const stickies = allStickiedVideos[key] || [];
    return stickies.includes(v.id);
  });

  const regularVideos = sortedVideos;

  // Update total pages in store whenever regularVideos changes & clamp currentPage if out of bounds
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(regularVideos.length / itemsPerPage));
    setTotalPages(newTotalPages);
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages));
    }
  }, [regularVideos, itemsPerPage, setTotalPages, currentPage, setCurrentPage]);

  // Helper to get banner info
  const activeObject = useMemo(() => {
    if (selectedFolder) {
      return folderMetadata; // This will be null or {name, description}
    }
    return allPlaylists.find(p => p.id === activePlaylistId);
  }, [allPlaylists, activePlaylistId, selectedFolder, folderMetadata]);

  const bannerInfo = useMemo(() => {
    let title = '';
    let description = '';
    let color = null;
    let isEditable = true;
    let customAscii = null;
    let hex = '#3b82f6'; // Default Blue

    if (selectedFolder) {
      if (selectedFolder === 'unsorted') {
        if (activeObject && activeObject.name) {
          title = activeObject.name;
          description = activeObject.description || '';
          customAscii = activeObject.customAscii;
        } else {
          title = 'Unsorted Videos';
          description = `Videos from "${allPlaylists.find(p => p.id === activePlaylistId)?.name || 'Playlist'}" that haven't been assigned to any folder.`;
        }
        color = 'unsorted';
        hex = '#64748b'; // Slate-500
        isEditable = true;
      } else {
        // Folder View
        const colorInfo = FOLDER_COLORS.find(c => c.id === selectedFolder);
        color = selectedFolder;
        if (colorInfo) hex = colorInfo.hex;

        if (activeObject) { // activeObject here refers to folderMetadataState
          title = activeObject.name || (colorInfo ? `${colorInfo.name} Folder` : 'Folder');
          description = activeObject.description || '';
          customAscii = activeObject.customAscii;
        } else {
          // Fallback to default names if no metadata
          title = colorInfo ? `${colorInfo.name} Folder` : 'Folder';
          description = `Videos in the ${title}.`;
        }
        isEditable = true; // Folders are editable
      }
    } else {
      // Playlist View
      title = activeObject ? activeObject.name : '';
      description = activeObject ? activeObject.description : '';
      // Playlist object from Rust uses snake_case
      customAscii = activeObject ? activeObject.custom_ascii : null;
      color = null;
      isEditable = true;
    }

    return { title, description, color, isEditable, customAscii, hex };
  }, [activeObject, selectedFolder, activePlaylistId, allPlaylists]);

  // Determine initial data for modal
  const modalInitialData = useMemo(() => {
    // Determine appropriate override key
    const overrideKey = selectedFolder
      ? `${activePlaylistId}:${selectedFolder}`
      : activePlaylistId;

    const override = playlistLayer2Overrides[overrideKey];

    if (selectedFolder) {
      // Folder edit (including unsorted)
      let defaultName = 'Folder';

      if (selectedFolder === 'unsorted') {
        defaultName = 'Unsorted Videos';
      } else {
        const colorInfo = FOLDER_COLORS.find(c => c.id === selectedFolder);
        if (colorInfo) defaultName = `${colorInfo.name} Folder`;
      }

      return {
        name: activeObject?.name || defaultName,
        description: activeObject?.description || '',
        customAscii: activeObject?.customAscii || '',
        // Banner Override settings (Folder level)
        bannerImage: override?.image,
        bannerScale: override?.scale,
        bannerXOffset: override?.xOffset,
        bannerYOffset: override?.yOffset
      };
    } else {
      // Playlist edit
      return {
        name: activeObject?.name || '',
        description: activeObject?.description || '',
        customAscii: activeObject?.custom_ascii || '',
        // Banner Override settings (Playlist level)
        bannerImage: override?.image,
        bannerScale: override?.scale,
        bannerXOffset: override?.xOffset,
        bannerYOffset: override?.yOffset
      };
    }
  }, [activeObject, selectedFolder, activePlaylistId, playlistLayer2Overrides]);

  // Find most recently watched video for "Continue" feature
  const continueVideo = useMemo(() => {
    if (!videosToDisplay || videosToDisplay.length === 0) return null;

    let mostRecent = null;
    let maxTime = 0;

    for (const video of videosToDisplay) {
      const videoId = extractVideoId(video.video_url) || video.video_id;
      const progress = videoProgress.get(videoId);

      if (progress && progress.last_updated) {
        const time = new Date(progress.last_updated).getTime();
        if (time > maxTime) {
          maxTime = time;
          mostRecent = video;
        }
      }
    }

    return mostRecent;
  }, [videosToDisplay, videoProgress]);

  // Get pinned videos from store
  const { pinnedVideos, priorityPinIds } = usePinStore();

  // Find ALL pinned videos that are in the current playlist (with folder colors and priority flags)
  const pinnedVideosInPlaylist = useMemo(() => {
    if (!videosToDisplay || videosToDisplay.length === 0 || !pinnedVideos || pinnedVideos.length === 0) {
      return [];
    }

    // Create a set of video IDs in the current playlist for fast lookup
    const playlistVideoIds = new Set(
      videosToDisplay.map(v => v.video_id || extractVideoId(v.video_url))
    );

    // Find all pinned videos that are in this playlist and attach folder color + priority flags
    const pinsInPlaylist = pinnedVideos
      .filter(pin => {
        const pinVideoId = pin.video_id || extractVideoId(pin.video_url);
        return playlistVideoIds.has(pinVideoId);
      })
      .map(pin => {
        // Get folder color for this pinned video (use first assigned folder)
        const folders = videoFolderAssignments[pin.id] || [];
        const isPriority = priorityPinIds?.includes(pin.id) || false;
        return {
          ...pin,
          folder_color: folders.length > 0 ? folders[0] : null,
          isPriority
        };
      });

    // Sort so priority pin is always first
    return pinsInPlaylist.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return 0;
    });
  }, [videosToDisplay, pinnedVideos, videoFolderAssignments, priorityPinIds]);

  // Sticky header state detection
  const [isStuck, setIsStuck] = useState(false);
  const stickySentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is NOT visible (scrolled past top), we are stuck
        setIsStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 0);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );

    if (stickySentinelRef.current) {
      observer.observe(stickySentinelRef.current);
    }
    return () => observer.disconnect();
  }, []);

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

      {/* Main Page Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Video Grid - 3 per row */}
      {showUploader ? (
        <div className="flex-1 w-full h-full overflow-hidden p-2 bg-transparent">
          <PlaylistUploader
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
            initialPlaylistId={activePlaylistId}
          />
        </div>
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent relative">
          <AutoTagModal
            isOpen={showAutoTagModal}
            onClose={() => setShowAutoTagModal(false)}
            items={activePlaylistItems}
            videoFolderAssignments={videoFolderAssignments}
            folderMetadata={allFolderMetadata}
            onConfirm={handleAutoTagConfirm}
            isProcessing={isAutoTagging}
          />
          {/* Page Banner - DISABLED PER USER REQUEST */}
          {/* Replacement Mini Header - MOVED TO TOPNAVIGATION */}
          {activePlaylistId && (
            <SubscriptionManagerModal
              isOpen={showSubscriptionManager}
              onClose={handleCloseSubscriptionManager}
              playlistId={activePlaylistId}
            />
          )}
          {/*
           {activePlaylistId && (
            <div
              className="w-full h-[100px] flex items-end px-8 pb-4 transition-all duration-300"
              style={{
                background: `linear-gradient(to bottom, transparent, ${bannerInfo.hex || '#ffffff'}30)`,
              }}
            >
              <div className="flex flex-col">
                <h1
                  className="text-3xl font-bold tracking-tight"
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    color: bannerInfo.hex || 'rgba(255,255,255,0.9)'
                  }}
                >
                  {bannerInfo.title}
                </h1>
                {bannerInfo.description && (
                  <p className="text-white/50 text-xs mt-0.5 font-medium line-clamp-1 max-w-2xl">
                    {bannerInfo.description}
                  </p>
                )}
              </div>
            </div>
          )}
          */}


          {/* 
          {activePlaylistId && (
            <div className="px-4 pt-8">
              <PageBanner
                title={bannerInfo.title}
                description={bannerInfo.description}
                folderColor={bannerInfo.color}
                onEdit={bannerInfo.isEditable ? () => setShowEditModal(true) : undefined}
                videoCount={videosToDisplay.length}
                creationYear="2026"
                author={userName}
                avatar={bannerInfo.customAscii || userAvatar}
                continueVideo={continueVideo}
                onContinue={() => {
                  if (continueVideo && onVideoSelect) {
                    onVideoSelect(continueVideo.video_url);
                  }
                }}
                pinnedVideos={pinnedVideosInPlaylist}
                onPinnedClick={(video) => {
                  if (video && onVideoSelect) {
                    onVideoSelect(video.video_url);
                  }
                }}
                seamlessBottom={true}
                onNavigateNext={() => handleNavigatePlaylist('next')}
                onNavigatePrev={() => handleNavigatePlaylist('prev')}
                onReturn={handleReturnToOriginal}
                showReturnButton={showReturnButton}
                currentPlaylistId={activePlaylistId}
                onFolderNavigatePrev={handleFolderNavigatePrev}
                onFolderNavigateNext={handleFolderNavigateNext}
                selectedFolder={selectedFolder}
                folderCounts={folderCounts}
                allPlaylists={allPlaylists}
              />
            </div>
          )}
          */}

          {/* Sticky Sentinel */}
          <div ref={stickySentinelRef} className="absolute h-px w-full -mt-px pointer-events-none opacity-0" />

          {/* Sticky Toolbar */}
          <div
            className={`sticky top-0 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-visible bg-[#cde5fa]
            ${isStuck
                ? 'pt-2 pb-2'
                : 'mb-4 mt-0 pt-1 pb-0'
              }
            `}
            style={{
              marginTop: '0px' // banner removed, no overlap needed
            }}
          >

            <div className={`px-4 flex items-center justify-between transition-all duration-300 relative z-10 ${isStuck ? 'h-[52px]' : 'py-0.5'}`}>

              {/* Sort & rating filters & actions: Home, Funnel, Plus dropdown */}
              <VideoSortFilters
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
                selectedRatings={selectedRatings}
                onToggleRating={handleToggleRating}
                isLight={selectedFolder === null}
                className="shrink-0 mr-2"
                onAddClick={() => setShowVideosUploader(true)}
                onRefreshClick={() => setShowSubscriptionManager(true)}
                onRefreshRightClick={(e) => setRequestSubscriptionRefresh(true)}
                onBulkTagClick={() => setBulkTagMode(!bulkTagMode)}
                onBulkTagRightClick={(e) => setRequestShowAutoTagModal(true)}
                bulkTagMode={bulkTagMode}
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevPage={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                onNextPage={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              />

              {/* Folder prism: full bar or "only populated" mode; right-click on prism toggles mode */}
              <div className="flex items-center min-w-0 flex-1 mr-0 relative z-20">
                <div
                  className="flex items-center h-7 min-w-0 flex-1 border-2 border-black rounded-lg overflow-hidden cursor-context-menu"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // Fallback if they right-click exactly on a 0px border / gap
                    setPrismMenuPosition({ top: e.clientY, left: e.clientX });
                    setPrismMenuContextFolder(selectedFolder);
                    setPrismMenuContextLabel("Folder");
                    setPrismMenuOpen(true);
                  }}
                  title={prismOnlyPopulated ? 'Right-click: Context Menu' : 'Right-click: Context Menu'}
                >
                  {prismOnlyPopulated ? (
                    /* Only segments with ≥1 item; equal width */
                    prismPopulatedSegments.map((seg, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === prismPopulatedSegments.length - 1;
                      const isSelected = selectedFolder === seg.id;
                      const isAll = seg.type === 'all';
                      const isUnsorted = seg.type === 'unsorted';
                      const ringClass = isSelected
                        ? (isAll ? 'after:ring-black/10' : isUnsorted ? 'after:ring-white/30' : 'after:ring-white/50')
                        : '';
                      const bg = isAll ? 'bg-white text-black' : isUnsorted ? 'bg-black text-white' : '';
                      return (
                        <PrismButton
                          key={seg.type + (seg.id ?? 'all')}
                          onClick={() => setSelectedFolder(seg.id)}
                          onLongPress={(e) => handlePrismContextMenu(e, seg.id, isAll ? "Playlist" : isUnsorted ? "Unsorted" : (allFolderMetadata[seg.id]?.name || seg.label))}
                          onMouseEnter={() => setHoveredFolder(seg.id)}
                          onMouseLeave={() => setHoveredFolder(undefined)}
                          className={`h-full flex-1 min-w-0 flex items-center justify-center transition-all tabular-nums px-0.5 text-[10px] font-bold leading-none ${isSelected
                            ? `opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset ${ringClass}`
                            : 'opacity-60 hover:opacity-100'
                            } ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''} ${bg}`}
                          style={seg.hex ? { backgroundColor: seg.hex } : undefined}
                          title={isAll ? `Show All (${seg.count})` : isUnsorted ? `Unsorted (${seg.count})` : `${allFolderMetadata[seg.id]?.name || seg.label} (${seg.count})`}
                        >
                          <span className={seg.hex ? 'text-white/90 drop-shadow-md' : ''}>{seg.count}</span>
                        </PrismButton>
                      );
                    })
                  ) : (
                    <>
                      {/* All */}
                      <PrismButton
                        onClick={() => setSelectedFolder(null)}
                        onLongPress={(e) => handlePrismContextMenu(e, null, "Playlist")}
                        onMouseEnter={() => setHoveredFolder(null)}
                        onMouseLeave={() => setHoveredFolder(undefined)}
                        className={`h-full min-w-[2.25rem] flex-1 flex items-center justify-center transition-all rounded-l-md tabular-nums px-px max-w-[3rem] ${selectedFolder === null
                          ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-black/10'
                          : 'opacity-60 hover:opacity-100'
                          } bg-white text-black text-[10px] font-bold leading-none`}
                        title={`Show All (${allCount} items)`}
                      >
                        {allCount}
                      </PrismButton>
                      {/* Unsorted */}
                      <PrismButton
                        onClick={() => setSelectedFolder('unsorted')}
                        onLongPress={(e) => handlePrismContextMenu(e, 'unsorted', "Unsorted")}
                        onMouseEnter={() => setHoveredFolder('unsorted')}
                        onMouseLeave={() => setHoveredFolder(undefined)}
                        className={`h-full min-w-[2.25rem] flex-1 flex items-center justify-center transition-all tabular-nums px-px max-w-[3rem] ${selectedFolder === 'unsorted'
                          ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white/30'
                          : 'opacity-60 hover:opacity-100'
                          } bg-black text-white text-[10px] font-bold leading-none`}
                        title={`Unsorted (${unsortedCount} items)`}
                      >
                        {unsortedCount}
                      </PrismButton>
                      {/* 16 folder colors */}
                       {FOLDER_COLORS.map((color, index) => {
                        const isSelected = selectedFolder === color.id;
                        const isLast = index === FOLDER_COLORS.length - 1;
                        const count = folderCounts[color.id] || 0;
                        return (
                          <PrismButton
                            key={color.id}
                            onClick={() => setSelectedFolder(color.id)}
                            onLongPress={(e) => handlePrismContextMenu(e, color.id, allFolderMetadata[color.id]?.name || color.name)}
                            onMouseEnter={() => setHoveredFolder(color.id)}
                            onMouseLeave={() => setHoveredFolder(undefined)}
                            className={`h-full flex-1 min-w-0 flex items-center justify-center transition-all tabular-nums px-0.5 ${isSelected
                              ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white/50'
                              : 'opacity-60 hover:opacity-100'
                              } ${isLast ? 'rounded-r-md' : ''}`}
                            style={{ backgroundColor: color.hex }}
                            title={`${allFolderMetadata[color.id]?.name || color.name} (${count})`}
                          >
                            {count > 0 && (
                              <span className="text-[10px] font-bold text-white/90 drop-shadow-md truncate max-w-full">
                                {count}
                              </span>
                            )}
                          </PrismButton>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Right side: Back, Close */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto relative z-20">
                {(history.length > 0 || previewPlaylistId) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (previewPlaylistId) clearPreview();
                      if (history.length > 0) goBack();
                      else if (previewPlaylistId) setCurrentNavTab('playlists');
                    }}
                    className="flex items-center justify-center w-7 h-7 bg-transparent transition-all hover:scale-110 active:scale-90 shrink-0 opacity-85 hover:opacity-100"
                    style={{
                      color: 'white',
                      filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)'
                    }}
                    title="Go Back"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className="flex items-center justify-center w-7 h-7 bg-transparent transition-all hover:scale-110 active:scale-90 shrink-0 opacity-85 hover:opacity-100"
                  style={{
                    color: 'white',
                    filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)'
                  }}
                  title="Close menu (Full screen)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            </div>


          </div >

          {/* Blurred app banner behind content only (excludes sticky toolbar / VideoSortFilters) */}
          <div className="relative overflow-hidden">
            <div className="relative z-10 px-4 pb-8">

              {/* Context Menu for Folder Prism */}
              <FolderPrismContextMenu
                isOpen={prismMenuOpen}
                position={prismMenuPosition}
                onClose={() => setPrismMenuOpen(false)}
                prismOnlyPopulated={prismOnlyPopulated}
                setPrismOnlyPopulated={setPrismOnlyPopulated}
                onRenameClick={() => {
                  setSelectedFolder(prismMenuContextFolder);
                  setShowEditModal(true);
                }}
                clickedSegmentLabel={prismMenuContextLabel}
              />
              {/* Edit Playlist/Folder Modal */}
              <EditPlaylistModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleUpdateMetadata}
                initialData={modalInitialData}
              />

              {loadingFolders ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 animate-pulse">
                  {[...Array(12)].map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))}
                </div>
              ) : sortedVideos.length > 0 ? (
                <>
                  {/* Sticky Carousel Section - Hide on Unsorted page */}
                  {stickiedVideos.length > 0 && selectedFolder !== 'unsorted' && (
                    <StickyVideoCarousel>
                      {stickiedVideos.map((video, index) => {
                        const originalIndex = activePlaylistItems.findIndex(v => v.id === video.id);
                        return (
                          <VideoCard
                            key={video.id}
                            video={video}
                            index={index}
                            originalIndex={originalIndex}
                            isSelected={selectedVideoIndex === originalIndex}
                            isCurrentlyPlaying={(() => {
                              const currentPlaying = currentPlaylistItems[currentVideoIndex];
                              return !!(
                                currentPlaying &&
                                (currentPlaying.video_id === video.video_id ||
                                 currentPlaying.video_url === video.video_url)
                              );
                            })()}
                            videoFolders={videoFolderAssignments[video.id] || []}
                            selectedFolder={selectedFolder}
                            onVideoClick={() => handleVideoClick(video, index)}
                            onStarClick={(e) => handleStarClick(e, video)}
                            onStarColorLeftClick={handleStarColorLeftClick}
                            onStarColorRightClick={handleStarColorRightClick}
                            onMenuOptionClick={(option) => {
                              if (option.action === 'toggleSticky') {
                                handleToggleSticky(activePlaylistId, video.id);
                              } else {
                                handleMenuOptionClick(option, video);
                              }
                            }}
                            onLongClick={() => {
                              addToQueue(video);
                              console.log('Video added to queue via long press:', video.title);
                            }}
                            onQuickAssign={handleStarClick}
                            bulkTagMode={bulkTagMode}
                            bulkTagSelections={new Set(videoFolderAssignments[video.id] || [])}
                            onBulkTagColorClick={(color) => handleBulkTagColorClick(video, color)}
                            onPinClick={() => { }} // Handled internally in VideoCard via store
                            isStickied={true} // It is stickied in this list
                            playlistId={activePlaylistId}
                            folderMetadata={allFolderMetadata}
                            onRenameFolder={handleRenameFolder}
                            cardStyle={videoCardStyle}
                            progress={(() => {
                              const videoId = extractVideoId(video.video_url) || video.video_id;
                              const data = videoProgress.get(videoId);
                              return data ? (typeof data === 'number' ? data : data.percentage) : 0;
                            })()}
                            watchCount={(() => {
                              const videoId = extractVideoId(video.video_url) || video.video_id;
                              const data = videoProgress.get(videoId);
                              return data ? data.watchCount || 0 : 0;
                            })()}
                          />
                        );
                      })}
                    </StickyVideoCarousel>
                  )}

                  {/* Vertical Video Grid - 3 per row (matches LikesPage) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 animate-fade-in">
                    {regularVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((video, idx) => {
                      const isTweet = !video.is_local && (video.video_url?.includes('twitter.com') || video.video_url?.includes('x.com') || video.thumbnail_url?.includes('twimg.com'));
                      const isImage = video.video_url && /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(video.video_url);
                      const originalIndex = activePlaylistItems.findIndex(v => v.id === video.id);
                      const folderKey = selectedFolder === null ? 'root' : selectedFolder;
                      const key = `${activePlaylistId}::${folderKey}`;
                      const isContextStickied = (allStickiedVideos[key] || []).includes(video.id);

                      const handleRenameFolder = async (folderColor, newName) => {
                        if (!activePlaylistId) return;
                        try {
                          // Keep existing description if present
                          const currentMeta = allFolderMetadata[folderColor] || {};
                          const description = currentMeta.description || '';

                          await setFolderMetadata(activePlaylistId, folderColor, newName, description);

                          // Update local state
                          setAllFolderMetadata(prev => ({
                            ...prev,
                            [folderColor]: { ...prev[folderColor], name: newName }
                          }));
                        } catch (error) {
                          console.error('Failed to rename folder:', error);
                          alert('Failed to rename folder');
                        }
                      };

                      // ... (render)

                      // Common props for both card types
                      const commonProps = {
                        video,
                        index: (currentPage - 1) * itemsPerPage + idx,
                        originalIndex,
                        isSelected: selectedVideoIndex === originalIndex,
                        isCurrentlyPlaying: !!(
                          currentPlaylistItems[currentVideoIndex] &&
                          (currentPlaylistItems[currentVideoIndex].video_id === video.video_id ||
                           currentPlaylistItems[currentVideoIndex].video_url === video.video_url)
                        ),
                        videoFolders: videoFolderAssignments[video.id] || [],
                        selectedFolder,
                        onVideoClick: () => handleVideoClick(video, (currentPage - 1) * itemsPerPage + idx),
                        onStarClick: (e) => handleStarClick(e, video),
                        onStarColorLeftClick: handleStarColorLeftClick,
                        onStarColorRightClick: handleStarColorRightClick,
                        onMenuOptionClick: (option) => {
                          if (option.action === 'toggleSticky') {
                            handleToggleSticky(activePlaylistId, video.id);
                          } else {
                            handleMenuOptionClick(option, video);
                          }
                        },
                        onLongClick: () => {
                          addToQueue(video);
                          console.log('Video added to queue via long press:', video.title);
                        },
                        onQuickAssign: handleStarClick,
                        bulkTagMode,
                        bulkTagSelections: new Set(videoFolderAssignments[video.id] || []),
                        onBulkTagColorClick: (color) => handleBulkTagColorClick(video, color),
                        onPinClick: () => { },
                        isStickied: isContextStickied,
                        playlistId: activePlaylistId,
                        folderMetadata: allFolderMetadata,
                        onRenameFolder: handleRenameFolder,
                        progress: (() => {
                          const data = videoProgress.get(video.id) || videoProgress.get(extractVideoId(video.video_url));
                          return data ? (typeof data === 'number' ? data : data.percentage) : 0;
                        })(),
                        watchCount: (() => {
                          const data = videoProgress.get(video.id) || videoProgress.get(extractVideoId(video.video_url));
                          return data ? data.watchCount || 0 : 0;
                        })()
                      };

                      if (isTweet) {
                        return (
                          <div key={video.id} className="h-full">
                            <TweetCard
                              {...commonProps}
                              onVideoClick={() => {
                                setSelectedTweet(video);
                                setCurrentNavTab('tweet');
                              }}
                            />
                          </div>
                        );
                      }

                      const isChannel = video.video_url?.includes('youtube.com/channel/') ||
                        video.video_url?.includes('youtube.com/@') ||
                        video.video_url?.startsWith('@');

                      if (isChannel || video.isChannel) {
                        return (
                          <div key={video.id} className="h-full">
                            <ChannelCard
                              video={video}
                              onClick={() => {
                                // Keep raw channel URL available for extraction modals
                                console.log('Channel card clicked:', video.video_url);
                              }}
                              onRemove={() => handleMenuOptionClick({ action: 'remove' }, video)}
                            />
                          </div>
                        );
                      }

                      const isFolderTracker = video.isFolderTracker || video.video_url?.startsWith('local:device_folder:');
                      const isPlaylistTracker = video.isPlaylist || video.video_url?.includes('youtube.com/playlist?list=');

                      if (isPlaylistTracker || isFolderTracker) {
                        return (
                          <div key={video.id} className="h-full flex items-center justify-center">
                            <PlaylistLinkCard
                              video={video}
                              onClick={() => {
                                console.log('Tracker clicked:', video.video_url);
                              }}
                              onRemove={() => handleMenuOptionClick({ action: 'remove' }, video)}
                            />
                          </div>
                        );
                      }

                      if (video.isOrb) {
                        return (
                          <div key={video.id} className="h-full">
                            <OrbCard
                              orb={{ ...video, id: video.originalId || parseInt(video.id.replace('orb-', '')) }}
                              allPlaylists={allPlaylists}
                              onUpdatePlaylists={updateOrbFavoritePlaylists}
                              minimal={true}
                              onClick={() => {
                                applyOrbFavorite(video);
                                // Sync Navigation
                                if (activePlaylistId) {
                                  setOrbNavPlaylistId(activePlaylistId);
                                }
                                setOrbNavOrbId(video.originalId || parseInt(video.id.replace('orb-', '')));
                              }}
                              currentPlaylistId={activePlaylistId}
                            />
                          </div>
                        );

                      }

                      if (video.isBannerPreset) {
                        return (
                          <div key={video.id} className="h-full">
                            <BannerPresetCard
                              preset={{ ...video, id: video.originalId || video.id.replace('banner-', '') }}
                              allPlaylists={allPlaylists}
                              onUpdatePlaylists={updateBannerPresetPlaylists}
                              onClick={() => {
                                applyBannerPreset(video);
                                // Sync Navigation
                                if (activePlaylistId) {
                                  setBannerNavPlaylistId(activePlaylistId);
                                }
                                setBannerNavBannerId(video.originalId || video.id.replace('banner-', ''));
                              }}
                              currentPlaylistId={activePlaylistId}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={video.id} className={`w-full ${isImage ? 'h-auto' : 'h-full'} flex flex-col justify-center`}>
                          <VideoCard
                            {...commonProps}
                            cardStyle={videoCardStyle}
                          />
                        </div>
                      );
                    })}
                  </div>

                </>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  No videos found in this playlist.
                </div>
              )}

              {/* Pagination Controls - Based on Regular Videos only, since Stickies are always shown */}
              {totalPages > 1 && (() => {
                // Quarter jump targets for double-click
                const useQuarterJumps = totalPages > 4;
                const quarterMarks = useQuarterJumps
                  ? [
                    Math.max(1, Math.round(totalPages * 0.25)),
                    Math.max(1, Math.round(totalPages * 0.5)),
                    Math.max(1, Math.round(totalPages * 0.75)),
                    totalPages
                  ]
                  : [];
                const getNextQuarter = () => {
                  if (!useQuarterJumps) return Math.min(currentPage + 1, totalPages);
                  const next = quarterMarks.find(q => q > currentPage);
                  return next || totalPages;
                };
                const getPrevQuarter = () => {
                  if (!useQuarterJumps) return Math.max(currentPage - 1, 1);
                  const prev = [...quarterMarks].reverse().find(q => q < currentPage);
                  return prev || 1;
                };

                const LONG_PRESS_MS = 500;
                const DOUBLE_CLICK_MS = 300;
                const TICK_MS = 40;
                const progressPerTick = TICK_MS / LONG_PRESS_MS;

                const clearHoldProgress = (which) => {
                  if (navHoldIntervalRef.current) {
                    clearInterval(navHoldIntervalRef.current);
                    navHoldIntervalRef.current = null;
                  }
                  navHoldTargetRef.current = null;
                  setNavHoldProgress((p) => ({ ...p, [which]: 0 }));
                };

                const createCombinedHandlers = (which, singleAction, doubleAction, longAction) => ({
                  onMouseDown: () => {
                    navDidLongClickRef.current = false;
                    setNavHoldProgress((p) => ({ ...p, [which]: 0 }));
                    navHoldTargetRef.current = which;
                    navHoldIntervalRef.current = setInterval(() => {
                      setNavHoldProgress((p) => {
                        const next = Math.min(1, p[which] + progressPerTick);
                        if (next >= 1) {
                          if (navHoldIntervalRef.current) {
                            clearInterval(navHoldIntervalRef.current);
                            navHoldIntervalRef.current = null;
                          }
                          navDidLongClickRef.current = true;
                          longAction();
                          return { ...p, [which]: 0 };
                        }
                        return { ...p, [which]: next };
                      });
                    }, TICK_MS);
                  },
                  onMouseUp: () => {
                    clearHoldProgress(which);
                    if (navDidLongClickRef.current) return;
                    const now = Date.now();
                    const timeSinceLastClick = now - navLastClickTimeRef.current;
                    if (timeSinceLastClick < DOUBLE_CLICK_MS) {
                      if (navSingleClickTimerRef.current) clearTimeout(navSingleClickTimerRef.current);
                      navLastClickTimeRef.current = 0;
                      doubleAction();
                    } else {
                      navLastClickTimeRef.current = now;
                      navSingleClickTimerRef.current = setTimeout(() => {
                        singleAction();
                        navLastClickTimeRef.current = 0;
                      }, DOUBLE_CLICK_MS);
                    }
                  },
                  onMouseLeave: () => clearHoldProgress(which),
                  onTouchStart: () => {
                    navDidLongClickRef.current = false;
                    setNavHoldProgress((p) => ({ ...p, [which]: 0 }));
                    navHoldTargetRef.current = which;
                    navHoldIntervalRef.current = setInterval(() => {
                      setNavHoldProgress((p) => {
                        const next = Math.min(1, p[which] + progressPerTick);
                        if (next >= 1) {
                          if (navHoldIntervalRef.current) {
                            clearInterval(navHoldIntervalRef.current);
                            navHoldIntervalRef.current = null;
                          }
                          navDidLongClickRef.current = true;
                          longAction();
                          return { ...p, [which]: 0 };
                        }
                        return { ...p, [which]: next };
                      });
                    }, TICK_MS);
                  },
                  onTouchEnd: (e) => {
                    clearHoldProgress(which);
                    if (navDidLongClickRef.current) {
                      e.preventDefault();
                      return;
                    }
                    const now = Date.now();
                    const timeSinceLastClick = now - navLastClickTimeRef.current;
                    if (timeSinceLastClick < DOUBLE_CLICK_MS) {
                      if (navSingleClickTimerRef.current) clearTimeout(navSingleClickTimerRef.current);
                      navLastClickTimeRef.current = 0;
                      doubleAction();
                    } else {
                      navLastClickTimeRef.current = now;
                      navSingleClickTimerRef.current = setTimeout(() => {
                        singleAction();
                        navLastClickTimeRef.current = 0;
                      }, DOUBLE_CLICK_MS);
                    }
                    e.preventDefault();
                  },
                });

                const prevHandlers = createCombinedHandlers(
                  'prev',
                  () => setCurrentPage(Math.max(currentPage - 1, 1)),
                  () => setCurrentPage(getPrevQuarter()),
                  () => setCurrentPage(1)
                );
                const nextHandlers = createCombinedHandlers(
                  'next',
                  () => setCurrentPage(Math.min(currentPage + 1, totalPages)),
                  () => setCurrentPage(getNextQuarter()),
                  () => setCurrentPage(totalPages)
                );

                // Up to 5 numbered page buttons; sliding window when totalPages > 5
                const maxNumberedButtons = 5;
                const startPage = totalPages <= maxNumberedButtons
                  ? 1
                  : Math.max(1, Math.min(currentPage - 2, totalPages - maxNumberedButtons + 1));
                const endPage = Math.min(totalPages, startPage + maxNumberedButtons - 1);
                const pageNumbers = [];
                for (let p = startPage; p <= endPage; p++) pageNumbers.push(p);

                const btnBase = 'p-1.5 rounded-md transition-all border-2 shrink-0 flex items-center justify-center min-w-[2rem] font-bold select-none';
                const btnInactive = 'bg-white/80 text-black/60 hover:bg-gray-100 hover:text-black border-black/20';
                const btnActive = 'bg-black text-white border-black shadow-md';

                return (
                  <div className="flex justify-center items-center gap-2 mt-8 mb-4 flex-wrap">
                    {/* Previous: click=prev, double-click=quarter back, hold=first (with charge animation) */}
                    <button
                      {...prevHandlers}
                      disabled={currentPage === 1}
                      className={`relative overflow-hidden px-3 py-2 rounded-lg border-2 border-black/20 font-bold text-lg transition-colors select-none
                      ${currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-white/50' : 'bg-white/80 text-black/70 hover:bg-gray-100 hover:text-black'}`}
                      title="Click: previous | Double-click: quarter back | Hold ~0.5s: first page"
                    >
                      <span className="relative z-10">&lt;</span>
                      {navHoldProgress.prev > 0 && (
                        <span
                          className="absolute inset-0 bg-black/20 transition-all duration-75 ease-linear"
                          style={{ width: `${navHoldProgress.prev * 100}%` }}
                          aria-hidden
                        />
                      )}
                    </button>

                    {/* Numbered page buttons (up to 8) */}
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {pageNumbers.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
                          title={`Page ${p}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    {/* Next: click=next, double-click=quarter forward, hold=last (with charge animation) */}
                    <button
                      {...nextHandlers}
                      disabled={currentPage >= totalPages}
                      className={`relative overflow-hidden px-3 py-2 rounded-lg border-2 border-black/20 font-bold text-lg transition-colors select-none
                      ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed bg-white/50' : 'bg-white/80 text-black/70 hover:bg-gray-100 hover:text-black'}`}
                      title="Click: next | Double-click: quarter forward | Hold ~0.5s: last page"
                    >
                      <span className="relative z-10">&gt;</span>
                      {navHoldProgress.next > 0 && (
                        <span
                          className="absolute inset-0 bg-black/20 transition-all duration-75 ease-linear"
                          style={{ width: `${navHoldProgress.next * 100}%` }}
                          aria-hidden
                        />
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div >

      )
      }

      {/* Playlist Selection Modal */}
      <PlaylistSelectionModal
        isOpen={showPlaylistSelector}
        onClose={() => {
          setShowPlaylistSelector(false);
          setSelectedVideoForAction(null);
          setActionType(null);
        }}
        onSelect={handlePlaylistSelect}
        title={actionType === 'move' ? 'Move to Playlist' : 'Copy to Playlist'}
      />
      </div>
    </div>
  );
};

export default VideosPage;

