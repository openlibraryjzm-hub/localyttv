import React, { useState } from 'react';
import { 
  X, Library, Play, ChevronLeft, ChevronRight, MoreHorizontal, Clock, Plus, Circle, 
  Menu, Star, Shuffle, Heart, Key, Pin, ThumbsUp, Info, MousePointer2, ArrowLeft, LayoutGrid,
  ChevronsLeft, ChevronsRight, HelpCircle, ArrowLeftRight, Layout, Home
} from 'lucide-react';
import { useLayoutStore } from '../store/layoutStore';
import { useConfigStore } from '../store/configStore';
import PlayerControllerPlaylistMenu from './PlayerControllerPlaylistMenu';
import PlayerControllerVideoMenu from './PlayerControllerVideoMenu';
import PlayerControllerOrbMenu from './PlayerControllerOrbMenu';
import { THEMES } from '../utils/themes';

const DEFAULT_ORB_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23ffffff'/%3E%3Cpath d='M0 20 L20 0 L40 20 L20 40 Z' fill='none' stroke='rgba(0,0,0,0.12)' stroke-width='1'/%3E%3C/svg%3E";

export default function ControlTutorialModal() {
  const { 
    isControlTutorialOpen, 
    setIsControlTutorialOpen 
  } = useLayoutStore();

  const {
    customOrbImage,
    isSpillEnabled,
    orbImageScale,
    orbImageScaleW,
    orbImageScaleH,
    orbImageXOffset,
    orbImageYOffset,
    orbAdvancedMasks,
    orbMaskRects,
    orbMaskPaths,
    orbMaskModes,
    orbSpill
  } = useConfigStore();

  const [selectedMenuId, setSelectedMenuId] = useState(null); // null = Spritesheet Grid, 'playlist' | 'video' | 'orb' = Detailed 1:1 View
  const [hoveredInfo, setHoveredInfo] = useState(null);

  if (!isControlTutorialOpen) return null;

  const orbImageSrc = customOrbImage || DEFAULT_ORB_IMAGE;

  // Helper mouse symbol components
  const LClickBadge = () => (
    <span className="inline-flex items-center gap-1 font-bold text-sky-900 bg-sky-100 border border-sky-300 px-1.5 py-0.5 rounded text-[11px] shadow-sm select-none">
      <MousePointer2 size={11} className="rotate-[-20deg]" /> L-Click
    </span>
  );

  const RClickBadge = ({ text = "R-Click / Hold" }) => (
    <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded text-[11px] shadow-sm select-none">
      <MousePointer2 size={11} className="rotate-[20deg]" /> {text}
    </span>
  );

  // --- TAB 0: TOP PLAYLIST MENU EXPLANATIONS ---
  const playlistExplanations = {
    title: {
      title: "Playlist Title & Filter Badges",
      icon: Library,
      renderDescription: () => (
        <span>
          Displays active playlist name and filter badges. <LClickBadge /> to open Playlists Grid page, <RClickBadge text="R-Click" /> to trigger Mega Shuffle across all playlist videos.
        </span>
      )
    },
    moreOptions: {
      title: "Three-Dot Options Menu",
      icon: MoreHorizontal,
      renderDescription: () => (
        <span>
          Opens settings for audio visualizers, theme banners, and color pickers. <LClickBadge /> to toggle options menu.
        </span>
      )
    },
    historyBack: {
      title: "History Back Chevron",
      icon: ChevronLeft,
      renderDescription: () => (
        <span>
          Steps backward to the previously played video in watch history. <LClickBadge /> to step back.
        </span>
      )
    },
    historyPage: {
      title: "Watch History Center Button",
      icon: Clock,
      renderDescription: () => (
        <span>
          Opens full Watch History page showing recent 100 watched videos. <LClickBadge /> to open Watch History page.
        </span>
      )
    },
    historyForward: {
      title: "History Forward Chevron",
      icon: ChevronRight,
      renderDescription: () => (
        <span>
          Steps forward in playback history after stepping back. <LClickBadge /> to step forward.
        </span>
      )
    },
    plusAdd: {
      title: "Plus (+) Add Content Button",
      icon: Plus,
      renderDescription: () => (
        <span>
          Opens dropdown to paste YouTube or local links, or access 4 Quick Assign slots. <LClickBadge /> to open dropdown.
        </span>
      )
    },
    groupCarousel: {
      title: "Group Carousel Badge",
      icon: Circle,
      renderDescription: () => (
        <span>
          Filters navigation to active playlist group. <LClickBadge /> to cycle groups, <RClickBadge text="R-Click" /> to toggle ALL library mode.
        </span>
      )
    },
    prevPlaylist: {
      title: "Previous Playlist Chevron",
      icon: ChevronLeft,
      renderDescription: () => (
        <span>
          Cycles to the previous playlist in active group or library. <LClickBadge /> to cycle back.
        </span>
      )
    },
    playlistsGrid: {
      title: "Playlists Grid Button",
      icon: Menu,
      renderDescription: () => (
        <span>
          Opens full Playlists Grid view to browse all saved playlists. <LClickBadge /> to view grid.
        </span>
      )
    },
    nextPlaylist: {
      title: "Next Playlist Chevron",
      icon: ChevronRight,
      renderDescription: () => (
        <span>
          Cycles to the next playlist in active group or library. <LClickBadge /> to cycle forward.
        </span>
      )
    }
  };

  // --- TAB 1: TOP VIDEO MENU EXPLANATIONS ---
  const videoExplanations = {
    prevVideo: {
      title: "Previous Video Chevron",
      icon: ChevronLeft,
      renderDescription: () => (
        <span>
          Plays the previous video in queue. <LClickBadge /> to play previous video.
        </span>
      )
    },
    videosGrid: {
      title: "Videos Grid Button",
      icon: Menu,
      renderDescription: () => (
        <span>
          Opens full Videos Grid view to browse playlist videos. <LClickBadge /> to view grid.
        </span>
      )
    },
    nextVideo: {
      title: "Next Video Chevron",
      icon: ChevronRight,
      renderDescription: () => (
        <span>
          Plays the next video in queue. <LClickBadge /> to play next video.
        </span>
      )
    },
    folderCycle: {
      title: "Folder Cycle Filter",
      icon: Play,
      renderDescription: () => (
        <span>
          Filters playlist playback by folder color. <LClickBadge /> to cycle forward, <RClickBadge text="R-Click / Hold" /> to cycle backward, double <RClickBadge text="Double R-Click" /> to reset filter to ALL videos.
        </span>
      )
    },
    starFolder: {
      title: "Star Folder Assignment",
      icon: Star,
      renderDescription: () => (
        <span>
          Tags video with quick folder color. <LClickBadge /> to assign folder, <RClickBadge text="R-Click" /> to filter playback to this color.
        </span>
      )
    },
    shuffle: {
      title: "Shuffle Button",
      icon: Shuffle,
      renderDescription: () => (
        <span>
          Shuffles active folder or video queue. <LClickBadge /> to shuffle, <RClickBadge text="R-Click" /> to pick 16-color shuffle pool.
        </span>
      )
    },
    pinButton: {
      title: "Pin Video Control",
      icon: Pin,
      renderDescription: () => (
        <span>
          Pins video to quick slots. <LClickBadge /> for Normal Pin, hold (&gt;600ms) for Priority Pin, <RClickBadge text="R-Click" /> to view Pins page. Click active pin for Follower Pin auto-advance.
        </span>
      )
    },
    likeButton: {
      title: "Like Video Button",
      icon: ThumbsUp,
      renderDescription: () => (
        <span>
          Adds video to your Liked collection. <LClickBadge /> to like video, <RClickBadge text="R-Click" /> to view Likes page.
        </span>
      )
    },
    guideButton: {
      title: "App Control Tutorial & Guide",
      icon: HelpCircle,
      renderDescription: () => (
        <span>
          Opens this video-gamey Control Guide modal to inspect any menu on screen. <LClickBadge /> to open guide.
        </span>
      )
    }
  };

  // --- TAB 2: CENTRAL ORB MENU EXPLANATIONS ---
  const orbExplanations = {
    orbConfig: {
      title: "Orb Configuration Button (Top Left)",
      icon: Circle,
      renderDescription: () => (
        <span>
          Opens Orb Configuration page to adjust orb image masks, spillover FX, and scale bounds. <LClickBadge /> to open settings.
        </span>
      )
    },
    bannerPage: {
      title: "App Banner Customization (Top Right)",
      icon: Layout,
      renderDescription: () => (
        <span>
          Opens Banner Customization page to select, edit, and assign app theme banners. <LClickBadge /> to open banner editor.
        </span>
      )
    },
    apiKey: {
      title: "YouTube API Settings (Bottom Left)",
      icon: Key,
      renderDescription: () => (
        <span>
          Opens popup modal to input YouTube Data API v3 key for search and imports. <LClickBadge /> to configure key.
        </span>
      )
    },
    navModeToggle: {
      title: "Navigation Mode Toggle (Bottom Right)",
      icon: ArrowLeftRight,
      renderDescription: () => (
        <span>
          Toggles player navigation between Orb Mode and Banner Mode. <LClickBadge /> to switch navigation mode.
        </span>
      )
    },
    homeExplorer: {
      title: "Home Explorer Hub (Bottom Center)",
      icon: Home,
      renderDescription: () => (
        <span>
          Displays active Explorer page number. <LClickBadge /> to return directly to the main video grid.
        </span>
      )
    },
    prevPlaylist: {
      title: "Previous Playlist / Category (Top Left Chevrons)",
      icon: ChevronsLeft,
      renderDescription: () => (
        <span>
          Cycles backward to previous Orb playlist or Banner category. <LClickBadge /> to cycle back.
        </span>
      )
    },
    prevItem: {
      title: "Previous Orb / Banner Item (Bottom Left Chevron)",
      icon: ChevronLeft,
      renderDescription: () => (
        <span>
          Cycles to previous Orb video or Banner item. <LClickBadge /> to cycle back.
        </span>
      )
    },
    nextPlaylist: {
      title: "Next Playlist / Category (Top Right Chevrons)",
      icon: ChevronsRight,
      renderDescription: () => (
        <span>
          Cycles forward to next Orb playlist or Banner category. <LClickBadge /> to cycle forward.
        </span>
      )
    },
    nextItem: {
      title: "Next Orb / Banner Item (Bottom Right Chevron)",
      icon: ChevronRight,
      renderDescription: () => (
        <span>
          Cycles to next Orb video or Banner item. <LClickBadge /> to cycle forward.
        </span>
      )
    }
  };

  const defaultPlaylistInfo = {
    title: "Top Playlist Menu",
    icon: Library,
    renderDescription: () => (
      <span>
        Hover any button on the menu to inspect its functionality.
      </span>
    )
  };

  const defaultVideoInfo = {
    title: "Top Video Menu",
    icon: Play,
    renderDescription: () => (
      <span>
        Hover any button on the menu to inspect its functionality.
      </span>
    )
  };

  const defaultOrbInfo = {
    title: "Central Orb Menu",
    icon: Circle,
    renderDescription: () => (
      <span>
        Hover any button around the central orb to inspect its functionality.
      </span>
    )
  };

  // Mock Props for 1:1 PlayerControllerPlaylistMenu
  const mockPlaylistProps = {
    viewMode: 'half',
    leftAltNavX: 0,
    playlistCheckpoint: null,
    handleCommit: () => {},
    getInspectTitle: (label) => label,
    handleRevert: () => {},
    groups: [],
    activeGroupId: null,
    setActiveGroupId: () => {},
    activePage: 1,
    theme: THEMES.blue || { accent: 'text-sky-500' },
    menuHeight: 110,
    handleAltNav: () => {},
    isEditMode: false,
    menuWidth: 380,
    handleShufflePlaylist: () => {},
    playlistTitleRef: { current: null },
    titleFontSize: 15,
    handlePlaylistsGrid: () => {},
    playlistTitle: "Cyberpunk Synthwave Chill Mix 2026",
    currentVideoFolders: [],
    activeTabId: null,
    activePresetId: 'all',
    singleGroupForBadge: null,
    cycleGroupBadge: () => {},
    canCycleGroups: false,
    safePresets: [],
    safeTabs: [],
    currentVideoFolderNames: [],
    pins: [],
    isPriorityPin: () => false,
    handlePinClick: () => {},
    activePin: null,
    handleUnpin: () => {},
    bottomBarHeight: 28,
    setIsMoreMenuOpen: () => {},
    isMoreMenuOpen: false,
    bottomIconSize: 28,
    setIsVisualizerEnabled: () => {},
    isVisualizerEnabled: false,
    handleBannerUpload: () => {},
    setIsAddMenuOpen: () => {},
    isAddMenuOpen: false,
    handleAddClipboardToQuickVideos: () => {},
    handleAddClipboardToCurrentPlaylist: () => {},
    handleAddClipboardToTargetPlaylist: () => {},
    setPlaylistItems: () => {},
    setCurrentVideoIndex: () => {},
    activeNavButton: null,
    navChevronSize: 14,
    setActiveNavButton: () => {},
    handleHistoryBack: () => {},
    historyIndex: 0,
    historyStack: [],
    handleHistoryForward: () => {},
    navigatePlaylist: () => {}
  };

  // Mock Props for 1:1 PlayerControllerVideoMenu
  const mockVideoProps = {
    viewMode: 'half',
    menuWidth: 380,
    menuHeight: 110,
    showColorPicker: null,
    setShowColorPicker: () => {},
    setHoveredColorName: () => {},
    getInspectTitle: (label) => label,
    dotMenuY: 0,
    dotMenuWidth: 100,
    dotMenuHeight: 30,
    dotSize: 10,
    quickShuffleColor: 'all',
    handleColorSelect: () => {},
    quickAssignColor: null,
    titleFontSize: 15,
    displayVideo: { title: "4K Cyberpunk City Walk - Rainy Night" },
    bottomBarHeight: 28,
    hoveredColorName: null,
    handlePrevVideo: () => {},
    navChevronSize: 14,
    handleVideosGrid: () => {},
    setFullscreenInfoBlanked: () => {},
    setViewMode: () => {},
    setCurrentPage: () => {},
    bottomIconSize: 28,
    handleNextVideo: () => {},
    handlePlayButtonToggle: () => {},
    playButtonRightClickRef: { current: 0 },
    currentFolder: null,
    handleShuffle: () => {},
    shuffleButtonX: -20,
    handleStarClick: () => {},
    handleStarAlignToPlay: () => {},
    starButtonX: 10,
    currentVideoFolders: [],
    handlePinMouseDown: () => {},
    handlePinMouseUp: () => {},
    handlePinMouseLeave: () => {},
    pinFirstButtonX: 40,
    activeVideoItem: { id: 'sample', title: "4K Cyberpunk City Walk - Rainy Night" },
    currentVideo: { id: 'sample', title: "4K Cyberpunk City Walk - Rainy Night" },
    isPriorityPin: () => false,
    isPinned: () => false,
    isFollowerPin: () => false,
    handleLikeClick: () => {},
    likeButtonX: 70,
    isVideoLiked: false,
    likeColor: '#f43f5e',
    tooltipButtonX: 100,
    setIsTooltipOpen: () => {},
    isTooltipOpen: false,
    rightAltNavX: 0,
    theme: THEMES.blue || { accent: 'text-sky-500' },
    handleAltNav: () => {},
    videoCheckpoint: null,
    handleCommit: () => {},
    handleRevert: () => {},
    discoveryButtonX: 130
  };

  // Mock Props for 1:1 PlayerControllerOrbMenu
  const mockOrbProps = {
    viewMode: 'half',
    orbMenuGap: 8,
    isVisualizerEnabled: true,
    isVisualizerActive: false,
    orbSize: 130,
    orbImageSrc: orbImageSrc,
    displayIsSpillEnabled: isSpillEnabled,
    displayScale: orbImageScale ?? 1,
    orbImageScaleW: orbImageScaleW ?? 1,
    orbImageScaleH: orbImageScaleH ?? 1,
    displayX: orbImageXOffset ?? 0,
    displayY: orbImageYOffset ?? 0,
    fileInputRef: { current: null },
    handleOrbImageUpload: () => {},
    getInspectTitle: (label) => label,
    theme: THEMES.blue || { accent: 'text-sky-500' },
    setFullscreenInfoBlanked: () => {},
    setViewMode: () => {},
    setCurrentPage: () => {},
    handlePlaylistNav: () => {},
    handleItemNav: () => {},
    activePage: 1,
    isOrbPreviewMode: false,
    orbNavPlaylistId: null,
    setOrbNavPlaylistId: () => {},
    orbNavOrbId: null,
    setOrbNavOrbId: () => {},
    activeNavigationMode: 'orb',
    setActiveNavigationMode: () => {},
    bannerNavPlaylistId: null,
    setBannerNavPlaylistId: () => {},
    bannerNavBannerId: null,
    setBannerNavBannerId: () => {},
    bannerPresets: [],
    displayOrbSpill: orbSpill || { tl: true, tr: true, bl: true, br: true },
    displayOrbAdvancedMasks: orbAdvancedMasks || {},
    displayOrbMaskRects: orbMaskRects || {},
    displayOrbMaskModes: orbMaskModes || {},
    displayOrbMaskPaths: orbMaskPaths || {}
  };

  // Pattern matcher for title attributes
  const getExplanationForTitle = (titleAttr, menuId) => {
    if (!titleAttr) return null;
    const lower = titleAttr.toLowerCase();

    if (menuId === 'playlist') {
      if (lower.includes('cyberpunk') || lower.includes('playlist:')) return playlistExplanations.title;
      if (lower.includes('more options')) return playlistExplanations.moreOptions;
      if (lower.includes('history back')) return playlistExplanations.historyBack;
      if (lower.includes('history page') || lower.includes('watch history')) return playlistExplanations.historyPage;
      if (lower.includes('history forward')) return playlistExplanations.historyForward;
      if (lower.includes('add to playlist') || lower.includes('plus')) return playlistExplanations.plusAdd;
      if (lower.includes('group carousel') || lower.includes('library mode') || lower.includes('carousel:')) return playlistExplanations.groupCarousel;
      if (lower.includes('previous playlist')) return playlistExplanations.prevPlaylist;
      if (lower.includes('playlists grid')) return playlistExplanations.playlistsGrid;
      if (lower.includes('next playlist')) return playlistExplanations.nextPlaylist;
    } else if (menuId === 'video') {
      if (lower.includes('previous video')) return videoExplanations.prevVideo;
      if (lower.includes('videos grid')) return videoExplanations.videosGrid;
      if (lower.includes('next video')) return videoExplanations.nextVideo;
      if (lower.includes('cycle folder')) return videoExplanations.folderCycle;
      if (lower.includes('star folder')) return videoExplanations.starFolder;
      if (lower.includes('shuffle')) return videoExplanations.shuffle;
      if (lower.includes('pin')) return videoExplanations.pinButton;
      if (lower.includes('like video')) return videoExplanations.likeButton;
      if (lower.includes('tutorial') || lower.includes('guide')) return videoExplanations.guideButton;
    } else if (menuId === 'orb') {
      if (lower.includes('orb configuration')) return orbExplanations.orbConfig;
      if (lower.includes('banner customization') || lower.includes('app banner')) return orbExplanations.bannerPage;
      if (lower.includes('youtube api') || lower.includes('key')) return orbExplanations.apiKey;
      if (lower.includes('navigation mode') || lower.includes('switch to banner') || lower.includes('switch to orb')) return orbExplanations.navModeToggle;
      if (lower.includes('home explorer') || lower.includes('main grid')) return orbExplanations.homeExplorer;
      if (lower.includes('previous orb playlist') || lower.includes('previous banner category')) return orbExplanations.prevPlaylist;
      if (lower.includes('previous orb') || lower.includes('previous banner item')) return orbExplanations.prevItem;
      if (lower.includes('next orb playlist') || lower.includes('next banner category')) return orbExplanations.nextPlaylist;
      if (lower.includes('next orb') || lower.includes('next banner item')) return orbExplanations.nextItem;
    }
    return null;
  };

  // Hover detection handler
  const handleContainerMouseMove = (e) => {
    const titledElement = e.target.closest('[title]');
    if (titledElement) {
      const titleAttr = titledElement.getAttribute('title');
      const matched = getExplanationForTitle(titleAttr, selectedMenuId);
      if (matched) {
        setHoveredInfo(matched);
        return;
      }
    }
    setHoveredInfo(null);
  };

  const activeInfo = hoveredInfo || (
    selectedMenuId === 'playlist' ? defaultPlaylistInfo :
    selectedMenuId === 'video' ? defaultVideoInfo : defaultOrbInfo
  );
  const InfoIcon = activeInfo.icon || Info;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsControlTutorialOpen(false);
          setSelectedMenuId(null);
        }
      }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 select-none animate-in fade-in duration-150"
    >
      {/* SVG ClipPath Generator for Orb Crop & Spillover */}
      <svg 
        key={`modal-orb-clip-gen-${JSON.stringify(orbMaskModes)}-${JSON.stringify(orbMaskPaths)}`}
        width="0" height="0" style={{ position: 'absolute' }}
      >
        <defs>
          <clipPath id="orbClipPath-default" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
            {['tl', 'tr', 'bl', 'br'].map(q => {
              if (!isSpillEnabled || !orbSpill?.[q]) return null;
              const defaults = {
                tl: { x: -1.0, y: -0.5, w: 1.5, h: 1.0 },
                tr: { x: 0.5, y: -0.5, w: 1.0, h: 1.0 },
                bl: { x: -1.0, y: 0.5, w: 1.5, h: 1.5 },
                br: { x: 0.5, y: 0.5, w: 1.0, h: 1.5 }
              };
              if (!orbAdvancedMasks?.[q]) {
                const d = defaults[q];
                return <rect key={q} x={d.x} y={d.y} width={d.w} height={d.h} />;
              }
              const mode = orbMaskModes?.[q] || 'rect';
              if (mode === 'path') {
                const points = orbMaskPaths?.[q] || [];
                if (points.length < 3) return <rect key={q} x={defaults[q].x} y={defaults[q].y} width={defaults[q].w} height={defaults[q].h} />;
                const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x / 100).toFixed(4)} ${(p.y / 100).toFixed(4)}`).join(' ') + ' Z';
                return <path key={q} d={d} />;
              } else {
                const r = orbMaskRects?.[q] || { x: 0, y: 0, w: 50, h: 50 };
                return <rect key={q} x={r.x / 100} y={r.y / 100} width={r.w / 100} height={r.h / 100} />;
              }
            })}
          </clipPath>
        </defs>
      </svg>
      {/* --- VIEW 1: SPRITESHEET MENU SELECTION (When selectedMenuId is null) --- */}
      {selectedMenuId === null ? (
        <div className="relative w-full max-w-6xl flex flex-col items-center justify-center min-h-[380px]">
          
          {/* Clear Floating Close Button in Top-Right */}
          <button 
            onClick={() => {
              setIsControlTutorialOpen(false);
              setSelectedMenuId(null);
            }}
            className="absolute -top-12 right-0 md:top-0 md:-right-4 flex items-center gap-2 bg-white text-[#052F4A] hover:bg-rose-50 hover:text-rose-600 border-2 border-[#052F4A] px-4 py-1.5 rounded-full font-black text-xs shadow-2xl transition-all hover:scale-105 active:scale-95"
            title="Close Guide"
          >
            <span>Close</span>
            <X size={16} strokeWidth={3} />
          </button>

          {/* Floating Menu UIs (Spritesheet Layout) */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-8 w-full">
            
            {/* Sprite 1: Top Playlist Menu */}
            <div 
              onClick={() => setSelectedMenuId('playlist')}
              className="cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 drop-shadow-2xl"
              title="Top Playlist Menu - Click to inspect"
            >
              <div className="pointer-events-none">
                <PlayerControllerPlaylistMenu {...mockPlaylistProps} />
              </div>
            </div>

            {/* Sprite 2: Central Orb Menu */}
            <div 
              onClick={() => setSelectedMenuId('orb')}
              className="cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 drop-shadow-2xl group"
              title="Central Orb Menu - Click to inspect"
            >
              <div className="pointer-events-none">
                <PlayerControllerOrbMenu {...mockOrbProps} />
              </div>
            </div>

            {/* Sprite 3: Top Video Menu */}
            <div 
              onClick={() => setSelectedMenuId('video')}
              className="cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 drop-shadow-2xl"
              title="Top Video Menu - Click to inspect"
            >
              <div className="pointer-events-none">
                <PlayerControllerVideoMenu {...mockVideoProps} />
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* --- VIEW 2: DETAILED 1:1 INSPECTION VIEW (When selectedMenuId is set) --- */
        <div className="relative w-full max-w-5xl flex flex-col items-center justify-center min-h-[380px] animate-in zoom-in-95 duration-150">
          
          {/* Floating Top Control Bar */}
          <div className="w-full flex items-center justify-between mb-6 px-2">
            <button
              onClick={() => {
                setSelectedMenuId(null);
                setHoveredInfo(null);
              }}
              className="flex items-center gap-1.5 text-xs font-black bg-white hover:bg-sky-100 text-[#052F4A] border-2 border-[#052F4A] px-3.5 py-1.5 rounded-full transition-all shadow-xl hover:scale-105 active:scale-95 group"
              title="Return to Menu Selection"
            >
              <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Menus</span>
            </button>

            <button 
              onClick={() => {
                setIsControlTutorialOpen(false);
                setSelectedMenuId(null);
              }}
              className="flex items-center gap-2 bg-white text-[#052F4A] hover:bg-rose-50 hover:text-rose-600 border-2 border-[#052F4A] px-4 py-1.5 rounded-full font-black text-xs shadow-xl transition-all hover:scale-105 active:scale-95"
              title="Close Guide"
            >
              <span>Close</span>
              <X size={16} strokeWidth={3} />
            </button>
          </div>

          {/* Floating 1:1 Inspection View Body (Left UI + Right Explainer) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">
            
            {/* LEFT HALF: 1:1 LIVE SUBCOMPONENT (6 Cols) */}
            <div 
              className="md:col-span-6 flex items-center justify-center p-4"
              onMouseMove={handleContainerMouseMove}
              onMouseOver={handleContainerMouseMove}
              onMouseLeave={() => setHoveredInfo(null)}
            >
              {selectedMenuId === 'playlist' && (
                <div className="transform hover:scale-[1.02] transition-transform drop-shadow-2xl">
                  <PlayerControllerPlaylistMenu {...mockPlaylistProps} />
                </div>
              )}

              {selectedMenuId === 'orb' && (
                <div className="transform hover:scale-105 transition-transform group drop-shadow-2xl">
                  <PlayerControllerOrbMenu {...mockOrbProps} />
                </div>
              )}

              {selectedMenuId === 'video' && (
                <div className="transform hover:scale-[1.02] transition-transform drop-shadow-2xl">
                  <PlayerControllerVideoMenu {...mockVideoProps} />
                </div>
              )}
            </div>

            {/* RIGHT HALF: MINIMALIST FLOATING EXPLANATION CARD (6 Cols) */}
            <div className="md:col-span-6 p-2">
              <div className="bg-white/95 border-2 border-[#052F4A] text-[#052F4A] rounded-2xl p-6 shadow-2xl backdrop-blur-md animate-in fade-in duration-150" key={activeInfo.title}>
                
                {/* Title & Icon Header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                  <InfoIcon size={18} className="text-[#052F4A] shrink-0" strokeWidth={2.5} />
                  <h3 className="font-black text-sm text-[#052F4A] tracking-tight uppercase">{activeInfo.title}</h3>
                </div>

                {/* All-in-One Description Paragraph */}
                <div className="text-xs text-slate-700 leading-relaxed font-medium pt-3">
                  {activeInfo.renderDescription ? activeInfo.renderDescription() : activeInfo.description}
                </div>

              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
