import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Home, List, Shuffle, Grid3X3, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, CheckCircle2, X, Settings2, Pin, Share2, Info, BarChart2, Bookmark, MoreHorizontal, Heart, ListMusic, Zap, Radio, Flame, ChevronsLeft, ChevronsRight, Upload, Palette, History as HistoryIcon, Layout, Layers, Compass, Library, Eye, EyeOff, RotateCcw, ThumbsUp, Plus, Anchor as AnchorIcon, Type, MousePointer2, ArrowLeftRight, Circle, Settings, Move, LayoutGrid, Clock, HelpCircle } from 'lucide-react';
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
import { getAllPlaylists, getPlaylistItems, getAllFoldersWithVideos, getVideosInFolder, getAllStuckFolders, assignVideoToFolder, unassignVideoFromFolder, getVideoFolderAssignments, createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getFolderMetadata, getWatchHistory, setSetting } from '../api/playlistApi';
import { getThumbnailUrl, extractVideoId, fetchVideoMetadata } from '../utils/youtubeUtils';
import { getFolderColorById, FOLDER_COLORS } from '../utils/folderColors';
import { THEMES } from '../utils/themes';
import AudioVisualizer from './AudioVisualizer';
import useLongPress from '../hooks/useLongPress';

// Sub-component for menu buttons to handle long-press correctly
const MenuButton = ({ 
  onClick, 
  onLongPress, 
  onMouseDown, 
  onMouseUp, 
  onMouseLeave, 
  className, 
  style, 
  title, 
  children 
}) => {
  const longPress = useLongPress(onLongPress, onClick);
  
  // If onMouseDown is provided, it's a special button (like Pin) that manages its own timing
  if (onMouseDown) {
    return (
      <button
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onContextMenu={onLongPress}
        className={className}
        style={style}
        title={title}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      {...longPress}
      onContextMenu={onLongPress}
      className={className}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
};

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

export default function PlayerControllerVideoMenu(props) {
  const {
    fullscreenBanner,
    bannerPreviewMode,
    bannerNavBannerId,
    bannerPresets
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

  const {
    viewMode,
    isEditMode,
    menuWidth,
    menuHeight,
    showColorPicker,
    setShowColorPicker,
    setHoveredColorName,
    getInspectTitle,
    dotMenuY,
    dotMenuWidth,
    dotMenuHeight,
    dotSize,
    quickShuffleColor,
    handleColorSelect,
    quickAssignColor,
    titleFontSize,
    displayVideo,
    bottomBarHeight,
    hoveredColorName,
    handlePrevVideo,
    navChevronSize,
    handleVideosGrid,
    setFullscreenInfoBlanked,
    setViewMode,
    setCurrentPage,
    bottomIconSize,
    handleNextVideo,
    handlePlayButtonToggle,
    playButtonRightClickRef,
    currentFolder,
    handleShuffle,
    shuffleButtonX,
    handleStarClick,
    handleStarAlignToPlay,
    starButtonX,
    currentVideoFolders,
    handlePinMouseDown,
    handlePinMouseUp,
    handlePinMouseLeave,
    pinFirstButtonX,
    activeVideoItem,
    currentVideo,
    isPriorityPin,
    isPinned,
    isFollowerPin,
    handleLikeClick,
    likeButtonX,
    isVideoLiked,
    likeColor,
    tooltipButtonX,
    setIsTooltipOpen,
    isTooltipOpen,
    rightAltNavX,
    showPreviewMenus,
    theme,
    handleAltNav,
    videoCheckpoint,
    handleCommit,
    handleRevert,
    discoveryButtonX
  } = props;

  const youtubeApiKey = useConfigStore(state => state.youtubeApiKey);
  const setYoutubeApiKey = useConfigStore(state => state.setYoutubeApiKey);

  const [typedApiKey, setTypedApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // null | 'validating' | 'success' | 'error'
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isTooltipOpen) {
      setTypedApiKey(youtubeApiKey || '');
      setValidationStatus(null);
      setValidationError('');
    }
  }, [isTooltipOpen, youtubeApiKey]);

  const handleTestAndSave = async () => {
    if (!typedApiKey.trim()) {
      setValidationStatus('error');
      setValidationError('API Key cannot be empty.');
      return;
    }

    setValidationStatus('validating');
    setValidationError('');

    const testVideoId = 'dQw4w9WgXcQ'; // Rick Astley
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${testVideoId}&key=${typedApiKey.trim()}`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          // Success! Save it
          await setSetting('youtube_api_key', typedApiKey.trim());
          setYoutubeApiKey(typedApiKey.trim());
          setValidationStatus('success');
        } else {
          setValidationStatus('error');
          setValidationError('API Key is valid but cannot find test video details.');
        }
      } else {
        const errData = await response.json();
        setValidationStatus('error');
        setValidationError(errData?.error?.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      setValidationStatus('error');
      setValidationError(error.message || 'Network error.');
    }
  };

  const handleClearKey = async () => {
    await setSetting('youtube_api_key', '');
    setYoutubeApiKey(null);
    setTypedApiKey('');
    setValidationStatus(null);
    setValidationError('');
  };

  return (
    <div className={`flex items-center ${viewMode === 'full' ? 'justify-start' : 'justify-center'} origin-left scale-90`}>
      <div className="flex items-center gap-4 relative z-10 flex-shrink-0">
        <div className={`shadow-2xl flex flex-col relative overflow-visible transition-all duration-300 ${isEditMode ? 'ring-4 ring-sky-400/30' : 'bg-transparent rounded-2xl'}`} style={{
          width: `${menuWidth}px`,
          height: `${menuHeight}px`
        }}>
          {/* Solid App Banner Gradient Backdrop Layer */}
          <div 
            aria-hidden="true" 
            className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0 border border-white/20 shadow-2xl bg-slate-950"
          >
            {/* Blurred App Banner Image Layer */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${bannerImage})`,
              backgroundPosition: `${bannerHorizontal}% ${bannerVertical}%`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: `${bannerScale}vw auto`,
              filter: 'blur(36px)',
              opacity: 0.85,
              transform: 'scale(1.25)',
            }} />
            {/* Depth Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
          </div>
          {showColorPicker && <button onClick={() => {
            setShowColorPicker(null);
            setHoveredColorName(null);
          }} className="absolute -top-3 -right-3 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 z-50 shadow-lg border-2 border-white transition-all active:scale-90" title={getInspectTitle('Close color picker')}><X size={16} strokeWidth={3} /></button>}
          <div className="absolute top-0 left-0 w-full flex items-center -translate-y-1/2 z-40 px-2 pointer-events-none h-0">
            {/* Normal pins track removed per user request */}
          </div>
          {/* Header Metadata - Centered above (Mirrors Playlist Title) */}
          {/* Header Metadata - Removed from here, moved to Playlist Menu */}

          <div className="flex-grow flex flex-col items-center justify-center px-4 relative z-10 overflow-hidden">
            {showColorPicker ? <div className="flex flex-col items-center animate-in zoom-in duration-200" style={{
              transform: `translateY(${dotMenuY}px)`
            }}>
              <p className="text-[9px] font-black uppercase text-sky-600 tracking-[0.2em] mb-3">Accent: {showColorPicker}</p>
              <div className="grid grid-cols-7 gap-1.5 p-2.5 bg-white/60 backdrop-blur-md rounded-2xl border border-sky-200 shadow-inner overflow-hidden flex items-center justify-center" style={{
                width: `${dotMenuWidth}px`,
                height: `${dotMenuHeight}px`
              }}>
                {/* Add "All" option for shuffle */}
                {showColorPicker === 'shuffle' && (
                  <MenuButton
                    onMouseEnter={() => setHoveredColorName('All')}
                    onMouseLeave={() => setHoveredColorName(null)}
                    className="rounded-full cursor-pointer border-2 shadow-sm hover:scale-125 transition-transform shrink-0 relative"
                    style={{
                      backgroundColor: '#ffffff',
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      borderColor: quickShuffleColor === 'all' ? '#000' : 'white',
                      borderWidth: quickShuffleColor === 'all' ? '3px' : '2px'
                    }}
                    onClick={() => handleColorSelect('#ffffff', 'all', false)}
                    onLongPress={(e) => {
                      if (e && e.preventDefault) e.preventDefault();
                      handleColorSelect('#ffffff', 'all', true);
                    }}
                    title={quickShuffleColor === 'all' ? 'All (Quick Shuffle - Long press to change)' : 'All (Long press to set as Quick Shuffle)'}
                  />
                )}
                {COLORS.map(c => (
                  <MenuButton
                    key={c.hex}
                    onMouseEnter={() => setHoveredColorName(c.name)}
                    onMouseLeave={() => setHoveredColorName(null)}
                    className="rounded-full cursor-pointer border-2 shadow-sm hover:scale-125 transition-transform shrink-0 relative"
                    style={{
                      backgroundColor: c.hex,
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      borderColor: showColorPicker === 'star' ? c.id === quickAssignColor ? '#000' : 'white' : showColorPicker === 'shuffle' ? c.id === quickShuffleColor ? '#000' : 'white' : 'white',
                      borderWidth: showColorPicker === 'star' ? c.id === quickAssignColor ? '3px' : '2px' : showColorPicker === 'shuffle' ? c.id === quickShuffleColor ? '3px' : '2px' : '2px'
                    }}
                    onClick={() => handleColorSelect(c.hex, c.id, false)}
                    onLongPress={(e) => {
                      if (e && e.preventDefault) e.preventDefault();
                      handleColorSelect(c.hex, c.id, true);
                    }}
                    title={showColorPicker === 'star' ? c.id === quickAssignColor ? `${c.name} (Quick Assign - Long press to change)` : `${c.name} (Long press to set as Quick Assign)` : showColorPicker === 'shuffle' ? c.id === quickShuffleColor ? `${c.name} (Quick Shuffle - Long press to change)` : `${c.name} (Long press to set as Quick Shuffle)` : c.name}
                  />
                ))}
              </div>
            </div> : <div className="w-full flex flex-col justify-center transition-all relative h-full">
              <h1 className="font-black text-center leading-tight line-clamp-3 tracking-tight transition-all pb-1" style={{
                fontSize: `${titleFontSize}px`,
                color: 'white',
                WebkitTextStroke: '1px #000',
                textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
              }}>
                {displayVideo.title}
              </h1>
            </div>}
          </div>
          <div className="border-t border-sky-300/50 flex items-center px-3 shrink-0 relative rounded-b-2xl bg-transparent" style={{
            height: `${bottomBarHeight}px`
          }}>
            {showColorPicker ? <div className="flex items-center justify-center w-full h-full animate-in fade-in slide-in-from-bottom-1 duration-300"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-700/80">{hoveredColorName || `Select ${showColorPicker} color`}</span></div> : <div className="w-full h-full relative">
              {/* Navigation Controls - Now Absolute Centered */}
              {/* Navigation Contols (Left Cluster - "Far Left") - Mirrored from Playlist */}
              {/* Previous Video - Left of Grid */}
              <button onClick={handlePrevVideo} className="absolute left-1/2 top-1/2 p-0.5 text-black" style={{
                transform: `translate(calc(-50% - 148px), -50%)`
              }} title={getInspectTitle('Previous video')}>
                <ChevronLeft size={navChevronSize} strokeWidth={3} />
              </button>

              {/* Video Grid Button - Center of Cluster */}
              <MenuButton
                onClick={handleVideosGrid}
                onLongPress={(e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  if (viewMode === 'full') {
                    setFullscreenInfoBlanked(true);
                    requestAnimationFrame(() => {
                      setViewMode('half');
                      setCurrentPage('history');
                    });
                  } else {
                    setCurrentPage('history');
                  }
                }}
                className="absolute left-1/2 top-1/2 flex items-center justify-center group/tool"
                style={{
                  transform: `translate(calc(-50% - 120px), -50%)`
                }}
                title={getInspectTitle('View videos grid (Long-press for history)')}
              >
                <span style={ICON_WHITE_OUTLINE}>
                  <svg width={Math.round(bottomIconSize * 0.55)} height={Math.round(bottomIconSize * 0.55)} viewBox="0 0 24 24" fill="none" style={{
                    color: 'white'
                  }}>
                    {/* 3x3 grid of dots like a dice face */}
                    <circle cx="6" cy="6" r="2" fill="currentColor" />
                    <circle cx="12" cy="6" r="2" fill="currentColor" />
                    <circle cx="18" cy="6" r="2" fill="currentColor" />
                    <circle cx="6" cy="12" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <circle cx="18" cy="12" r="2" fill="currentColor" />
                    <circle cx="6" cy="18" r="2" fill="currentColor" />
                    <circle cx="12" cy="18" r="2" fill="currentColor" />
                    <circle cx="18" cy="18" r="2" fill="currentColor" />
                  </svg>
                </span>
              </MenuButton>

              {/* Next Video - Right of Grid */}
              <button onClick={handleNextVideo} className="absolute left-1/2 top-1/2 p-0.5 text-black" style={{
                transform: `translate(calc(-50% - 92px), -50%)`
              }} title={getInspectTitle('Next video')}>
                <ChevronRight size={navChevronSize} strokeWidth={3} />
              </button>

              <MenuButton
                onClick={() => handlePlayButtonToggle('forward')}
                onLongPress={(e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  const now = Date.now();
                  if (now - playButtonRightClickRef.current < 300) {
                    // Double right click (or quick double tap) detected -> Reset to all
                    handlePlayButtonToggle('reset');
                  } else {
                    // Single right click (or long press) -> Reverse cycle
                    handlePlayButtonToggle('reverse');
                  }
                  playButtonRightClickRef.current = now;
                }}
                className="absolute left-1/2 top-1/2 flex items-center justify-center group/tool"
                style={{
                  transform: `translate(calc(-50% - 60px), -50%)`
                }}
                title={getInspectTitle('Cycle Folder Filter (Tap: Forward, Long-press: Reverse)')}
              >
                {(() => {
                  const activeColorData = currentFolder ? FOLDER_COLORS.find(c => c.id === currentFolder.folder_color) : null;
                  const activeColorHex = activeColorData ? activeColorData.hex : '#cbd5e1';
                  const isColored = !!activeColorData;
                  if (isColored) {
                    return <span style={ICON_WHITE_OUTLINE}>
                      <Play size={Math.round(bottomIconSize * 0.5)} color={activeColorHex} fill={activeColorHex} strokeWidth={0} />
                    </span>;
                  }
                  return <span style={ICON_WHITE_OUTLINE}>
                    <Play size={Math.round(bottomIconSize * 0.5)} color="white" fill="white" strokeWidth={0} />
                  </span>;
                })()}
              </MenuButton>

              {/* Tool Buttons - Absolute Centered */}
              <MenuButton
                onClick={() => handleShuffle()}
                onLongPress={(e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  setShowColorPicker('shuffle');
                }}
                className="absolute left-1/2 top-1/2 flex items-center justify-center group/tool"
                style={{
                  transform: `translate(calc(-50% + ${shuffleButtonX}px), -50%)`
                }}
                title={getInspectTitle('Shuffle videos (Long-press for color selection)')}
              >
                {(() => {
                  const shuffleColorObj = quickShuffleColor === 'all' ? {
                    hex: '#000',
                    name: 'All'
                  } : FOLDER_COLORS.find(c => c.id === quickShuffleColor) || FOLDER_COLORS.find(c => c.id === 'indigo');
                  if (shuffleColorObj.hex === '#000') {
                    return <span style={ICON_WHITE_OUTLINE}>
                      <Shuffle size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                    </span>;
                  }
                  return <Shuffle size={Math.round(bottomIconSize * 0.5)} color={shuffleColorObj.hex} strokeWidth={3} />;
                })()}
              </MenuButton>

              <MenuButton
                onClick={() => handleStarClick()}
                onLongPress={(e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  handleStarAlignToPlay();
                }}
                className="absolute left-1/2 top-1/2 flex items-center justify-center group/tool"
                style={{
                  transform: `translate(calc(-50% + ${starButtonX}px), -50%)`
                }}
                title={getInspectTitle('Star button (Tap: assign to folder, Long-press: filter to this color)')}
              >
                {(() => {
                  const firstFolder = currentVideoFolders.length > 0 ? currentVideoFolders[0] : null;
                  const folderColorObj = firstFolder ? FOLDER_COLORS.find(c => c.id === firstFolder) : null;
                  if (folderColorObj) {
                    return <span style={ICON_WHITE_OUTLINE}>
                      <Star size={Math.round(bottomIconSize * 0.5)} color={folderColorObj.hex} fill={folderColorObj.hex} strokeWidth={3} />
                    </span>;
                  }
                  return <span style={ICON_WHITE_OUTLINE}>
                    <Star size={Math.round(bottomIconSize * 0.5)} color="white" fill="transparent" strokeWidth={3} />
                  </span>;
                })()}
              </MenuButton>

              <MenuButton
                onMouseDown={handlePinMouseDown}
                onMouseUp={handlePinMouseUp}
                onMouseLeave={handlePinMouseLeave}
                onLongPress={(e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  if (viewMode === 'full') {
                    setFullscreenInfoBlanked(true);
                    requestAnimationFrame(() => {
                      setViewMode('half');
                      setCurrentPage('pins');
                    });
                  } else {
                    setCurrentPage('pins');
                  }
                }}
                className="absolute left-1/2 top-1/2 flex items-center justify-center group/tool"
                style={{
                  transform: `translate(calc(-50% + ${pinFirstButtonX}px), -50%)`
                }}
                title={getInspectTitle('Pin Video (Click: Pin/Follower, Hold: Priority, Double-click: Unpin, Long-press: Pins Page)')}
              >
                {(() => {
                  const targetVideo = activeVideoItem || currentVideo;
                  const isPriority = targetVideo && isPriorityPin(targetVideo.id);
                  const isNormalPinned = targetVideo && isPinned(targetVideo.id) && !isPriority;
                  const isFollower = targetVideo && isFollowerPin(targetVideo.id);
                  
                  let iconColor = 'white';
                  let iconFill = 'transparent';
                  let strokeWidth = 2.5;
                  if (isPriority) {
                    iconColor = '#fbbf24';
                    iconFill = '#fbbf24';
                    strokeWidth = 1.5;
                  } else if (isNormalPinned) {
                    iconColor = '#3b82f6';
                    iconFill = '#3b82f6';
                    strokeWidth = 1.5;
                  }
                  const iconSize = Math.round(bottomIconSize * 0.5);
                  return <span style={ICON_WHITE_OUTLINE}>
                    {isFollower ? (
                      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
                        <g transform="translate(-3, -3) scale(0.75)">
                          <path d="M12 17v5" fill={iconFill} />
                          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-6 0v4.76Z" fill={iconFill} />
                        </g>
                        <g transform="translate(3, 3) scale(0.75)">
                          <path d="M12 17v5" fill={iconFill} />
                          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-6 0v4.76Z" fill={iconFill} />
                        </g>
                      </svg>) : <Pin size={iconSize} color={iconColor} fill={iconFill} strokeWidth={strokeWidth} />}
                  </span>;
                })()}
              </MenuButton>

              <MenuButton
                onClick={handleLikeClick}
                onLongPress={(e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  if (viewMode === 'full') {
                    setFullscreenInfoBlanked(true);
                    requestAnimationFrame(() => {
                      setViewMode('half');
                      setCurrentPage('likes');
                    });
                  } else {
                    setCurrentPage('likes');
                  }
                }}
                className="absolute left-1/2 top-1/2 flex items-center justify-center group/tool"
                style={{
                  transform: `translate(calc(-50% + ${likeButtonX}px), -50%)`
                }}
                title={getInspectTitle('Like button (Long-press for Likes)')}
              >
                {isVideoLiked ? <span style={ICON_WHITE_OUTLINE}>
                  <ThumbsUp size={Math.round(bottomIconSize * 0.5)} color={likeColor} fill={likeColor} strokeWidth={3} />
                </span> : <span style={ICON_WHITE_OUTLINE}>
                  <ThumbsUp size={Math.round(bottomIconSize * 0.5)} color="white" fill="transparent" strokeWidth={3} />
                </span>}
              </MenuButton>

              {/* Tooltip Button */}
              <div className="absolute left-1/2 top-1/2" style={{
                transform: `translate(calc(-50% + ${tooltipButtonX}px), -50%)`
              }}>
                <button onClick={() => setIsTooltipOpen(!isTooltipOpen)} className="flex items-center justify-center group/tool relative" title={getInspectTitle('YouTube API Settings')}>
                  <span style={ICON_WHITE_OUTLINE}>
                    <Info size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                  </span>
                </button>

                {isTooltipOpen && <div className="absolute top-full right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-[10002] animate-in fade-in zoom-in-95 duration-200 p-4 text-xs text-slate-200 font-medium" style={{
                  zIndex: 10002
                }}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                      <span className="font-bold text-slate-100 uppercase tracking-wider text-[10px]">YouTube API Key</span>
                      {youtubeApiKey && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">Configured</span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Input your personal YouTube Data API v3 key to enable search, playlist import, and subscriptions.
                    </p>

                    <div className="relative flex items-center mt-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={typedApiKey}
                        onChange={(e) => setTypedApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg p-2 pr-9 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-[10px] shadow-inner transition-colors"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowKey(!showKey)} 
                        className="absolute right-2 text-slate-400 hover:text-slate-200 transition-colors"
                        title={showKey ? 'Hide key' : 'Show key'}
                      >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {validationStatus === 'validating' && (
                      <div className="text-[9px] text-sky-400 flex items-center gap-1.5 py-0.5 animate-pulse">
                        <Circle size={8} className="fill-sky-400 animate-ping" />
                        <span>Validating API key against Google servers...</span>
                      </div>
                    )}

                    {validationStatus === 'success' && (
                      <div className="text-[9px] text-emerald-400 flex items-center gap-1.5 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded p-1.5">
                        <CheckCircle2 size={12} className="shrink-0" />
                        <span>Success! API Key validated and saved.</span>
                      </div>
                    )}

                    {validationStatus === 'error' && (
                      <div className="text-[9px] text-rose-400 flex items-start gap-1.5 py-0.5 bg-rose-500/5 border border-rose-500/20 rounded p-1.5 leading-normal">
                        <X size={12} className="shrink-0 mt-0.5" />
                        <span className="break-all">{validationError}</span>
                      </div>
                    )}

                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleTestAndSave}
                        disabled={validationStatus === 'validating'}
                        className="flex-1 bg-sky-600 text-white rounded-lg py-1.5 font-bold hover:bg-sky-500 transition-colors disabled:opacity-50 active:scale-95 text-[10px]"
                      >
                        Test & Save
                      </button>
                      {youtubeApiKey && (
                        <button
                          onClick={handleClearKey}
                          className="bg-slate-800 text-slate-300 border border-slate-700 rounded-lg px-2.5 hover:bg-slate-700 hover:text-white transition-all text-[10px]"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <a 
                      href="https://developers.google.com/youtube/v3/getting-started" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[9px] text-sky-400 hover:underline text-center mt-1 font-semibold flex items-center justify-center gap-1 no-drag"
                    >
                      How to get a YouTube API Key
                    </a>
                  </div>
                </div>}
              </div>

            </div>}
          </div>
        </div>
        <div className="absolute left-full ml-4 transition-transform" style={{
          transform: `translateX(${rightAltNavX}px)`
        }}>
        </div>
        <div className="absolute left-full ml-4 transition-transform" style={{
          transform: `translateX(${rightAltNavX}px)`
        }}>
          <div className="flex items-center gap-4 animate-in slide-in-from-left-2 duration-300">
            {/* Video Preview Navigation Menu */}
            {showPreviewMenus && <div className={`w-8 ${theme.menuBg} border ${theme.menuBorder} rounded-lg shadow-sm flex flex-col justify-between items-center py-2 shrink-0 animate-in fade-in zoom-in-95 duration-200`} style={{
              height: `${menuHeight}px`
            }}>
              <button onClick={() => handleAltNav('up', 'video')} className="text-black p-1" title={getInspectTitle('Previous video in preview')}><ChevronUp size={18} strokeWidth={3} /></button>
              <div className={`w-full h-px ${theme.bottomBar} my-1`} />
              <button onClick={() => handleAltNav('down', 'video')} className="text-black p-1" title={getInspectTitle('Next video in preview')}><ChevronDown size={18} strokeWidth={3} /></button>
            </div>}
            <div className="flex flex-col gap-3 w-9 h-24 items-center justify-center">
              {videoCheckpoint !== null && <><button onClick={() => handleCommit('video')} className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-emerald-500 text-white transition-all active:scale-90 animate-in zoom-in duration-200" title={getInspectTitle('Commit video preview')}><Check size={20} strokeWidth={3} /></button><button onClick={() => handleRevert('video')} className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-rose-500 text-white transition-all active:scale-90 animate-in zoom-in duration-200" title={getInspectTitle('Revert video preview')}><X size={20} strokeWidth={3} /></button></>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
