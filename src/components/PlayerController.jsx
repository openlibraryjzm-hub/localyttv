import PlayerControllerPlaylistMenu from './PlayerControllerPlaylistMenu';
import PlayerControllerOrbMenu from './PlayerControllerOrbMenu';
import PlayerControllerVideoMenu from './PlayerControllerVideoMenu';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Home, Twitter, List, Shuffle, Grid3X3, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, CheckCircle2, X, Settings2, Pin, Share2, Info, BarChart2, Bookmark, MoreHorizontal, Heart, ListMusic, Zap, Radio, Flame, ChevronsLeft, ChevronsRight, Upload, Palette, History as HistoryIcon, Layout, Layers, Compass, Library, Eye, EyeOff, RotateCcw, ThumbsUp, Plus, Anchor as AnchorIcon, Type, MousePointer2, ArrowLeftRight, Circle, Settings, Move, LayoutGrid, Clock, HelpCircle } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useNavigationStore } from '../store/navigationStore';
import { usePinStore } from '../store/pinStore';
import { useQueueStore } from '../store/queueStore';
import { useLayoutStore } from '../store/layoutStore';
import { useFolderStore } from '../store/folderStore';
import { useTabStore } from '../store/tabStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { useConfigStore } from '../store/configStore';
import { useTabPresetStore } from '../store/tabPresetStore';
import { useInspectLabel } from '../utils/inspectLabels';
import { getAllPlaylists, getPlaylistItems, getAllFoldersWithVideos, getVideosInFolder, getAllStuckFolders, assignVideoToFolder, unassignVideoFromFolder, getVideoFolderAssignments, createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getFolderMetadata, getWatchHistory } from '../api/playlistApi';
import { getThumbnailUrl, extractVideoId, fetchVideoMetadata } from '../utils/youtubeUtils';
import { getFolderColorById, FOLDER_COLORS } from '../utils/folderColors';
import { THEMES } from '../utils/themes';
import AudioVisualizer from './AudioVisualizer';

const DEFAULT_ORB_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23ffffff'/%3E%3Cpath d='M0 20 L20 0 L40 20 L20 40 Z' fill='none' stroke='rgba(0,0,0,0.12)' stroke-width='1'/%3E%3C/svg%3E";

// Seeded random function for consistent random selection per page
const seededRandom = seed => {
  let hash = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
  }
  return Math.abs(hash) % 10000 / 10000;
};

// Use folder colors from the app's folder system
const COLORS = FOLDER_COLORS.map(color => ({
  hex: color.hex,
  name: color.name,
  id: color.id
}));

// White icon with black outline (no circle) - use as wrapper style for toolbar icons
const ICON_WHITE_OUTLINE = {
  display: 'inline-flex',
  color: 'white',
  filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)'
};

// Badge text: white with black outline (no bubble container)
const BADGE_TEXT_STYLE = {
  color: 'white',
  WebkitTextStroke: '1px #000',
  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
};

// TAB_GROUPS removed - now using dynamic tabs and presets from stores

export default function PlayerController({
  onPlaylistSelect,
  onVideoSelect,
  activePlayer = 1,
  onActivePlayerChange,
  secondPlayerVideoUrl = null,
  secondPlayerVideoIndex = 0,
  onSecondPlayerVideoIndexChange,
  secondPlayerPlaylistId = null,
  secondPlayerPlaylistItems = [],
  currentThemeId = 'blue',
  onThemeChange
}) {
  const fileInputRef = useRef(null);
  const playButtonRightClickRef = useRef(0); // Track right clicks for double-click detection
  const pinLongPressTimerRef = useRef(null); // Track long press for pin button
  const lastPinClickTimeRef = useRef(0); // Track clicks for double-click detection on pin button
  const hoverTimerRef = useRef(null);
  const playlistTitleRef = useRef(null); // Ref for playlist title element

  // Store hooks
  const {
    allPlaylists,
    currentPlaylistIndex,
    currentPlaylistItems,
    currentPlaylistId,
    navigationItems,
    currentNavigationIndex,
    currentFolder,
    setAllPlaylists,
    buildNavigationItems,
    setNavigationItems,
    setPlaylistItems,
    setCurrentFolder,
    nextVideo,
    previousVideo,
    nextPlaylist,
    previousPlaylist,
    shufflePlaylist,
    setCurrentVideoIndex,
    getCurrentVideo,
    previewPlaylistItems: storePreviewItems,
    previewPlaylistId: storePreviewPlaylistId,
    previewFolderInfo: storePreviewFolderInfo,
    clearPreview,
    currentPlaylistTitle
  } = usePlaylistStore();
  const {
    currentPage,
    setCurrentPage
  } = useNavigationStore();
  const {
    pinnedVideos,
    togglePriorityPin,
    removePin,
    isPriorityPin,
    isPinned,
    isFollowerPin,
    togglePin
  } = usePinStore();
  const {
    viewMode,
    setViewMode,
    inspectMode,
    toggleMenuQuarterMode,
    menuQuarterMode,
    showDebugBounds,
    toggleDebugBounds,
    toggleInspectMode,
    showRuler,
    toggleRuler,
    showDevToolbar,
    toggleDevToolbar,
    setFullscreenInfoBlanked
  } = useLayoutStore();
  const {
    showColoredFolders
  } = useFolderStore();
  const {
    tabs,
    activeTabId,
    setActiveTab
  } = useTabStore();
  const {
    presets,
    activePresetId,
    setActivePreset
  } = useTabPresetStore();
  const {
    groups,
    getGroupIdsForPlaylist,
    activeGroupId,
    setActiveGroupId,
    activePage
  } = usePlaylistGroupStore();

  // Ensure tabs and presets are arrays
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  const safePresets = Array.isArray(presets) ? presets : [];

  // Helper to get inspect label
  const getInspectTitle = label => inspectMode ? label : undefined;

  // Load all playlists and folders on mount and when showColoredFolders changes
  // Initial load of playlists
  useEffect(() => {
    const initPlaylists = async () => {
      try {
        const playlists = await getAllPlaylists();
        setAllPlaylists(playlists || []);
      } catch (error) {
        console.error('Failed to init playlists:', error);
      }
    };
    initPlaylists();
  }, [setAllPlaylists]);

  // Build navigation items when state changes
  useEffect(() => {
    const buildNav = async () => {
      try {
        let playlists = allPlaylists;
        console.log('[DEBUG_EXT] Building Navigation Items. Sources:', {
          allPlaylistsCount: allPlaylists?.length,
          activeTabId: activeTabId,
          showColoredFolders: showColoredFolders
        });

        // Filter playlists based on active tab
        if (activeTabId !== 'all') {
          const activeTab = tabs.find(t => t.id === activeTabId);
          if (activeTab && Array.isArray(playlists)) {
            const allowedIds = new Set(activeTab.playlistIds);
            playlists = playlists.filter(p => allowedIds.has(p.id));
            console.log('[DEBUG_EXT] Filtered by Tab:', {
              tabName: activeTab.name,
              filteredCount: playlists.length
            });
          }
        }
        // Explorer Page Awareness: Restrict navigation to current Hub page if not viewing a specific carousel
        if (!activeGroupId && Array.isArray(playlists)) {
          playlists = playlists.filter(p => {
            const groupIds = getGroupIdsForPlaylist(p.id);
            if (activePage === 1) {
              // Page 1: Playlists in P1 groups + Unsorted (no group)
              if (groupIds.length === 0) return true;
              return groupIds.some(gid => {
                const group = groups.find(g => g.id === gid);
                return group && (group.page || 1) === 1;
              });
            } else {
              // Page 2+: Only playlists assigned to carousels on this page
              return groupIds.some(gid => {
                const group = groups.find(g => g.id === gid);
                return group && (group.page || 1) === activePage;
              });
            }
          });
        }

        // Restrict to current group carousel when activeGroupId is set (playlist nav = group range)
        if (activeGroupId && Array.isArray(playlists)) {
          const group = groups.find(g => g.id === activeGroupId);
          if (group && group.playlistIds && group.playlistIds.length > 0) {
            const idSet = new Set(group.playlistIds.map(Number));
            playlists = playlists.filter(p => idSet.has(Number(p.id)));
            const orderMap = new Map(group.playlistIds.map((id, i) => [Number(id), i]));
            playlists = [...playlists].sort((a, b) => (orderMap.get(Number(a.id)) ?? 999) - (orderMap.get(Number(b.id)) ?? 999));
            console.log('[DEBUG_EXT] Filtered by Group:', {
              groupName: group.name,
              filteredCount: playlists.length
            });
          }
        }

        // Load folders: stuck folders always, plus all folders if toggle is on
        const foldersToInclude = [];

        // Always include stuck folders
        try {
          const stuckFolders = await getAllStuckFolders();
          const stuckSet = new Set(stuckFolders.map(([playlistId, folderColor]) => `${playlistId}:${folderColor}`));

          // Get all folders to find stuck ones
          const allFoldersData = await getAllFoldersWithVideos();
          allFoldersData.forEach(folder => {
            const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
            if (stuckSet.has(folderKey)) {
              // Only include stuck folder if its playlist is visible (filtered)
              if (playlists.find(p => p.id === folder.playlist_id)) {
                foldersToInclude.push(folder);
              }
            }
          });
        } catch (error) {
          console.error('Failed to load stuck folders:', error);
        }

        // If showColoredFolders is on, include all folders (but avoid duplicates)
        if (showColoredFolders) {
          try {
            const allFoldersData = await getAllFoldersWithVideos();
            const existingKeys = new Set(foldersToInclude.map(f => `${f.playlist_id}:${f.folder_color}`));
            allFoldersData.forEach(folder => {
              const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
              // Only include folder if its playlist is visible (filtered)
              const parentVisible = playlists.find(p => p.id === folder.playlist_id);
              if (parentVisible && !existingKeys.has(folderKey)) {
                foldersToInclude.push(folder);
              }
            });
          } catch (error) {
            console.error('Failed to load all folders:', error);
          }
        }

        // Build hierarchical navigation: playlists with their folders interleaved
        const navItems = buildNavigationItems(playlists || [], foldersToInclude);
        console.log('[DEBUG_EXT] Final Navigation Items:', {
          count: navItems.length,
          firstFive: navItems.slice(0, 5).map(i => i.type === 'playlist' ? i.data.name : `Folder: ${i.data.folder_color}`),
          lastItem: navItems.length > 0 ? navItems[navItems.length - 1].type === 'playlist' ? navItems[navItems.length - 1].data.name : 'Folder' : 'None'
        });
        setNavigationItems(navItems);
      } catch (error) {
        console.error('Failed to build navigation items:', error);
      }
    };
    buildNav();
  }, [allPlaylists, buildNavigationItems, setNavigationItems, showColoredFolders, activeTabId, tabs, activeGroupId, groups, activePage]);

  // --- UI State ---
  const [showPins, setShowPins] = useState(true);
  const [previewPinIndex, setPreviewPinIndex] = useState(null);
  const [previewTabImage, setPreviewTabImage] = useState(null);
  const [activePin, setActivePin] = useState(null);
  const [activeLeftPin, setActiveLeftPin] = useState(null); // Will be set based on active mode
  const [activeHeaderMode, setActiveHeaderMode] = useState('info'); // Start with playlist title 
  const [isModeLeft, setIsModeLeft] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false); // Tooltip popup state
  const [showPreviewMenus, setShowPreviewMenus] = useState(true); // Default to true based on user request "toggle visibility... with [options]" implies options are main focus, but need to hide/show something? Actually request says "toggle visibility OF the top right menu" - ok so we need a state for the menu itself?
  // Wait, the request is: "add an option to toggle visibility of the top right menu with 'full, half, quarter, menu q, debug, inspect, ruler, menu' buttons"
  // This likely means: INSIDE the existing 3-dot menu (More options), adding these toggles.
  // OR it means adding a button to toggle a NEW menu that contains these?
  // Reference @atlas/advanced-player-controller.md implies the 3-dot menu is the place for "More options".
  // So I will populate the EXISTING 3-dot menu `isMoreMenuOpen` with these new items. 

  // Sync internal mode with external activePlayer prop
  React.useEffect(() => {
    if (onActivePlayerChange) {
      setIsModeLeft(activePlayer === 1);
    }
  }, [activePlayer, onActivePlayerChange]);
  const handleAddClipboardToQuickVideos = async (playImmediately = false) => {
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

      // Find or create "Quick Videos" playlist for current page
      let targetPlaylistId;
      const quickVideosName = activePage === 1 ? 'Quick Videos' : `Quick Videos ${activePage}`;
      const quickVideosPlaylist = allPlaylists.find(p => p.name === quickVideosName);

      if (quickVideosPlaylist) {
        targetPlaylistId = quickVideosPlaylist.id;
      } else {
        targetPlaylistId = await createPlaylist(quickVideosName, `Quickly added videos from clipboard for Page ${activePage}`);
        const updatedPlaylists = await getAllPlaylists();
        setAllPlaylists(updatedPlaylists || []);
      }

      // Fetch metadata
      const tempTitle = `Quick Video ${videoId}`;
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

      // Add video to playlist
      await addVideoToPlaylist(targetPlaylistId, text, videoId, finalTitle, finalThumbnailUrl, authorName, viewCountStr, pubAt, false,
        // isLocal
        null,
        // profileImageUrl
        durSecs, desc, tagsStr);
      console.log(`Added ${finalTitle} to Quick Videos`);
      setIsAddMenuOpen(false);

      const items = await getPlaylistItems(targetPlaylistId);
      if (currentPlaylistId === targetPlaylistId) {
        setPlaylistItems(items, targetPlaylistId);
      }

      if (playImmediately) {
        const newVideo = items.find(v => v.video_id === videoId) || items[items.length - 1];
        if (newVideo) {
          if (currentPlaylistId !== targetPlaylistId) {
            setPlaylistItems(items, targetPlaylistId);
            if (onPlaylistSelect) {
              onPlaylistSelect(items, targetPlaylistId);
            }
          }
          if (onVideoSelect) {
            onVideoSelect(newVideo.video_url);
          }
        }
      }
    } catch (err) {
      console.error('Failed to add clipboard to quick videos:', err);
    }
  };

  const handleAddClipboardToCurrentPlaylist = async (playImmediately = false) => {
    try {
      if (!currentPlaylistId) {
        console.warn("No active playlist selected to add to.");
        return;
      }
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

      await addVideoToPlaylist(currentPlaylistId, text, videoId, finalTitle, finalThumbnailUrl, authorName, viewCountStr, pubAt, false, null, durSecs, desc, tagsStr);
      console.log(`Added ${finalTitle} to current playlist`);
      setIsAddMenuOpen(false);

      const items = await getPlaylistItems(currentPlaylistId);
      setPlaylistItems(items, currentPlaylistId);

      if (playImmediately) {
        const newVideo = items.find(v => v.video_id === videoId) || items[items.length - 1];
        if (newVideo && onVideoSelect) {
          onVideoSelect(newVideo.video_url);
        }
      }
    } catch (err) {
      console.error('Failed to add clipboard to current playlist:', err);
    }
  };

  const handleAddClipboardToTargetPlaylist = async (targetPlaylistId, playImmediately = false) => {
    try {
      if (!targetPlaylistId) return;
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

      await addVideoToPlaylist(targetPlaylistId, text, videoId, finalTitle, finalThumbnailUrl, authorName, viewCountStr, pubAt, false, null, durSecs, desc, tagsStr);
      console.log(`Added ${finalTitle} to target playlist ${targetPlaylistId}`);
      setIsAddMenuOpen(false);

      const items = await getPlaylistItems(targetPlaylistId);
      if (currentPlaylistId === targetPlaylistId) {
        setPlaylistItems(items, targetPlaylistId);
      }

      if (playImmediately) {
        const newVideo = items.find(v => v.video_id === videoId) || items[items.length - 1];
        if (newVideo) {
          if (currentPlaylistId !== targetPlaylistId) {
            setPlaylistItems(items, targetPlaylistId);
            if (onPlaylistSelect) {
              onPlaylistSelect(items, targetPlaylistId);
            }
          }
          if (onVideoSelect) {
            onVideoSelect(newVideo.video_url);
          }
        }
      }
    } catch (err) {
      console.error('Failed to add clipboard to target playlist:', err);
    }
  };



  // Handle mode toggle - update external state
  const handleModeToggle = () => {
    const newMode = !isModeLeft;
    setIsModeLeft(newMode);
    if (onActivePlayerChange) {
      onActivePlayerChange(newMode ? 1 : 2);
    }
  };
  const [playlistCheckpoint, setPlaylistCheckpoint] = useState(null);
  const [videoCheckpoint, setVideoCheckpoint] = useState(null);
  const [activeNavButton, setActiveNavButton] = useState('grid');
  const [isQueueModeOpen, setIsQueueModeOpen] = useState(false);
  const {
    queue,
    removeFromQueue
  } = useQueueStore();
  // Preview states - track what we're previewing without actually changing the player
  const [previewNavigationIndex, setPreviewNavigationIndex] = useState(null);
  const [previewVideoIndex, setPreviewVideoIndex] = useState(null);
  const [previewPlaylistId, setPreviewPlaylistId] = useState(null);
  const [previewFolderInfo, setPreviewFolderInfo] = useState(null);
  const [previewPlaylistItems, setPreviewPlaylistItems] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [hoveredColorName, setHoveredColorName] = useState(null);
  const [starColor, setStarColor] = useState('#0ea5e9');
  const [currentVideoFolders, setCurrentVideoFolders] = useState([]); // Current video's folder assignments
  const [currentVideoFolderNames, setCurrentVideoFolderNames] = useState({}); // Map of folderId -> customName
  const [shuffleColor, setShuffleColor] = useState('#6366f1');
  const [likeColor, setLikeColor] = useState('#0ea5e9');
  const [likesPlaylistId, setLikesPlaylistId] = useState(null); // ID of the special "Likes" playlist
  const [isVideoLiked, setIsVideoLiked] = useState(false); // Whether current video is liked
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfigOnRight, setIsConfigOnRight] = useState(false);
  const [isAdjustingImage, setIsAdjustingImage] = useState(false);
  const [isVisualizerEnabled, setIsVisualizerEnabled] = useState(false);
  const [showViewCount, setShowViewCount] = useState(true); // Toggle between view count and publish year
  const [metadataOpacity, setMetadataOpacity] = useState(1); // For fade animation

  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyStateRef = useRef({
    stack: [],
    index: 0
  });
  const isHistoryNavRef = useRef(false);
  useEffect(() => {
    historyStateRef.current = {
      stack: historyStack,
      index: historyIndex
    };
  }, [historyStack, historyIndex]);

  // Load visualizer enabled state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('visualizerEnabled');
      if (saved !== null) {
        setIsVisualizerEnabled(saved === 'true');
      }
    } catch (error) {
      console.error('Failed to load visualizer state from localStorage:', error);
    }
  }, []);

  // Save visualizer enabled state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('visualizerEnabled', isVisualizerEnabled.toString());
    } catch (error) {
      console.error('Failed to save visualizer state to localStorage:', error);
    }
  }, [isVisualizerEnabled]);

  // Attach right-click handler to playlist title using ref
  useEffect(() => {
    const titleElement = playlistTitleRef.current;
    if (!titleElement) return;
    const handleRightClick = e => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Mega shuffle triggered via addEventListener');
      handleShufflePlaylist();
    };
    const handleMouseDown = e => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mega shuffle triggered via mousedown addEventListener');
        handleShufflePlaylist();
      }
    };
    titleElement.addEventListener('contextmenu', handleRightClick, true); // Use capture phase
    titleElement.addEventListener('mousedown', handleMouseDown, true); // Use capture phase

    return () => {
      titleElement.removeEventListener('contextmenu', handleRightClick, true);
      titleElement.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, []); // Empty deps - handleShufflePlaylist is stable

  // Initialize active pin based on current mode
  useEffect(() => {
    if (activeHeaderMode === 'tabs' && safeTabs.length > 0 && (activeLeftPin === null || !safeTabs.find(t => t.id === activeLeftPin))) {
      setActiveLeftPin(activeTabId || safeTabs[0].id);
    } else if (activeHeaderMode === 'presets' && safePresets.length > 0 && (activeLeftPin === null || !safePresets.find(p => p.id === activeLeftPin))) {
      setActiveLeftPin(activePresetId || safePresets[0].id);
    }
  }, [activeHeaderMode, safeTabs, safePresets, activeTabId, activePresetId, activeLeftPin]);

  // Debug: Log tabs and presets
  useEffect(() => {
    console.log('PlayerController - Tabs:', safeTabs);
    console.log('PlayerController - Presets:', safePresets);
    console.log('PlayerController - Active Header Mode:', activeHeaderMode);
    console.log('PlayerController - Tabs length:', safeTabs.length);
    console.log('PlayerController - Presets length:', safePresets.length);
  }, [safeTabs, safePresets, activeHeaderMode]);

  // Get current playlist/folder info (use preview if in preview mode)
  const displayNavIndex = previewNavigationIndex !== null ? previewNavigationIndex : currentNavigationIndex;
  const currentNavItem = displayNavIndex >= 0 && navigationItems[displayNavIndex] ? navigationItems[displayNavIndex] : null;
  const currentPlaylist = currentNavItem && currentNavItem.type === 'playlist' ? currentNavItem.data : currentPlaylistId ? allPlaylists.find(p => p.id === currentPlaylistId) : null;

  // Get current video first
  const currentVideo = getCurrentVideo();

  // Load current video's folder assignments - use active video (main or second player)
  useEffect(() => {
    const loadVideoFolders = async () => {
      // Use activeVideoItem which is computed above, but we need to wait for it to be set
      // So we'll compute it here again or use a ref. For now, compute inline.
      const hasSecondPlayerVideo = !isModeLeft && secondPlayerVideoUrl;
      let targetVideo = currentVideo;
      let targetPlaylistId = currentPlaylistId;
      if (hasSecondPlayerVideo) {
        // Mode is 2 (second player) - use second player's video and playlist
        if (secondPlayerPlaylistItems.length > 0 && secondPlayerVideoIndex >= 0 && secondPlayerVideoIndex < secondPlayerPlaylistItems.length) {
          const videoByIndex = secondPlayerPlaylistItems[secondPlayerVideoIndex];
          if (videoByIndex && videoByIndex.video_url === secondPlayerVideoUrl) {
            targetVideo = videoByIndex;
            targetPlaylistId = secondPlayerPlaylistId || currentPlaylistId;
          } else {
            const secondPlayerVideo = secondPlayerPlaylistItems.find(item => item.video_url === secondPlayerVideoUrl);
            if (secondPlayerVideo) {
              targetVideo = secondPlayerVideo;
              targetPlaylistId = secondPlayerPlaylistId || currentPlaylistId;
            }
          }
        } else {
          // Try to find in current playlist as fallback
          const fallbackVideo = currentPlaylistItems.find(item => item.video_url === secondPlayerVideoUrl);
          if (fallbackVideo) {
            targetVideo = fallbackVideo;
            // Keep currentPlaylistId for fallback
          }
        }
      }
      if (targetVideo && targetPlaylistId && targetVideo.id) {
        try {
          const folders = await getVideoFolderAssignments(targetPlaylistId, targetVideo.id);
          const safeFolders = folders || [];
          setCurrentVideoFolders(safeFolders);

          // Fetch custom names for these folders
          const namesMap = {};
          await Promise.all(safeFolders.map(async folderId => {
            try {
              const metadata = await getFolderMetadata(targetPlaylistId, folderId);
              if (metadata && metadata[0]) {
                namesMap[folderId] = metadata[0];
              }
            } catch (err) {
              // Ignore errors, will fall back to default color name
            }
          }));
          setCurrentVideoFolderNames(namesMap);
        } catch (error) {
          console.error('Failed to load video folder assignments:', error);
          setCurrentVideoFolders([]);
          setCurrentVideoFolderNames({});
        }
      } else {
        setCurrentVideoFolders([]);
        setCurrentVideoFolderNames({});
      }
    };
    loadVideoFolders();
  }, [currentVideo, currentPlaylistId, isModeLeft, secondPlayerVideoUrl, secondPlayerPlaylistItems, secondPlayerVideoIndex, secondPlayerPlaylistId, currentPlaylistItems]);

  // Initialize or get "Likes" playlist
  useEffect(() => {
    const initLikesPlaylist = async () => {
      try {
        const playlists = await getAllPlaylists();
        let likesPlaylist = playlists.find(p => p.name === 'Likes');
        if (!likesPlaylist) {
          // Create "Likes" playlist if it doesn't exist
          const newPlaylistId = await createPlaylist('Likes', 'Videos you have liked');
          setLikesPlaylistId(newPlaylistId);
        } else {
          setLikesPlaylistId(likesPlaylist.id);
        }
      } catch (error) {
        console.error('Failed to initialize Likes playlist:', error);
      }
    };
    initLikesPlaylist();
  }, []);

  // Check if current video is liked - use active video (main or second player)
  useEffect(() => {
    const checkIfLiked = async () => {
      // Use activeVideoItem which is computed above, but we need to wait for it to be set
      // So we'll compute it here again or use a ref. For now, compute inline.
      const hasSecondPlayerVideo = !isModeLeft && secondPlayerVideoUrl;
      let targetVideo = currentVideo;
      if (hasSecondPlayerVideo) {
        // Mode is 2 (second player) - use second player's video
        if (secondPlayerPlaylistItems.length > 0 && secondPlayerVideoIndex >= 0 && secondPlayerVideoIndex < secondPlayerPlaylistItems.length) {
          const videoByIndex = secondPlayerPlaylistItems[secondPlayerVideoIndex];
          if (videoByIndex && videoByIndex.video_url === secondPlayerVideoUrl) {
            targetVideo = videoByIndex;
          } else {
            const secondPlayerVideo = secondPlayerPlaylistItems.find(item => item.video_url === secondPlayerVideoUrl);
            if (secondPlayerVideo) {
              targetVideo = secondPlayerVideo;
            }
          }
        } else {
          // Try to find in current playlist as fallback
          const fallbackVideo = currentPlaylistItems.find(item => item.video_url === secondPlayerVideoUrl);
          if (fallbackVideo) {
            targetVideo = fallbackVideo;
          }
        }
      }
      if (!targetVideo || !likesPlaylistId) {
        setIsVideoLiked(false);
        return;
      }
      try {
        const likesItems = await getPlaylistItems(likesPlaylistId);
        const isLiked = likesItems.some(item => item.video_id === targetVideo.video_id);
        setIsVideoLiked(isLiked);
      } catch (error) {
        console.error('Failed to check if video is liked:', error);
        setIsVideoLiked(false);
      }
    };
    checkIfLiked();
  }, [currentVideo, likesPlaylistId, isModeLeft, secondPlayerVideoUrl, secondPlayerPlaylistItems, secondPlayerVideoIndex, currentPlaylistItems]);

  // Use store preview if available, otherwise use local preview, otherwise current video
  const activePreviewItems = storePreviewItems || previewPlaylistItems;
  const activePreviewPlaylistId = storePreviewPlaylistId || previewPlaylistId;
  const activePreviewFolderInfo = storePreviewFolderInfo || previewFolderInfo;

  // Determine which video to display based on active player mode
  // If mode is 2 (second player), use second player's video, otherwise use main player's video
  // Use second player info if we have a video URL (even if playlist items aren't loaded yet)
  const hasSecondPlayerVideo = !isModeLeft && secondPlayerVideoUrl;
  // Use second player's playlist items if available, otherwise fall back to current playlist items
  const secondPlayerItems = hasSecondPlayerVideo && secondPlayerPlaylistItems.length > 0 ? secondPlayerPlaylistItems : currentPlaylistItems;

  // Determine active playlist ID - use second player's playlist when in mode 2
  const activePlaylistId = hasSecondPlayerVideo && secondPlayerPlaylistId ? secondPlayerPlaylistId : currentPlaylistId;
  let activeVideoItem = currentVideo;
  if (hasSecondPlayerVideo) {
    // Mode is 2 (second player) - prioritize using second player's playlist if available
    if (secondPlayerPlaylistItems.length > 0 && secondPlayerVideoIndex >= 0 && secondPlayerVideoIndex < secondPlayerPlaylistItems.length) {
      // Use index from second player's playlist
      const videoByIndex = secondPlayerPlaylistItems[secondPlayerVideoIndex];
      // Verify it matches the URL (in case playlist changed)
      if (videoByIndex && videoByIndex.video_url === secondPlayerVideoUrl) {
        activeVideoItem = videoByIndex;
      } else {
        // Index doesn't match URL, find by URL in second player's playlist
        const secondPlayerVideo = secondPlayerPlaylistItems.find(item => item.video_url === secondPlayerVideoUrl);
        if (secondPlayerVideo) {
          activeVideoItem = secondPlayerVideo;
        } else {
          // Not found in second player's playlist, try current playlist as fallback
          const fallbackVideo = currentPlaylistItems.find(item => item.video_url === secondPlayerVideoUrl);
          if (fallbackVideo) {
            activeVideoItem = fallbackVideo;
          }
        }
      }
    } else {
      // No second player playlist items yet, try to find in current playlist
      const secondPlayerVideo = currentPlaylistItems.find(item => item.video_url === secondPlayerVideoUrl);
      if (secondPlayerVideo) {
        activeVideoItem = secondPlayerVideo;
      }
    }
  }

  // Use preview video if in preview mode, otherwise use active video (main or second player)
  // Determine which playlist items to use based on active player mode
  const activePlaylistItems = hasSecondPlayerVideo && secondPlayerPlaylistItems.length > 0 ? secondPlayerPlaylistItems : currentPlaylistItems;
  let displayVideoIndex;
  if (previewVideoIndex !== null) {
    displayVideoIndex = previewVideoIndex;
  } else if (hasSecondPlayerVideo && secondPlayerPlaylistItems.length > 0 && secondPlayerVideoIndex >= 0 && secondPlayerVideoIndex < secondPlayerPlaylistItems.length) {
    // In second player mode with playlist loaded, use the second player's index directly
    displayVideoIndex = secondPlayerVideoIndex;
  } else if (activeVideoItem) {
    // Find index of active video in the appropriate playlist
    const foundIndex = activePlaylistItems.findIndex(v => v.id === activeVideoItem.id);
    displayVideoIndex = foundIndex >= 0 ? foundIndex : 0;
  } else {
    displayVideoIndex = 0;
  }

  // Determine displayVideoItem - prioritize second player index when in mode 2 with playlist loaded
  let displayVideoItem;
  if (previewVideoIndex !== null && currentPlaylistItems.length > 0) {
    displayVideoItem = currentPlaylistItems[displayVideoIndex];
  } else if (hasSecondPlayerVideo && secondPlayerPlaylistItems.length > 0 && secondPlayerVideoIndex >= 0 && secondPlayerVideoIndex < secondPlayerPlaylistItems.length) {
    // In second player mode with playlist loaded, use the video at the second player's index from second player's playlist
    displayVideoItem = secondPlayerPlaylistItems[secondPlayerVideoIndex];
  } else {
    // Use activeVideoItem (main player or fallback)
    displayVideoItem = activeVideoItem;
  }

  // Get playlist image - use active video thumbnail (main or second player) instead of playlist thumbnail
  const playlistImage = activeVideoItem?.thumbnail_url ? activeVideoItem.thumbnail_url : displayVideoItem?.thumbnail_url ? displayVideoItem.thumbnail_url : DEFAULT_ORB_IMAGE;

  // Get playlist/folder title (show preview if in preview mode)
  // If store preview is active, show preview playlist name
  // In second player mode, show second player's playlist name

  // History Navigation Hooks
  useEffect(() => {
    getWatchHistory(6).then(data => {
      if (data && data.length > 0) {
        const stack = data.map(item => item.video_url).filter(Boolean);
        setHistoryStack(stack);
        setHistoryIndex(0);
        historyStateRef.current = {
          stack,
          index: 0
        };
      }
    }).catch(err => console.error("Failed to load initial watch history", err));
  }, []);
  useEffect(() => {
    if (activeVideoItem && activeVideoItem.video_url) {
      if (isHistoryNavRef.current) {
        isHistoryNavRef.current = false;
        return;
      }
      const url = activeVideoItem.video_url;
      const {
        stack,
        index
      } = historyStateRef.current;
      if (stack[index] === url) {
        return;
      }
      const newStack = [url, ...stack.slice(index)].slice(0, 6);
      setHistoryStack(newStack);
      setHistoryIndex(0);
    }
  }, [activeVideoItem?.video_url]);

  // --- Handlers ---
  const handleHistoryBack = () => {
    const {
      stack,
      index
    } = historyStateRef.current;
    if (index < stack.length - 1 && index < 5) {
      isHistoryNavRef.current = true;
      const nextIndex = index + 1;
      setHistoryIndex(nextIndex);
      const videoToPlay = stack[nextIndex];
      if (videoToPlay && onVideoSelect) {
        onVideoSelect(videoToPlay);
      }
    }
  };
  const handleHistoryForward = () => {
    const {
      stack,
      index
    } = historyStateRef.current;
    if (index > 0) {
      isHistoryNavRef.current = true;
      const prevIndex = index - 1;
      setHistoryIndex(prevIndex);
      const videoToPlay = stack[prevIndex];
      if (videoToPlay && onVideoSelect) {
        onVideoSelect(videoToPlay);
      }
    }
  };
  const handleHistoryRightClick = e => {
    e.preventDefault();
    handleHistoryBack();
  };
  const handleNextVideo = () => {
    // Route to appropriate player based on active mode
    if (isModeLeft) {
      // Control main player (player 1)
      nextVideo();
      const state = usePlaylistStore.getState();
      const video = state.getCurrentVideo();
      if (video && onVideoSelect) {
        onVideoSelect(video.video_url);
      }
    } else {
      // Control second player (player 2) - navigate within second player's playlist without affecting main player
      // Only navigate if there's actually a second player video loaded
      if (secondPlayerVideoUrl && secondPlayerPlaylistItems.length > 0 && onSecondPlayerVideoIndexChange) {
        const nextIndex = (secondPlayerVideoIndex + 1) % secondPlayerPlaylistItems.length;
        onSecondPlayerVideoIndexChange(nextIndex);
        const nextVideo = secondPlayerPlaylistItems[nextIndex];
        if (nextVideo && onVideoSelect) {
          onVideoSelect(nextVideo.video_url); // This will route to second player via handleVideoSelect in App.jsx
        }
      }
    }
  };
  const handlePrevVideo = () => {
    // Route to appropriate player based on active mode
    if (isModeLeft) {
      // Control main player (player 1)
      previousVideo();
      const state = usePlaylistStore.getState();
      const video = state.getCurrentVideo();
      if (video && onVideoSelect) {
        onVideoSelect(video.video_url);
      }
    } else {
      // Control second player (player 2) - navigate within second player's playlist without affecting main player
      // Only navigate if there's actually a second player video loaded
      if (secondPlayerVideoUrl && secondPlayerPlaylistItems.length > 0 && onSecondPlayerVideoIndexChange) {
        const prevIndex = secondPlayerVideoIndex <= 0 ? secondPlayerPlaylistItems.length - 1 : secondPlayerVideoIndex - 1;
        onSecondPlayerVideoIndexChange(prevIndex);
        const prevVideo = secondPlayerPlaylistItems[prevIndex];
        if (prevVideo && onVideoSelect) {
          onVideoSelect(prevVideo.video_url); // This will route to second player via handleVideoSelect in App.jsx
        }
      }
    }
  };

  // Handle playlist navigation
  const handleNextPlaylist = async () => {
    const result = nextPlaylist();
    if (!result) return;
    if (result.type === 'playlist') {
      const playlist = result.data;
      if (!playlist) return;
      try {
        const items = await getPlaylistItems(playlist.id);
        // Use playlist name from navigation item to ensure title consistency
        setPlaylistItems(items, playlist.id, null, playlist.name);

        // Sync orb/banner navigation IDs so theme follows player
        setOrbNavPlaylistId(playlist.id);
        setBannerNavPlaylistId(playlist.id);

        if (onPlaylistSelect) {
          onPlaylistSelect(items, playlist.id);
        }
        if (items.length > 0 && onVideoSelect) {
          const lastIndex = localStorage.getItem(`last_video_index_${playlist.id}`);
          const videoIndex = lastIndex && parseInt(lastIndex, 10) < items.length ? parseInt(lastIndex, 10) : 0;
          onVideoSelect(items[videoIndex].video_url);
        }
      } catch (error) {
        console.error('Failed to load playlist items:', error);
      }
    } else if (result.type === 'folder') {
      const folder = result.data;
      if (!folder) return;
      try {
        const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
        if (items.length === 0) {
          console.warn(`Folder ${folder.folder_color} in playlist ${folder.playlist_id} has no videos`);
          return;
        }
        setPlaylistItems(items, folder.playlist_id, {
          playlist_id: folder.playlist_id,
          folder_color: folder.folder_color
        });

        // Sync orb/banner navigation IDs so theme follows player
        setOrbNavPlaylistId(folder.playlist_id);
        setBannerNavPlaylistId(folder.playlist_id);

        if (onPlaylistSelect) {
          onPlaylistSelect(items, folder.playlist_id);
        }
        const folderKey = `last_video_index_${folder.playlist_id}_${folder.folder_color}`;
        const lastIndex = localStorage.getItem(folderKey);
        const videoIndex = lastIndex && parseInt(lastIndex, 10) < items.length ? parseInt(lastIndex, 10) : 0;
        if (onVideoSelect && items[videoIndex]) {
          onVideoSelect(items[videoIndex].video_url);
        }
      } catch (error) {
        console.error('Failed to load folder items:', error);
      }
    }
  };
  const handlePreviousPlaylist = async () => {
    const result = previousPlaylist();
    if (!result) return;
    if (result.type === 'playlist') {
      const playlist = result.data;
      if (!playlist) return;
      try {
        const items = await getPlaylistItems(playlist.id);
        // Use playlist name from navigation item to ensure title consistency
        setPlaylistItems(items, playlist.id, null, playlist.name);

        // Sync orb/banner navigation IDs so theme follows player
        setOrbNavPlaylistId(playlist.id);
        setBannerNavPlaylistId(playlist.id);

        if (onPlaylistSelect) {
          onPlaylistSelect(items, playlist.id);
        }
        if (items.length > 0 && onVideoSelect) {
          const lastIndex = localStorage.getItem(`last_video_index_${playlist.id}`);
          const videoIndex = lastIndex && parseInt(lastIndex, 10) < items.length ? parseInt(lastIndex, 10) : 0;
          onVideoSelect(items[videoIndex].video_url);
        }
      } catch (error) {
        console.error('Failed to load playlist items:', error);
      }
    } else if (result.type === 'folder') {
      const folder = result.data;
      if (!folder) return;
      try {
        const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
        if (items.length === 0) {
          console.warn(`Folder ${folder.folder_color} in playlist ${folder.playlist_id} has no videos`);
          return;
        }
        setPlaylistItems(items, folder.playlist_id, {
          playlist_id: folder.playlist_id,
          folder_color: folder.folder_color
        });

        // Sync orb/banner navigation IDs so theme follows player
        setOrbNavPlaylistId(folder.playlist_id);
        setBannerNavPlaylistId(folder.playlist_id);

        if (onPlaylistSelect) {
          onPlaylistSelect(items, folder.playlist_id);
        }
        const folderKey = `last_video_index_${folder.playlist_id}_${folder.folder_color}`;
        const lastIndex = localStorage.getItem(folderKey);
        const videoIndex = lastIndex && parseInt(lastIndex, 10) < items.length ? parseInt(lastIndex, 10) : 0;
        if (onVideoSelect && items[videoIndex]) {
          onVideoSelect(items[videoIndex].video_url);
        }
      } catch (error) {
        console.error('Failed to load folder items:', error);
      }
    }
  };

  // Handle shuffle - shuffle from specific folder or all videos
  const handleShuffle = async (folderColorId = null) => {
    const colorToUse = folderColorId || quickShuffleColor;
    try {
      let videosToShuffle = [];
      let playlistIdToUse;
      if (isModeLeft) {
        // Control main player (player 1) - use current playlist
        playlistIdToUse = currentPlaylistId;
        if (colorToUse === 'all') {
          videosToShuffle = currentPlaylistItems;
        } else if (currentPlaylistId) {
          videosToShuffle = await getVideosInFolder(currentPlaylistId, colorToUse);
        }
      } else {
        // Control second player (player 2) - use second player's playlist
        playlistIdToUse = secondPlayerPlaylistId || currentPlaylistId;
        const secondPlayerItems = secondPlayerPlaylistItems.length > 0 ? secondPlayerPlaylistItems : currentPlaylistItems;
        if (colorToUse === 'all') {
          videosToShuffle = secondPlayerItems;
        } else if (playlistIdToUse) {
          videosToShuffle = await getVideosInFolder(playlistIdToUse, colorToUse);
        }
      }
      if (videosToShuffle.length === 0) {
        console.warn('No videos found to shuffle');
        return;
      }

      // Pick a random video
      const randomIndex = Math.floor(Math.random() * videosToShuffle.length);
      const randomVideo = videosToShuffle[randomIndex];
      if (randomVideo && onVideoSelect) {
        if (isModeLeft) {
          // Control main player (player 1)
          const videoIndex = currentPlaylistItems.findIndex(v => v.id === randomVideo.id);
          if (videoIndex >= 0) {
            setCurrentVideoIndex(videoIndex);
          }
          onVideoSelect(randomVideo.video_url);
        } else {
          // Control second player (player 2) - shuffle within second player's playlist
          // Only shuffle if there's actually a second player video loaded
          if (secondPlayerVideoUrl && secondPlayerPlaylistItems.length > 0) {
            const videoIndex = secondPlayerPlaylistItems.findIndex(v => v.id === randomVideo.id);
            if (videoIndex >= 0 && onSecondPlayerVideoIndexChange) {
              onSecondPlayerVideoIndexChange(videoIndex);
            }
            onVideoSelect(randomVideo.video_url); // This will route to second player via handleVideoSelect in App.jsx
          }
        }
      }
    } catch (error) {
      console.error('Failed to shuffle video:', error);
    }
  };

  // Handle shuffling to a random playlist
  const handleShufflePlaylist = async () => {
    try {
      if (allPlaylists.length === 0) {
        console.warn('No playlists available to shuffle');
        return;
      }

      // Pick random playlist
      const randomPlaylistIndex = Math.floor(Math.random() * allPlaylists.length);
      const randomPlaylist = allPlaylists[randomPlaylistIndex];

      // Load items
      const items = await getPlaylistItems(randomPlaylist.id);
      if (items.length === 0) {
        console.warn('Selected random playlist is empty');
        return;
      }

      // Set playlist items (this changes the current playlist)
      setPlaylistItems(items, randomPlaylist.id, null);
      if (onPlaylistSelect) {
        onPlaylistSelect(items, randomPlaylist.id);
      }

      // Pick random video within playlist to start
      const randomVideoIndex = Math.floor(Math.random() * items.length);
      const randomVideo = items[randomVideoIndex];
      if (randomVideo && onVideoSelect) {
        setCurrentVideoIndex(randomVideoIndex);
        onVideoSelect(randomVideo.video_url);
      }
    } catch (error) {
      console.error('Failed to shuffle to random playlist:', error);
    }
  };

  // Handle grid navigation
  const handlePlaylistsGrid = () => {
    if (currentPage === 'playlists') {
      setViewMode(viewMode === 'full' ? 'half' : 'full');
    } else {
      setCurrentPage('playlists');
      if (viewMode === 'full') {
        setFullscreenInfoBlanked(true);
        requestAnimationFrame(() => setViewMode('half'));
      }
    }
  };
  const handleVideosGrid = () => {
    // Clear any preview state to ensure we show the currently playing playlist
    if (storePreviewPlaylistId) {
      clearPreview();
    }

    // Also clear local preview if active
    if (playlistCheckpoint !== null) {
      setPreviewNavigationIndex(null);
      setPreviewPlaylistItems(null);
      setPreviewPlaylistId(null);
      setPreviewFolderInfo(null);
      setPlaylistCheckpoint(null);
    }
    if (currentPlaylistId) {
      if (currentPage === 'videos') {
        setViewMode(viewMode === 'full' ? 'half' : 'full');
      } else {
        setCurrentPage('videos');
        if (viewMode === 'full') {
          setFullscreenInfoBlanked(true);
          requestAnimationFrame(() => setViewMode('half'));
        }
      }
    }
  };

  // Handle pin click - switch to that video
  const handlePinClick = async pinnedVideo => {
    const videoIndex = currentPlaylistItems.findIndex(v => v.id === pinnedVideo.id);
    if (videoIndex >= 0) {
      setCurrentVideoIndex(videoIndex);
      if (onVideoSelect) {
        onVideoSelect(pinnedVideo.video_url);
      }
    } else {
      // Video is not in current playlist - need to load its playlist
      try {
        for (const playlist of allPlaylists) {
          const items = await getPlaylistItems(playlist.id);
          const foundIndex = items.findIndex(v => v.id === pinnedVideo.id);
          if (foundIndex >= 0) {
            setPlaylistItems(items, playlist.id);
            if (onPlaylistSelect) {
              onPlaylistSelect(items, playlist.id);
            }
            setCurrentVideoIndex(foundIndex);
            if (onVideoSelect) {
              onVideoSelect(pinnedVideo.video_url);
            }
            return;
          }
        }
        console.warn('Pinned video not found in any playlist:', pinnedVideo);
      } catch (error) {
        console.error('Failed to load playlist for pinned video:', error);
      }
    }
  };

  // Handle unpin - remove pin from track
  const handleUnpin = (e, pinnedVideo) => {
    e.stopPropagation();
    removePin(pinnedVideo.id);
  };
  const navigateTabs = dir => {
    if (activeHeaderMode === 'tabs') {
      // Navigate through tabs
      const currentIndex = safeTabs.findIndex(tab => tab.id === activeLeftPin);
      if (currentIndex === -1) {
        // If current pin not found, start with first tab
        if (safeTabs.length > 0) {
          setActiveLeftPin(safeTabs[0].id);
          setActiveTab(safeTabs[0].id);
        }
        return;
      }
      const nextIndex = dir === 'next' ? (currentIndex + 1) % safeTabs.length : (currentIndex - 1 + safeTabs.length) % safeTabs.length;
      if (safeTabs[nextIndex]) {
        setActiveLeftPin(safeTabs[nextIndex].id);
        setActiveTab(safeTabs[nextIndex].id);
      }
    } else if (activeHeaderMode === 'presets') {
      // Navigate through presets
      const currentIndex = safePresets.findIndex(preset => preset.id === activeLeftPin);
      if (currentIndex === -1) {
        // If current pin not found, start with first preset
        if (safePresets.length > 0) {
          setActiveLeftPin(safePresets[0].id);
          setActivePreset(safePresets[0].id);
        }
        return;
      }
      const nextIndex = dir === 'next' ? (currentIndex + 1) % safePresets.length : (currentIndex - 1 + safePresets.length) % safePresets.length;
      if (safePresets[nextIndex]) {
        setActiveLeftPin(safePresets[nextIndex].id);
        setActivePreset(safePresets[nextIndex].id);
      }
    }
  };

  // Direct playlist navigation (for capsule buttons - immediate navigation, not preview)
  const navigatePlaylist = dir => {
    // Menu chevrons should ALWAYS navigate the actual player
    // Theme-only browsing is handled by the chevrons on the Orb itself
    if (dir === 'up') {
      handleNextPlaylist();
    } else if (dir === 'down') {
      handlePreviousPlaylist();
    }
  };

  // Preview navigation - doesn't change actual player until confirmed
  const handleAltNav = async (direction, type) => {
    if (type === 'playlist') {
      // Initialize checkpoint if starting preview
      if (playlistCheckpoint === null) {
        setPlaylistCheckpoint(currentNavigationIndex);
        setPreviewNavigationIndex(currentNavigationIndex >= 0 ? currentNavigationIndex : 0);
      }

      // Calculate next/prev navigation index (preview only)
      const currentPreviewIndex = previewNavigationIndex !== null ? previewNavigationIndex : currentNavigationIndex >= 0 ? currentNavigationIndex : 0;
      const nextIndex = direction === 'up' ? navigationItems.length === 0 ? 0 : (currentPreviewIndex + 1) % navigationItems.length : navigationItems.length === 0 ? 0 : currentPreviewIndex <= 0 ? navigationItems.length - 1 : currentPreviewIndex - 1;
      setPreviewNavigationIndex(nextIndex);

      // Load preview playlist/folder data (but don't change actual player)
      const previewItem = navigationItems[nextIndex];
      if (!previewItem) return;
      if (previewItem.type === 'playlist') {
        try {
          const items = await getPlaylistItems(previewItem.data.id);
          setPreviewPlaylistItems(items);
          setPreviewPlaylistId(previewItem.data.id);
          setPreviewFolderInfo(null);
        } catch (error) {
          console.error('Failed to load preview playlist items:', error);
        }
      } else if (previewItem.type === 'folder') {
        try {
          const items = await getVideosInFolder(previewItem.data.playlist_id, previewItem.data.folder_color);
          setPreviewPlaylistItems(items);
          setPreviewPlaylistId(previewItem.data.playlist_id);
          setPreviewFolderInfo({
            playlist_id: previewItem.data.playlist_id,
            folder_color: previewItem.data.folder_color
          });
        } catch (error) {
          console.error('Failed to load preview folder items:', error);
        }
      }
    } else {
      // Video preview navigation
      if (videoCheckpoint === null) {
        const currentIdx = currentPlaylistItems.findIndex(v => v.id === currentVideo?.id);
        setVideoCheckpoint(currentIdx >= 0 ? currentIdx : 0);
        setPreviewVideoIndex(currentIdx >= 0 ? currentIdx : 0);
      }
      const currentPreviewIdx = previewVideoIndex !== null ? previewVideoIndex : currentPlaylistItems.findIndex(v => v.id === currentVideo?.id) || 0;
      const nextIdx = direction === 'up' ? (currentPreviewIdx + 1) % currentPlaylistItems.length : currentPreviewIdx === 0 ? currentPlaylistItems.length - 1 : currentPreviewIdx - 1;
      setPreviewVideoIndex(nextIdx);
    }
  };
  const handleRevert = type => {
    if (type === 'playlist' && playlistCheckpoint !== null) {
      // Revert to original navigation index
      setPreviewNavigationIndex(null);
      setPreviewPlaylistItems(null);
      setPreviewPlaylistId(null);
      setPreviewFolderInfo(null);
      setPlaylistCheckpoint(null);
      // Also clear store preview if it exists
      clearPreview();
    } else if (type === 'video' && videoCheckpoint !== null) {
      // Revert to original video index
      setPreviewVideoIndex(null);
      setVideoCheckpoint(null);
    }
  };
  const handleCommit = async type => {
    if (type === 'playlist' && playlistCheckpoint !== null && previewNavigationIndex !== null) {
      // Actually navigate to the previewed playlist/folder
      const previewItem = navigationItems[previewNavigationIndex];
      if (!previewItem) {
        handleRevert('playlist');
        return;
      }
      if (previewItem.type === 'playlist') {
        if (previewPlaylistItems && previewPlaylistId) {
          setPlaylistItems(previewPlaylistItems, previewPlaylistId, null);
          if (onPlaylistSelect) {
            onPlaylistSelect(previewPlaylistItems, previewPlaylistId);
          }
          if (previewPlaylistItems.length > 0 && onVideoSelect) {
            const lastIndex = localStorage.getItem(`last_video_index_${previewPlaylistId}`);
            const videoIndex = lastIndex && parseInt(lastIndex, 10) < previewPlaylistItems.length ? parseInt(lastIndex, 10) : 0;
            onVideoSelect(previewPlaylistItems[videoIndex].video_url);
          }
        }
      } else if (previewItem.type === 'folder') {
        if (previewPlaylistItems && previewFolderInfo) {
          setPlaylistItems(previewPlaylistItems, previewFolderInfo.playlist_id, previewFolderInfo);
          if (onPlaylistSelect) {
            onPlaylistSelect(previewPlaylistItems, previewFolderInfo.playlist_id);
          }
          if (previewPlaylistItems.length > 0 && onVideoSelect) {
            const folderKey = `last_video_index_${previewFolderInfo.playlist_id}_${previewFolderInfo.folder_color}`;
            const lastIndex = localStorage.getItem(folderKey);
            const videoIndex = lastIndex && parseInt(lastIndex, 10) < previewPlaylistItems.length ? parseInt(lastIndex, 10) : 0;
            if (previewPlaylistItems[videoIndex]) {
              onVideoSelect(previewPlaylistItems[videoIndex].video_url);
            }
          }
        }
      }

      // Update navigation index in store to match preview
      if (previewNavigationIndex >= 0) {
        const previewItem = navigationItems[previewNavigationIndex];
        if (previewItem) {
          if (previewItem.type === 'playlist') {
            const playlistIndex = allPlaylists.findIndex(p => p.id === previewItem.data.id);
            if (playlistIndex >= 0) {
              usePlaylistStore.setState({
                currentNavigationIndex: previewNavigationIndex,
                currentPlaylistIndex: playlistIndex,
                currentFolder: null
              });
            }
          } else {
            usePlaylistStore.setState({
              currentNavigationIndex: previewNavigationIndex,
              currentPlaylistIndex: -1,
              currentFolder: {
                playlist_id: previewItem.data.playlist_id,
                folder_color: previewItem.data.folder_color
              }
            });
          }
        }
      }

      // Clear preview state
      setPreviewNavigationIndex(null);
      setPreviewPlaylistItems(null);
      setPreviewPlaylistId(null);
      setPreviewFolderInfo(null);
      setPlaylistCheckpoint(null);
    } else if (type === 'video' && videoCheckpoint !== null && previewVideoIndex !== null) {
      // Actually navigate to the previewed video
      if (previewVideoIndex >= 0 && previewVideoIndex < currentPlaylistItems.length) {
        setCurrentVideoIndex(previewVideoIndex);
        const video = currentPlaylistItems[previewVideoIndex];
        if (video && onVideoSelect) {
          onVideoSelect(video.video_url);
        }
      }

      // Clear preview state
      setPreviewVideoIndex(null);
      setVideoCheckpoint(null);
    }
  };
  const handleToggleHeader = () => {
    setActiveHeaderMode(curr => {
      if (curr === 'primary') return 'secondary';
      if (curr === 'secondary') return 'info';
      return 'primary';
    });
  };

  // Handle star button click - assign/unassign video to folder
  const handleStarClick = async (folderColorId = null) => {
    // Get the active video (main or second player) - use activeVideoItem which is computed above
    const targetVideo = activeVideoItem || currentVideo;
    // Use activePlaylistId which is computed above
    const targetPlaylistId = activePlaylistId || currentPlaylistId;
    if (!targetVideo || !targetPlaylistId) return;
    const colorToUse = folderColorId || quickAssignColor;
    try {
      // Get current folder assignments for the target video
      const videoFolders = await getVideoFolderAssignments(targetPlaylistId, targetVideo.id);
      const isAssigned = videoFolders.includes(colorToUse);
      if (isAssigned) {
        // Unassign from folder
        await unassignVideoFromFolder(targetPlaylistId, targetVideo.id, colorToUse);
        // Update local state if this is the current video being displayed
        if (targetVideo.id === activeVideoItem?.id) {
          setCurrentVideoFolders(prev => prev.filter(c => c !== colorToUse));
        }
      } else {
        // Assign to folder
        await assignVideoToFolder(targetPlaylistId, targetVideo.id, colorToUse);
        // Update local state if this is the current video being displayed
        if (targetVideo.id === activeVideoItem?.id) {
          setCurrentVideoFolders(prev => [...prev, colorToUse]);
        }
      }

      // Close color picker if open
      if (showColorPicker === 'star') {
        setShowColorPicker(null);
        setHoveredColorName(null);
      }
    } catch (error) {
      console.error('Failed to assign/unassign video to folder:', error);
    }
  };

  // Handle first pin button click - set current video as first (leftmost) pin
  // Handle Pin Button Interactions
  const handlePinMouseDown = e => {
    if (e.button !== 0) return; // Only process main (left) clicks
    const targetVideo = activeVideoItem || currentVideo;
    if (!targetVideo) return;

    // Start long press timer (e.g., 500ms)
    pinLongPressTimerRef.current = setTimeout(() => {
      // Long Press Action: Set Priority Pin
      // Ensure we don't toggle it OFF if it's already ON
      if (!isPriorityPin(targetVideo.id)) {
        togglePriorityPin(targetVideo);
      }
      pinLongPressTimerRef.current = null; // Mark as handled
    }, 600);
  };
  const handlePinMouseUp = e => {
    if (e.button !== 0) return; // Only process main (left) clicks
    const targetVideo = activeVideoItem || currentVideo;
    if (!targetVideo) return;
    if (pinLongPressTimerRef.current) {
      // Timer still running -> Short Click
      clearTimeout(pinLongPressTimerRef.current);
      pinLongPressTimerRef.current = null;

      // Check for double-click (within 300ms)
      const now = Date.now();
      const timeSinceLastClick = now - lastPinClickTimeRef.current;
      lastPinClickTimeRef.current = now;
      const isCurrentlyPinned = isPinned(targetVideo.id) || isPriorityPin(targetVideo.id);
      if (timeSinceLastClick < 300 && isCurrentlyPinned) {
        // Double-click on pinned video → Unpin completely
        removePin(targetVideo.id);
      } else {
        // Single click → Toggle pin/follower status
        // - If unpinned → Normal pin
        // - If pinned (not follower) → Add follower modifier
        // - If follower → Remove follower modifier (keep pin)
        togglePin(targetVideo);
      }
    }
  };
  const handlePinMouseLeave = () => {
    // If mouse leaves button while holding, cancel long press
    if (pinLongPressTimerRef.current) {
      clearTimeout(pinLongPressTimerRef.current);
      pinLongPressTimerRef.current = null;
    }
  };

  // Handle play button toggle - cycle through colored folders
  const handlePlayButtonToggle = async (direction = 'forward') => {
    if (!currentPlaylistId) return;
    try {
      // Fetch fresh folder data
      const allFolders = await getAllFoldersWithVideos();
      // Filter for current playlist and ensure count > 0
      // Note: getAllFoldersWithVideos returns objects like { playlist_id, folder_color, video_count }
      const playlistFolders = allFolders.filter(f => String(f.playlist_id) === String(currentPlaylistId) && f.video_count > 0);

      // Current State
      const currentColor = currentFolder ? currentFolder.folder_color : 'all';

      // Sort playlistFolders by FOLDER_COLORS order
      const validColors = FOLDER_COLORS.map(c => c.id).filter(id => playlistFolders.some(f => f.folder_color === id));

      // Determine next color
      let nextColor = 'all';
      if (direction === 'reset') {
        nextColor = 'all';
      } else if (direction === 'forward') {
        if (currentColor === 'all') {
          if (validColors.length > 0) nextColor = validColors[0];
        } else {
          const idx = validColors.indexOf(currentColor);
          if (idx !== -1 && idx < validColors.length - 1) {
            nextColor = validColors[idx + 1];
          } else {
            nextColor = 'all';
          }
        }
      } else {
        // Reverse cycle
        if (currentColor === 'all') {
          if (validColors.length > 0) nextColor = validColors[validColors.length - 1];
        } else {
          const idx = validColors.indexOf(currentColor);
          if (idx > 0) {
            nextColor = validColors[idx - 1];
          } else {
            nextColor = 'all';
          }
        }
      }

      // Execute Transition
      let newItems = [];
      if (nextColor === 'all') {
        newItems = await getPlaylistItems(currentPlaylistId);
        setPlaylistItems(newItems, currentPlaylistId, null);
      } else {
        newItems = await getVideosInFolder(currentPlaylistId, nextColor);
        setPlaylistItems(newItems, currentPlaylistId, {
          playlist_id: currentPlaylistId,
          folder_color: nextColor
        });
      }

      // Handle auto-play logic if current video is lost
      if (newItems.length > 0) {
        const currentVideoStillExists = newItems.some(v => v.id === activeVideoItem?.id);
        if (!currentVideoStillExists) {
          // Play first video in new view
          setCurrentVideoIndex(0);
        }
      }
    } catch (error) {
      console.error('Failed to cycle play button folder:', error);
    }
  };

  // ========== Star-to-Play Color Alignment ==========
  // Right-click Star to set the Play button's folder filter to match the Star's color
  const handleStarAlignToPlay = async () => {
    // Get the color the Star is currently displaying (video's folder assignment)
    const starDisplayColor = currentVideoFolders.length > 0 ? currentVideoFolders[0] : null;
    if (!starDisplayColor) {
      console.log(`[ColorSync] Video is not in any folder - nothing to align`);
      return;
    }
    try {
      console.log(`[ColorSync] Aligning Play to Star color: ${starDisplayColor}`);
      const newItems = await getVideosInFolder(currentPlaylistId, starDisplayColor);
      if (newItems.length > 0) {
        setPlaylistItems(newItems, currentPlaylistId, {
          playlist_id: currentPlaylistId,
          folder_color: starDisplayColor
        });
        // Auto-play first video if current video is not in the new view
        const currentVideoStillExists = newItems.some(v => v.id === activeVideoItem?.id);
        if (!currentVideoStillExists) {
          setCurrentVideoIndex(0);
        }
        console.log(`[ColorSync] Play filter set to ${starDisplayColor}`);
      } else {
        console.log(`[ColorSync] No videos in ${starDisplayColor} folder`);
      }
    } catch (error) {
      console.error('Failed to align colors:', error);
    }
  };

  // Handle like button click - add/remove video from Likes playlist
  const handleLikeClick = async () => {
    // Get the active video (main or second player) - use activeVideoItem which is computed above
    const targetVideo = activeVideoItem || currentVideo;
    if (!targetVideo || !likesPlaylistId) return;
    try {
      // Check if target video is liked
      const likesItems = await getPlaylistItems(likesPlaylistId);
      const targetIsLiked = likesItems.some(item => item.video_id === targetVideo.video_id);
      if (targetIsLiked) {
        // Remove from Likes playlist
        const likeItem = likesItems.find(item => item.video_id === targetVideo.video_id);
        if (likeItem) {
          await removeVideoFromPlaylist(likesPlaylistId, likeItem.id);
          // Update local state if this is the current video being displayed
          if (targetVideo.id === activeVideoItem?.id) {
            setIsVideoLiked(false);
          }
        }
      } else {
        // Add to Likes playlist
        await addVideoToPlaylist(likesPlaylistId, targetVideo.video_url, targetVideo.video_id, targetVideo.title || null, targetVideo.thumbnail_url || null);
        // Update local state if this is the current video being displayed
        if (targetVideo.id === activeVideoItem?.id) {
          setIsVideoLiked(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };
  const handleColorSelect = (hex, colorId, isRightClick = false) => {
    if (showColorPicker === 'star') {
      if (isRightClick) {
        // Right click: set quick assign default
        setQuickAssignColor(colorId);
        setShowColorPicker(null);
        setHoveredColorName(null);
      } else {
        // Left click: assign video to folder
        handleStarClick(colorId);
      }
    } else if (showColorPicker === 'shuffle') {
      if (isRightClick) {
        // Right click: set quick shuffle default
        setQuickShuffleColor(colorId);
        setShowColorPicker(null);
        setHoveredColorName(null);
      } else {
        // Left click: shuffle from that folder
        handleShuffle(colorId);
      }
    } else {
      if (showColorPicker === 'like') setLikeColor(hex);
      setShowColorPicker(null);
      setHoveredColorName(null);
    }
  };
  const handleOrbImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomOrbImage(reader.result);
        setIsAdjustingImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result;
        // Update the banner that is currently visible
        if (viewMode === 'full') {
          updateFullscreenBanner({
            image: imageDataUrl
          });
        } else {
          updateSplitscreenBanner({
            image: imageDataUrl
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const startPreviewTimer = callback => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(callback, 2000);
  };
  const clearPreviewTimer = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setPreviewPinIndex(null);
    setPreviewTabImage(null);
  };
  const clearPreviewTabImage = () => {
    clearPreviewTimer();
  };

  // --- Visual Layout States ---
  const [textContainerY, setTextContainerY] = useState(5);
  const [textContainerHeight, setTextContainerHeight] = useState(54);
  const [metadataYOffset, setMetadataYOffset] = useState(1);
  const [leftAltNavX, setLeftAltNavX] = useState(10);
  const [rightAltNavX, setRightAltNavX] = useState(-10);

  // --- Config Store ---
  const {
    pinFirstButtonX,
    pinFirstButtonSize,
    likeButtonX,
    menuButtonX,
    tooltipButtonX,
    pinAnchorX,
    pinAnchorY,
    plusButtonX,
    plusButtonY,
    pinToggleY,
    dotMenuWidth,
    dotMenuHeight,
    dotMenuY,
    dotSize,
    playlistCapsuleX,
    playlistCapsuleY,
    playlistCapsuleWidth,
    playlistCapsuleHeight,
    playlistHandleSize,
    playlistPlayIconSize,
    playlistChevronIconSize,
    playlistChevronLeftX,
    playlistChevronRightX,
    playlistPlayCircleX,
    modeHandleSize,
    modeHandleInternalSize,
    orbImageScale,
    orbImageScaleW,
    orbImageScaleH,
    orbImageXOffset,
    orbImageYOffset,
    orbSize,
    menuWidth,
    menuHeight,
    controllerCompactMode,
    setControllerCompactMode,
    bottomBarHeight,
    titleFontSize,
    metadataFontSize,
    pinSize,
    pinWidth,
    pinHeight,
    bottomIconSize,
    navChevronSize,
    orbMenuGap,
    setOrbMenuGap,
    orbButtonSpread,
    // New
    playlistToggleX,
    playlistTabsX,
    playlistInfoX,
    playlistInfoWidth,
    videoChevronLeftX,
    videoChevronRightX,
    videoPlayButtonX,
    modeSwitcherX,
    shuffleButtonX,
    gridButtonX,
    starButtonX,
    discoveryButtonX,
    updateFullscreenBanner,
    updateSplitscreenBanner,
    // Use new actions
    // Orb State (From Config Store now)
    customOrbImage,
    setCustomOrbImage,
    isSpillEnabled,
    setIsSpillEnabled,
    orbSpill,
    setOrbSpill,
    // Quick Assign/Shuffle (From Config Store)
    quickAssignColor,
    setQuickAssignColor,
    quickShuffleColor,
    setQuickShuffleColor,
    // Advanced Orb Masks
    orbAdvancedMasks,
    orbMaskRects,
    orbMaskPaths,
    orbMaskModes,
    // New Path Props
    // Orb Favorites for Overrides
    orbFavorites,
    isOrbPreviewMode,
    // Orb Navigation State (Shared)
    orbNavPlaylistId,
    setOrbNavPlaylistId,
    orbNavOrbId,
    setOrbNavOrbId,
    // Banner Navigation State (Shared)
    activeNavigationMode,
    setActiveNavigationMode,
    bannerNavPlaylistId,
    setBannerNavPlaylistId,
    bannerNavBannerId,
    setBannerNavBannerId,
    bannerPresets,
    visualizerColor,
    setVisualizerColor
  } = useConfigStore();

  const clipPathId = `orbClipPath-${isOrbPreviewMode ? 'preview' : (orbNavOrbId || 'default')}`;


  // --- Derived Constants ---
  const theme = THEMES[currentThemeId] || THEMES.blue;
  const trackWidth = Math.max(0, plusButtonX - pinAnchorX);

  // Helper to format view count
  const formatViews = count => {
    if (!count) return '0';
    if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}B`;
    if (count >= 10000000) return `${(count / 1000000).toFixed(0)}M`;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  // --- Orb Image Override Logic ---
  // New Orb Navigation State (Now derived from Store)

  // Computed: Playlists that have at least one Orb assigned
  const availableOrbPlaylists = useMemo(() => {
    if (!allPlaylists || !orbFavorites) return [];
    // Get all playlist IDs that have at least one orb assigned
    const playlistIdsWithOrbs = new Set();
    orbFavorites.forEach(orb => {
      if (orb.playlistIds && orb.playlistIds.length > 0) {
        orb.playlistIds.forEach(id => playlistIdsWithOrbs.add(String(id)));
      }
    });
    // Filter allPlaylists
    return allPlaylists.filter(p => playlistIdsWithOrbs.has(String(p.id)));
  }, [allPlaylists, orbFavorites]);

  // Computed: Orbs in the currently selected Orb-Nav playlist
  const availableOrbsInPlaylist = useMemo(() => {
    if (!orbNavPlaylistId || !orbFavorites) return [];
    return orbFavorites.filter(orb => orb.playlistIds && orb.playlistIds.map(String).includes(String(orbNavPlaylistId)));
  }, [orbNavPlaylistId, orbFavorites]);

  // Handler: Navigate Orb Playlists
  const navigateOrbPlaylist = direction => {
    if (availableOrbPlaylists.length === 0) return;
    let nextIndex = 0;
    const currentIndex = orbNavPlaylistId ? availableOrbPlaylists.findIndex(p => String(p.id) === String(orbNavPlaylistId)) : -1;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % availableOrbPlaylists.length;
    } else {
      nextIndex = (currentIndex - 1 + availableOrbPlaylists.length) % availableOrbPlaylists.length;
    }
    const nextPlaylist = availableOrbPlaylists[nextIndex];
    if (nextPlaylist) {
      setOrbNavPlaylistId(nextPlaylist.id);

      // Auto-select first orb in new playlist
      const orbsInNext = orbFavorites.filter(orb => orb.playlistIds && orb.playlistIds.map(String).includes(String(nextPlaylist.id)));
      if (orbsInNext.length > 0) {
        setOrbNavOrbId(orbsInNext[0].id);
      } else {
        setOrbNavOrbId(null);
      }
    }
  };

  // Handler: Navigate Orbs in current Orb-Nav Playlist
  const navigateOrb = direction => {
    if (availableOrbsInPlaylist.length === 0) return;
    let nextIndex = 0;
    const currentIndex = orbNavOrbId ? availableOrbsInPlaylist.findIndex(o => o.id === orbNavOrbId) : -1;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % availableOrbsInPlaylist.length;
    } else {
      nextIndex = (currentIndex - 1 + availableOrbsInPlaylist.length) % availableOrbsInPlaylist.length;
    }
    const nextOrb = availableOrbsInPlaylist[nextIndex];
    if (nextOrb) {
      setOrbNavOrbId(nextOrb.id);
    }
  };

  // --- Banner Navigation Logic ---

  // Computed: Playlists that have at least one Banner assigned
  const availableBannerPlaylists = useMemo(() => {
    if (!allPlaylists || !bannerPresets) return [];
    const playlistIdsWithBanners = new Set();
    bannerPresets.forEach(preset => {
      if (preset.playlistIds && preset.playlistIds.length > 0) {
        preset.playlistIds.forEach(id => playlistIdsWithBanners.add(String(id)));
      }
    });
    return allPlaylists.filter(p => playlistIdsWithBanners.has(String(p.id)));
  }, [allPlaylists, bannerPresets]);

  // Computed: Banners in the currently selected Banner-Nav playlist
  const availableBannersInPlaylist = useMemo(() => {
    if (!bannerNavPlaylistId || !bannerPresets) return [];
    return bannerPresets.filter(preset => preset.playlistIds && preset.playlistIds.map(String).includes(String(bannerNavPlaylistId)));
  }, [bannerNavPlaylistId, bannerPresets]);

  // Handler: Navigate Banner Playlists
  const navigateBannerPlaylist = direction => {
    if (availableBannerPlaylists.length === 0) return;
    let nextIndex = 0;
    const currentIndex = bannerNavPlaylistId ? availableBannerPlaylists.findIndex(p => String(p.id) === String(bannerNavPlaylistId)) : -1;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % availableBannerPlaylists.length;
    } else {
      nextIndex = (currentIndex - 1 + availableBannerPlaylists.length) % availableBannerPlaylists.length;
    }
    const nextPlaylist = availableBannerPlaylists[nextIndex];
    if (nextPlaylist) {
      setBannerNavPlaylistId(nextPlaylist.id);

      // Auto-select first banner in new playlist
      const bannersInNext = bannerPresets.filter(preset => preset.playlistIds && preset.playlistIds.map(String).includes(String(nextPlaylist.id)));
      if (bannersInNext.length > 0) {
        setBannerNavBannerId(bannersInNext[0].id);
      } else {
        setBannerNavBannerId(null);
      }
    }
  };

  // Handler: Navigate Banners in current Banner-Nav Playlist
  const navigateBanner = direction => {
    if (availableBannersInPlaylist.length === 0) return;
    let nextIndex = 0;
    const currentIndex = bannerNavBannerId ? availableBannersInPlaylist.findIndex(b => b.id === bannerNavBannerId) : -1;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % availableBannersInPlaylist.length;
    } else {
      nextIndex = (currentIndex - 1 + availableBannersInPlaylist.length) % availableBannersInPlaylist.length;
    }
    const nextBanner = availableBannersInPlaylist[nextIndex];
    if (nextBanner) {
      setBannerNavBannerId(nextBanner.id);
    }
  };

  // --- Unified Navigation Handlers ---
  const handlePlaylistNav = direction => {
    // direction: 'prev' | 'next'
    // Filter navigationItems to only include playlists, then map to their data
    const playlistItems = navigationItems.filter(item => item.type === 'playlist').map(item => item.data);
    if (playlistItems.length === 0) return;

    const navigatedId = activeNavigationMode === 'orb' ? orbNavPlaylistId : bannerNavPlaylistId;
    const currentId = navigatedId || currentPlaylistId;
    const currentIndex = playlistItems.findIndex(p => String(p.id) === String(currentId));

    console.log('[DEBUG_NAV] handlePlaylistNav:', {
      direction,
      activeNavigationMode,
      navigatedId,
      currentPlaylistId,
      currentId,
      playlistCount: playlistItems.length,
      currentIndex
    });

    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % playlistItems.length;
    } else {
      nextIndex = (currentIndex - 1 + playlistItems.length) % playlistItems.length;
    }

    console.log('[DEBUG_NAV] nextIndex calculated:', nextIndex);

    const nextPlaylist = playlistItems[nextIndex];
    if (nextPlaylist) {
      if (activeNavigationMode === 'orb') {
        setOrbNavPlaylistId(nextPlaylist.id);
        // Auto-select first orb in new playlist
        const orbsInNext = orbFavorites.filter(orb => orb.playlistIds && orb.playlistIds.map(String).includes(String(nextPlaylist.id)));
        setOrbNavOrbId(orbsInNext.length > 0 ? orbsInNext[0].id : null);
      } else {
        setBannerNavPlaylistId(nextPlaylist.id);
      }
    }
  };
  const handleItemNav = direction => {
    // direction: 'prev' | 'next'
    if (activeNavigationMode === 'orb') {
      navigateOrb(direction);
    } else {
      navigateBanner(direction);
    }
  };
  const getEffectiveOrbImage = () => {
    // -1. CHECK LIVE PREVIEW MODE (Highest Priority)
    if (isOrbPreviewMode) {
      // Return the current store state as the "effective orb"
      // This forces the render 
      return {
        image: customOrbImage,
        scale: orbImageScale,
        xOffset: orbImageXOffset,
        yOffset: orbImageYOffset,
        isSpillEnabled: isSpillEnabled,
        // Use Store State
        orbSpill: orbSpill,
        orbAdvancedMasks: orbAdvancedMasks,
        orbMaskRects: orbMaskRects,
        orbMaskPaths: orbMaskPaths,
        orbMaskModes: orbMaskModes
      };
    }

    // 0. Check Orb Navigation Override (Next Priority)
    if (orbNavOrbId && orbNavPlaylistId) {
      const selectedOrb = orbFavorites.find(f => f.id === orbNavOrbId);
      if (selectedOrb && selectedOrb.customOrbImage) {
        return {
          image: selectedOrb.customOrbImage,
          scale: selectedOrb.orbImageScale || 1,
          xOffset: selectedOrb.orbImageXOffset || 0,
          yOffset: selectedOrb.orbImageYOffset || 0,
          // Pass full config for spill logic if needed, but current usage only extracts these 4
          // We might need to expose spill/masks too?
          // PlayerController usages:
          // orbImageSrc, displayScale, displayX, displayY
          // AND spill logic in the render...
          // The render logic uses `isSpillEnabled` and `orbSpill` from STORE directly (lines 1787-1819)
          // To fully override, we need to return these and update the render variables
          ...selectedOrb
        };
      }
    }

    // 1. Identify Playlist
    let playlistName = null;
    if (currentPlaylistId) {
      const p = allPlaylists.find(p => String(p.id) === String(currentPlaylistId));
      if (p) playlistName = p.name;
    }
    if (!playlistName && currentPlaylistTitle) playlistName = currentPlaylistTitle;
    if (!playlistName) return null;

    // 2. Check Orb Group Override
    const orbGroup = orbFavorites?.find(f => f.playlistIds && (f.playlistIds.includes(playlistName) || currentPlaylistId && f.playlistIds.includes(String(currentPlaylistId))));
    if (orbGroup) {
      // Collect group images
      let images = [orbGroup];
      if (orbGroup.groupMembers) {
        orbGroup.groupMembers.forEach(mid => {
          const m = orbFavorites.find(x => x.id === mid);
          if (m) images.push(m);
        });
      }

      // Filter by Folder Color (if active)
      const activeFolderColor = currentFolder ? currentFolder.folder_color : null;
      if (activeFolderColor && activeFolderColor !== 'all') {
        images = images.filter(img => img.folderColors && img.folderColors.includes(activeFolderColor));
      }
      if (images.length > 0) {
        // Use playlist ID as seed for consistency
        const seed = String(currentPlaylistId || 'default');
        const rand = seededRandom(seed);
        const idx = Math.floor(rand * images.length);
        const selected = images[idx];
        if (selected && selected.customOrbImage) {
          return {
            image: selected.customOrbImage,
            scale: selected.orbImageScale || 1,
            // Use raw multiplier (e.g. 1.0), do NOT divide by 100
            xOffset: selected.orbImageXOffset || 0,
            yOffset: selected.orbImageYOffset || 0,
            ...selected
          };
        }
      }
    }
    return null;
  };
  const effectiveOrb = getEffectiveOrbImage();

  // Sync visualizer color and banners with active/navigated/overridden orb
  useEffect(() => {
    if (effectiveOrb) {
      // Clear banner navigation override and force orb mode so the orb's settings render
      setBannerNavBannerId(null);
      setActiveNavigationMode('orb');

      if (effectiveOrb.visualizerColor) {
        setVisualizerColor(effectiveOrb.visualizerColor);
      }
      if (effectiveOrb.fullscreenBanner) {
        updateFullscreenBanner(effectiveOrb.fullscreenBanner);
      }
      if (effectiveOrb.splitscreenBanner) {
        updateSplitscreenBanner(effectiveOrb.splitscreenBanner);
      }
    }
  }, [
    effectiveOrb?.id,
    effectiveOrb?.visualizerColor,
    effectiveOrb?.fullscreenBanner,
    effectiveOrb?.splitscreenBanner,
    setVisualizerColor,
    updateFullscreenBanner,
    updateSplitscreenBanner,
    setBannerNavBannerId,
    setActiveNavigationMode
  ]);

  const orbImageSrc = effectiveOrb?.image || customOrbImage || DEFAULT_ORB_IMAGE;
  const displayScale = effectiveOrb ? effectiveOrb.scale : orbImageScale;
  const displayX = effectiveOrb ? effectiveOrb.xOffset : orbImageXOffset;
  const displayY = effectiveOrb ? effectiveOrb.yOffset : orbImageYOffset;

  // Derive effective spill/mask settings (Override Store if Orb is selected)
  const displayIsSpillEnabled = (orbImageSrc === DEFAULT_ORB_IMAGE) ? false : (effectiveOrb?.isSpillEnabled ?? isSpillEnabled);
  const displayOrbSpill = effectiveOrb?.orbSpill ?? orbSpill;
  const displayOrbAdvancedMasks = effectiveOrb?.orbAdvancedMasks ?? orbAdvancedMasks;
  const displayOrbMaskModes = effectiveOrb?.orbMaskModes ?? orbMaskModes;
  const displayOrbMaskPaths = effectiveOrb?.orbMaskPaths ?? orbMaskPaths;
  const displayOrbMaskRects = effectiveOrb?.orbMaskRects ?? orbMaskRects;

  // Get video display info (use preview if in preview mode)
  // Fallback to activeVideoItem if displayVideoItem is not set
  const finalDisplayVideoItem = displayVideoItem || activeVideoItem;
  let displayVideo;
  if (finalDisplayVideoItem) {
    displayVideo = {
      title: String(finalDisplayVideoItem.title || 'Untitled Video'),
      author: String(finalDisplayVideoItem.author || 'Unknown'),
      viewers: String(finalDisplayVideoItem.view_count ? formatViews(finalDisplayVideoItem.view_count) : '0 live'),
      publishedYear: finalDisplayVideoItem.published_at ? new Date(finalDisplayVideoItem.published_at).getFullYear() : null,
      verified: Boolean(false)
    };
  } else {
    displayVideo = {
      title: 'No Video',
      author: 'Unknown',
      viewers: '0',
      verified: false
    };
  }

  // Convert pinned videos to pin format expected by component
  const pins = pinnedVideos.map((video, idx) => ({
    id: `pin-${video.id}`,
    icon: Pin,
    video: video,
    index: idx
  }));

  // Determine if author name is long (threshold: 18 characters)
  const isAuthorLong = displayVideo.author.length > 18;
  const hasViewCount = displayVideo.viewers && displayVideo.viewers !== '0 live';
  const hasPublishedYear = displayVideo.publishedYear !== null;
  const shouldUseMergedView = isAuthorLong && hasViewCount && hasPublishedYear;

  // Cycle between view count and publish year every 12 seconds (only if using merged view)
  useEffect(() => {
    // Reset to show view count when video changes
    setShowViewCount(true);
    setMetadataOpacity(1);

    // Only cycle if using merged view (long author name with both metadata available)
    if (shouldUseMergedView) {
      const interval = setInterval(() => {
        // Fade out
        setMetadataOpacity(0);
        // After fade out completes, switch content and fade in
        setTimeout(() => {
          setShowViewCount(prev => !prev);
          setMetadataOpacity(1);
        }, 600); // Half of transition duration (1200ms total)
      }, 12000); // 12 seconds

      return () => clearInterval(interval);
    } else {
      // If not using merged view, show view count if available
      setShowViewCount(hasViewCount);
      setMetadataOpacity(1);
    }
  }, [shouldUseMergedView, hasViewCount, hasPublishedYear, finalDisplayVideoItem?.id]);

  // Get playlist/folder title (respecting navigated Orb/Banner playlist)
  let playlistTitle;

  // Determine which playlist ID to use for the title and badges
  const navigatedId = activeNavigationMode === 'orb' ? orbNavPlaylistId : bannerNavPlaylistId;
  const effectivePlaylistId = hasSecondPlayerVideo && secondPlayerPlaylistId ? secondPlayerPlaylistId : (navigatedId || currentPlaylistId);

  if (hasSecondPlayerVideo && secondPlayerPlaylistId) {
    const secondPlayerPlaylist = allPlaylists.find(p => p.id === secondPlayerPlaylistId);
    playlistTitle = secondPlayerPlaylist ? secondPlayerPlaylist.name : 'Unknown Playlist';
  } else if (effectivePlaylistId) {
    const foundPlaylist = allPlaylists.find(p => String(p.id) === String(effectivePlaylistId));
    if (foundPlaylist) {
      // Only show folder suffix if we are looking at the CURRENTLY PLAYING playlist
      if (String(effectivePlaylistId) === String(currentPlaylistId) && currentFolder && String(currentFolder.playlist_id) === String(currentPlaylistId)) {
        const folderInfo = getFolderColorById(currentFolder.folder_color);
        const folderName = folderInfo ? folderInfo.name : 'Folder';
        playlistTitle = `${foundPlaylist.name} - ${folderName}`;
      } else {
        playlistTitle = foundPlaylist.name;
      }
    } else {
      playlistTitle = currentPlaylistTitle || 'Unknown Playlist';
    }
  } else {
    playlistTitle = currentPlaylist ? currentPlaylist.name : 'No Playlist';
  }

  // Group carousel badge: which group to show (activeGroupId if set, else first group containing current playlist)
  const effectivePlaylistIdForBadge = effectivePlaylistId;
  const groupIdsForCurrentPlaylist = effectivePlaylistIdForBadge ? getGroupIdsForPlaylist(effectivePlaylistIdForBadge) : [];

  // Scoped groups for the current explorer page that are populated
  const groupsOnPage = groups.filter(g => (g.page || 1) === activePage && g.playlistIds && g.playlistIds.length > 0);
  const allGroupsForPlaylist = groupIdsForCurrentPlaylist
    .map(id => groupsOnPage.find(g => g.id === id))
    .filter(Boolean);

  const singleGroupForBadge = (activeGroupId && groupsOnPage.some(g => g.id === activeGroupId))
    ? groupsOnPage.find(g => g.id === activeGroupId)
    : null;

  // Cycle group badge: cycle through group carousels ON THIS PAGE
  const cycleGroupBadge = direction => {
    if (groupsOnPage.length === 0) return;
    const items = groupsOnPage;
    const currentIdx = items.findIndex(g => g.id === activeGroupId);
    let nextIdx;
    if (currentIdx === -1) {
      // Currently on "ALL", go to first or last group
      nextIdx = direction === 'next' ? 0 : items.length - 1;
    } else {
      nextIdx = direction === 'next' ? (currentIdx + 1) % items.length : (currentIdx - 1 + items.length) % items.length;
    }
    setActiveGroupId(items[nextIdx].id);
  };
  const canCycleGroups = groupsOnPage.length >= 1;
  const sharedProps = {
    viewMode,
    leftAltNavX,
    playlistCheckpoint,
    handleCommit,
    getInspectTitle,
    handleRevert,
    showPreviewMenus,
    theme,
    menuHeight,
    handleAltNav,
    isEditMode,
    menuWidth,
    handleShufflePlaylist,
    playlistTitleRef,
    titleFontSize,
    handlePlaylistsGrid,
    playlistTitle,
    currentVideoFolders,
    activeTabId,
    activePresetId,
    singleGroupForBadge,
    cycleGroupBadge,
    canCycleGroups,
    groups,
    activeGroupId,
    setActiveGroupId,
    safePresets,
    safeTabs,
    currentVideoFolderNames,
    pins,
    isPriorityPin,
    handlePinClick,
    activePin,
    handleUnpin,
    bottomBarHeight,
    setIsMoreMenuOpen,
    isMoreMenuOpen,
    bottomIconSize,
    setShowPreviewMenus,
    toggleDevToolbar,
    showDevToolbar,
    setIsVisualizerEnabled,
    isVisualizerEnabled,
    handleBannerUpload,
    setIsAddMenuOpen,
    isAddMenuOpen,
    handleAddClipboardToQuickVideos,
    handleAddClipboardToCurrentPlaylist,
    handleAddClipboardToTargetPlaylist,
    isQueueModeOpen,
    setIsQueueModeOpen,
    queue,
    setPlaylistItems,
    setCurrentVideoIndex,
    removeFromQueue,
    activeNavButton,
    navChevronSize,
    setActiveNavButton,
    handleHistoryBack,
    historyIndex,
    historyStack,
    handleHistoryForward,
    navigatePlaylist,
    orbMenuGap,
    orbSize,
    orbImageSrc,
    displayIsSpillEnabled,
    displayScale,
    orbImageScaleW,
    orbImageScaleH,
    displayX,
    displayY,
    fileInputRef,
    handleOrbImageUpload,
    setFullscreenInfoBlanked,
    setViewMode,
    setCurrentPage,
    setActiveNavigationMode,
    activeNavigationMode,
    handlePlaylistNav,
    handleItemNav,
    showColorPicker,
    setShowColorPicker,
    setHoveredColorName,
    dotMenuY,
    dotMenuWidth,
    dotMenuHeight,
    dotSize,
    quickShuffleColor,
    handleColorSelect,
    quickAssignColor,
    displayVideo,
    hoveredColorName,
    handlePrevVideo,
    handleVideosGrid,
    handleNextVideo,
    handlePlayButtonToggle,
    playButtonRightClickRef,
    currentFolder,
    handleShuffle,
    shuffleButtonX,
    handleStarClick,
    handleStarAlignToPlay,
    starButtonX,
    handlePinMouseDown,
    handlePinMouseUp,
    handlePinMouseLeave,
    pinFirstButtonX,
    activeVideoItem,
    currentVideo,
    isPinned,
    isFollowerPin,
    handleLikeClick,
    likeButtonX,
    isVideoLiked,
    likeColor,
    tooltipButtonX,
    setIsTooltipOpen,
    isTooltipOpen,
    videoCheckpoint,
    controllerCompactMode,
    activePage,
    isOrbPreviewMode,
    orbNavOrbId,
    clipPathId,
    discoveryButtonX
  };

  return <div className="w-full pointer-events-none">
    <div className="max-w-5xl mx-auto py-4 px-6 pointer-events-auto">
      {/* SVG ClipPath Generator for Partial Spillover */}
      <svg 
        key={`orb-clip-path-gen-${clipPathId}-${JSON.stringify(displayOrbMaskModes)}-${JSON.stringify(displayOrbMaskPaths)}`}
        width="0" height="0" style={{ position: 'absolute' }}
      >
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
            {['tl', 'tr', 'bl', 'br'].map(q => {
              if (!displayIsSpillEnabled || !displayOrbSpill[q]) return null;
              const defaults = {
                tl: {
                  x: -1.0,
                  y: -0.5,
                  w: 1.5,
                  h: 1.0
                },
                tr: {
                  x: 0.5,
                  y: -0.5,
                  w: 1.0,
                  h: 1.0
                },
                bl: {
                  x: -1.0,
                  y: 0.5,
                  w: 1.5,
                  h: 1.5
                },
                br: {
                  x: 0.5,
                  y: 0.5,
                  w: 1.0,
                  h: 1.5
                }
              };
              if (!displayOrbAdvancedMasks?.[q]) {
                const d = defaults[q];
                return <rect key={q} x={d.x} y={d.y} width={d.w} height={d.h} />;
              }
              const mode = displayOrbMaskModes?.[q] || 'rect';
              if (mode === 'path') {
                const points = displayOrbMaskPaths?.[q] || [];
                if (points.length < 3) return <rect key={q} x={defaults[q].x} y={defaults[q].y} width={defaults[q].w} height={defaults[q].h} />;
                const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x / 100).toFixed(4)} ${(p.y / 100).toFixed(4)}`).join(' ') + ' Z';
                return <path key={q} d={d} />;
              } else {
                const r = displayOrbMaskRects?.[q] || {
                  x: 0,
                  y: 0,
                  w: 50,
                  h: 50
                };
                return <rect key={q} x={r.x / 100} y={r.y / 100} width={r.w / 100} height={r.h / 100} />;
              }
            })}
          </clipPath>
        </defs>
      </svg>

      <div
        className="w-full flex items-center justify-center relative overflow-visible transition-transform duration-500 gap-x-6"
        style={{
          transform: viewMode === 'full'
            ? 'translateX(0)'
            : `translateX(calc(-25vw + (${(menuWidth * 0.9) - orbSize}px) / 2))`
        }}
      >
        {/* Left column (Playlists in Full, Hidden in Split) */}
        {viewMode === 'full' && (
          <div className="flex flex-col gap-y-1">
            <div className="flex items-center justify-end">
              <PlayerControllerPlaylistMenu {...sharedProps} />
            </div>
          </div>
        )}

        {/* Center column (Orb) */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            margin: viewMode === 'full' ? `0 ${orbMenuGap}px` : '0'
          }}
        >
          <PlayerControllerOrbMenu {...sharedProps} />
        </div>

        {/* Right column (Videos in Full, Stacked in Split) */}
        <div
          className={`flex flex-col ${viewMode === 'full' ? 'gap-y-1' : '-space-y-4 items-center'}`}
        >
          {viewMode === 'full' ? (
            <div className="flex items-center justify-start">
              <PlayerControllerVideoMenu {...sharedProps} />
            </div>
          ) : (
            <>
              <div className="-ml-16">
                <PlayerControllerPlaylistMenu {...sharedProps} />
              </div>
              <PlayerControllerVideoMenu {...sharedProps} />
            </>
          )}
        </div>
      </div>

    </div>
  </div>;
}