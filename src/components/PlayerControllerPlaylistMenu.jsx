import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Play, Home, List, Shuffle, Grid3X3, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, CheckCircle2, X, Settings2, Pin, Share2, Info, BarChart2, Bookmark, MoreHorizontal, Heart, ListMusic, Zap, Radio, Flame, ChevronsLeft, ChevronsRight, Upload, Palette, History as HistoryIcon, Layout, Layers, Compass, Library, Eye, EyeOff, RotateCcw, ThumbsUp, Plus, Smartphone, Monitor, Anchor as AnchorIcon, Type, MousePointer2, ArrowLeftRight, Circle, Settings, Move, LayoutGrid, Clock, HelpCircle } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useNavigationStore } from '../store/navigationStore';
import { usePinStore } from '../store/pinStore';
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
import useLongPress from '../hooks/useLongPress';
import { invoke, listen } from '../api/platformBridge';


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

// Convert hex color to HSL hue
const hexToHue = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return 0;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 3 && cleanHex.length !== 6) return 0;
  
  let r = 255, g = 255, b = 255;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return Math.round(h * 360);
};

// Convert HSL to Hex
const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
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
  color: '#052F4A'
};

// Badge text: solid dark blue
const BADGE_TEXT_STYLE = {
  color: '#052F4A',
  fontWeight: 900
};

export default function PlayerControllerPlaylistMenu(props) {
  const {
    visualizerMode = 'bar',
    setVisualizerMode,
    quickAssignSlots,
    visualizerColor = '#ffffff',
    setVisualizerColor,
    fullscreenBanner,
    bannerPreviewMode,
    bannerNavBannerId,
    bannerPresets,
    playlistPinSlotMode = 'pin',
    setPlaylistPinSlotMode
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
    leftAltNavX,
    playlistCheckpoint,
    handleCommit,
    getInspectTitle,
    handleRevert,
    groups,
    activeGroupId,
    setActiveGroupId,
    activePage,
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
    setPlaylistItems,
    setCurrentVideoIndex,
    activeNavButton,
    navChevronSize,
    setActiveNavButton,
    handleHistoryBack,
    historyIndex,
    historyStack,
    handleHistoryForward,
    navigatePlaylist
  } = props;

  const groupsOnPage = (groups || []).filter(g => (g.page || 1) === (activePage || 1) && g.playlistIds && g.playlistIds.length > 0);

  const setViewMode = useLayoutStore(state => state.setViewMode);
  const fullscreenInfoBlanked = useLayoutStore(state => state.fullscreenInfoBlanked);

  const currentPage = useNavigationStore(state => state.currentPage);
  const setCurrentPage = useNavigationStore(state => state.setCurrentPage);
  const setShowPlaylists = usePlaylistStore(state => state.setShowPlaylists);

  return (
    <div className="flex items-center justify-end origin-right scale-105">
      {/* PLAYLIST SECTION */}
      <div className="flex items-center gap-4 relative z-10 flex-shrink-0">
        <div className="absolute right-full mr-4 transition-transform" style={{
          transform: `translateX(${leftAltNavX}px)`
        }}>
          <div className="flex items-center gap-4 animate-in slide-in-from-right-2 duration-300">
            <div className="flex flex-col gap-3 w-9 h-24 items-center justify-center">
              {playlistCheckpoint !== null && <><button onClick={() => handleCommit('playlist')} className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-emerald-500 text-white active:scale-90" title={getInspectTitle('Commit playlist preview')}><Check size={20} strokeWidth={3} /></button><button onClick={() => handleRevert('playlist')} className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-rose-500 text-white active:scale-90" title={getInspectTitle('Revert playlist preview')}><X size={20} strokeWidth={3} /></button></>}
            </div>
            {/* Playlist Preview Navigation Menu */}
            {showPreviewMenus && <div className={`w-8 ${theme.menuBg} border ${theme.menuBorder} rounded-lg shadow-sm flex flex-col justify-between items-center py-2 shrink-0 animate-in fade-in zoom-in-95 duration-200`} style={{
              height: `${menuHeight}px`
            }}>
                <button onClick={() => handleAltNav('up', 'playlist')} onTouchStart={() => handleAltNav('up', 'playlist')} className="text-black p-1" title={getInspectTitle('Previous playlist in preview')}><ChevronUp size={18} strokeWidth={3} /></button>
              <div className={`w-full h-px ${theme.bottomBar} my-1`} />
              <button onClick={() => handleAltNav('down', 'playlist')} onTouchStart={() => handleAltNav('down', 'playlist')} className="text-black p-1" title={getInspectTitle('Next playlist in preview')}><ChevronDown size={18} strokeWidth={3} /></button>
            </div>}
          </div>
        </div>
        <div className={`shadow-2xl flex flex-col relative overflow-visible transition-all duration-300 group/playlist ${isEditMode ? 'ring-4 ring-sky-400/30' : 'bg-transparent rounded-2xl'}`} style={{
          width: `${menuWidth}px`,
          height: `${menuHeight}px`
        }}>
          {/* Solid Light Card Backdrop Layer */}
          <div 
            aria-hidden="true" 
            className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0 border-2 border-[#052F4A] shadow-xl bg-slate-100"
          />
          <div 
            className="flex-grow flex flex-col items-center justify-center px-4 relative z-10 overflow-x-visible overflow-y-hidden w-full h-full min-h-0" 
            {...useLongPress(handleShufflePlaylist, handlePlaylistsGrid)}
            onContextMenu={e => {
              e.preventDefault();
              e.stopPropagation();
              handleShufflePlaylist();
            }}
          >
            <h1 ref={playlistTitleRef} className="font-black text-center leading-tight line-clamp-3 tracking-tight transition-all pb-1 cursor-pointer hover:opacity-90 select-none text-[#052F4A]" style={{
              fontSize: `${titleFontSize}px`,
              pointerEvents: 'none'
            }} title={`${playlistTitle} (Long-press for mega shuffle)`}>
              {playlistTitle}
            </h1>

            {/* Badges Container */}
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0 mb-0.5 animate-in fade-in zoom-in duration-300 overflow-visible min-w-0">

              {/* Active Preset Badge */}
              {activePresetId !== 'all' && (() => {
                const activePreset = safePresets.find(p => p.id === activePresetId);
                if (!activePreset) return null;
                return <span key="badge-preset" className="text-[11px] font-black uppercase tracking-[0.15em] px-1 inline-flex items-center leading-none" style={BADGE_TEXT_STYLE}>
                  {activePreset.name}
                </span>;
              })()}

              {/* Active Tab Badge */}
              {activeTabId !== 'all' && (() => {
                const activeTab = safeTabs.find(t => t.id === activeTabId);
                if (!activeTab) return null;
                return <span key="badge-tab" className="text-[11px] font-black uppercase tracking-[0.15em] px-1 inline-flex items-center leading-none" style={BADGE_TEXT_STYLE}>
                  {activeTab.name}
                </span>;
              })()}


            </div>

          </div>

          <div className="border-t-2 border-[#052F4A]/20 flex items-center px-6 shrink-0 relative rounded-b-2xl bg-transparent" style={{
            height: `${bottomBarHeight}px`
          }}>
            <div className="w-full h-full flex items-center relative">

              {/* Left Side (2 items evenly spaced) */}
              <div className="flex-1 flex items-center justify-evenly h-full pr-4">
                {/* 1. More Options / Settings Menu */}
                <div className="relative flex items-center justify-center -translate-x-6">
                  <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} onTouchStart={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="flex items-center justify-center group/tool" title={getInspectTitle('More options')}>
                    <span style={ICON_WHITE_OUTLINE}>
                      <MoreHorizontal size={Math.round(bottomIconSize * 0.5)} color="#052F4A" strokeWidth={3} />
                    </span>
                  </button>
                  {isMoreMenuOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-sky-50 border border-sky-300 rounded-lg shadow-xl overflow-hidden z-[10001] animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1" style={{
                    zIndex: 10001
                  }}>
                    <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => {
                      setShowPreviewMenus(!showPreviewMenus);
                      setIsMoreMenuOpen(false);
                    }} onTouchStart={() => {
                      setShowPreviewMenus(!showPreviewMenus);
                      setIsMoreMenuOpen(false);
                    }}>
                      {showPreviewMenus ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPreviewMenus ? 'Hide Preview Menus' : 'Show Preview Menus'}
                    </button>

                    <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => {
                      toggleDevToolbar();
                      setIsMoreMenuOpen(false);
                    }} onTouchStart={() => {
                      toggleDevToolbar();
                      setIsMoreMenuOpen(false);
                    }}>
                      {showDevToolbar ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showDevToolbar ? 'Hide Dev Toolbar' : 'Show Dev Toolbar'}
                    </button>



                    <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => {
                      document.getElementById('banner-upload').click();
                      setIsMoreMenuOpen(false);
                    }} onTouchStart={() => {
                      document.getElementById('banner-upload').click();
                      setIsMoreMenuOpen(false);
                    }}>
                      <Upload size={14} />
                      Change Banner
                    </button>

                    <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => {
                      setIsVisualizerEnabled(!isVisualizerEnabled);
                      // Do not close menu if enabling so user can choose style
                      if (isVisualizerEnabled) setIsMoreMenuOpen(false);
                    }} onTouchStart={() => {
                      setIsVisualizerEnabled(!isVisualizerEnabled);
                      if (isVisualizerEnabled) setIsMoreMenuOpen(false);
                    }}>
                      {isVisualizerEnabled ? <EyeOff size={14} /> : <Eye size={14} />}
                      {isVisualizerEnabled ? 'Hide Audio Visualizer' : 'Show Audio Visualizer'}
                    </button>

                    {/* Visualizer Mode Switcher */}
                    {isVisualizerEnabled && (
                      <>
                        <div className="px-2 py-1.5 border-t border-sky-200 mt-1">
                          <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1 px-1">Style</div>
                          <div className="flex bg-sky-200/50 p-0.5 rounded-lg border border-sky-300 gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setVisualizerMode('bar'); }}
                              onTouchStart={(e) => { e.stopPropagation(); setVisualizerMode('bar'); }}
                              className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${visualizerMode === 'bar' ? 'bg-sky-500 text-white shadow-sm' : 'text-sky-800 hover:bg-sky-200/50'}`}
                            >
                              Bar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setVisualizerMode('light'); }}
                              onTouchStart={(e) => { e.stopPropagation(); setVisualizerMode('light'); }}
                              className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${visualizerMode === 'light' ? 'bg-sky-500 text-white shadow-sm' : 'text-sky-800 hover:bg-sky-200/50'}`}
                            >
                              Light 1
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setVisualizerMode('light2'); }}
                              onTouchStart={(e) => { e.stopPropagation(); setVisualizerMode('light2'); }}
                              className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${visualizerMode === 'light2' ? 'bg-sky-500 text-white shadow-sm' : 'text-sky-800 hover:bg-sky-200/50'}`}
                            >
                              Light 2
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setVisualizerMode('bubble'); }}
                              onTouchStart={(e) => { e.stopPropagation(); setVisualizerMode('bubble'); }}
                              className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${visualizerMode === 'bubble' ? 'bg-sky-500 text-white shadow-sm' : 'text-sky-800 hover:bg-sky-200/50'}`}
                            >
                              Bubble
                            </button>
                          </div>
                        </div>

                        {/* Visualizer Color Picker */}
                        <div className="px-2 py-1.5 border-t border-sky-200">
                          <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1.5 px-1 flex justify-between items-center">
                            <span>Color</span>
                            <span className="text-[9px] font-medium text-sky-600 bg-sky-200/50 px-1.5 py-0.5 rounded">
                              {visualizerColor === '#ffffff' ? 'Default' : 'Custom'}
                            </span>
                          </div>
                          
                          {/* Presets + Color Input */}
                          <div className="flex items-center gap-1.5 mb-2 px-1">
                            {/* White (Default) */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setVisualizerColor('#ffffff'); }}
                              onTouchStart={(e) => { e.stopPropagation(); setVisualizerColor('#ffffff'); }}
                              className={`w-5 h-5 rounded-full border shadow-sm transition-all relative ${visualizerColor === '#ffffff' ? 'ring-2 ring-sky-500 scale-110 border-sky-400' : 'border-sky-300 hover:scale-105'}`}
                              style={{ backgroundColor: '#ffffff' }}
                              title="Default White"
                            >
                              {visualizerColor === '#ffffff' && <Check size={10} className="text-black absolute inset-0 m-auto font-black" strokeWidth={4} />}
                            </button>
                            
                            {/* Curated Presets */}
                            {[
                              { name: 'Sky Blue', hex: '#38bdf8' },
                              { name: 'Rose Pink', hex: '#f43f5e' },
                              { name: 'Emerald Green', hex: '#10b981' },
                              { name: 'Purple', hex: '#a855f7' },
                              { name: 'Amber', hex: '#f59e0b' }
                            ].map((preset) => (
                              <button
                                key={preset.hex}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setVisualizerColor(preset.hex); }}
                                onTouchStart={(e) => { e.stopPropagation(); setVisualizerColor(preset.hex); }}
                                className={`w-5 h-5 rounded-full border shadow-sm transition-all relative ${visualizerColor === preset.hex ? 'ring-2 ring-sky-500 scale-110 border-sky-400' : 'border-sky-300 hover:scale-105'}`}
                                style={{ backgroundColor: preset.hex }}
                                title={preset.name}
                              >
                                {visualizerColor === preset.hex && <Check size={10} className="text-white absolute inset-0 m-auto font-black" strokeWidth={4} />}
                              </button>
                            ))}

                            {/* Custom Color Input Palette button */}
                            <label className="relative w-5 h-5 rounded-full border border-sky-300 hover:scale-105 transition-all cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-400 via-emerald-400 to-sky-400">
                              <Palette size={10} className="text-white" strokeWidth={3} />
                              <input
                                type="color"
                                value={visualizerColor && visualizerColor.startsWith('#') ? visualizerColor : '#ffffff'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  setVisualizerColor(e.target.value);
                                }}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              />
                            </label>
                          </div>

                          {/* Sliding rainbow gradient */}
                          <div className="px-1 flex items-center gap-2">
                            <div className="flex-1 relative h-3 rounded-full overflow-hidden border border-sky-300" style={{
                              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                            }}>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={hexToHue(visualizerColor)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const hue = e.target.value;
                                  const hex = hslToHex(hue, 100, 50);
                                  setVisualizerColor(hex);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              {/* Visual slider thumb indicator since original input is hidden */}
                              <div 
                                className="absolute top-0 bottom-0 w-1.5 bg-white border border-black shadow-md pointer-events-none"
                                style={{
                                  left: `calc(${hexToHue(visualizerColor) / 360 * 100}% - 3px)`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    <input type="file" id="banner-upload" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                  </div>}
                </div>

                {/* 2. History Clock Icon */}
                <div className="relative flex items-center justify-center h-full -translate-x-[5px]">
                  <div className="absolute -left-6 opacity-100 pointer-events-auto">
                    <button onClick={handleHistoryBack} onTouchStart={handleHistoryBack} className="p-0.5 text-[#052F4A] hover:scale-110 active:scale-95 transition-transform" title="History Back (Older)">
                      <ChevronLeft size={navChevronSize} strokeWidth={3} />
                    </button>
                  </div>

                  <button onClick={() => console.log('History button clicked')} className={`flex items-center justify-center group/tool transition-all ${historyIndex >= Math.min(historyStack.length - 1, 5) || historyStack.length <= 1 ? historyIndex === 0 ? 'opacity-30' : '' : ''}`} title={getInspectTitle('History')}>
                    <span style={ICON_WHITE_OUTLINE}>
                      <Clock size={Math.round(bottomIconSize * 0.5)} color="#052F4A" strokeWidth={3} />
                    </span>
                  </button>

                  <div className="absolute -right-6 opacity-100 pointer-events-auto">
                    <button onClick={handleHistoryForward} onTouchStart={handleHistoryForward} className="p-0.5 text-[#052F4A] hover:scale-110 active:scale-95 transition-transform" title="History Forward (Newer)">
                      <ChevronRight size={navChevronSize} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Plus Button - Absolute Centered */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 w-10">
                <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} onTouchStart={() => setIsAddMenuOpen(!isAddMenuOpen)} className="flex items-center justify-center group/tool" title={getInspectTitle('Add to Playlist')}>
                  <span style={ICON_WHITE_OUTLINE}>
                    <Plus size={Math.round(bottomIconSize * 0.5)} color="#052F4A" strokeWidth={3} />
                  </span>
                </button>
                {isAddMenuOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[280px] bg-sky-50 border border-sky-300 rounded-lg shadow-xl overflow-hidden z-[10001] animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1" style={{
                  zIndex: 10001
                }}>
                  <div className="flex border-b border-sky-200">
                    <button className="flex-1 text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2 font-semibold" onClick={() => handleAddClipboardToQuickVideos(false)} onTouchStart={() => handleAddClipboardToQuickVideos(false)} title="Add clipboard to Quick Videos playlist">
                      <Plus size={14} className="text-sky-700 shrink-0" />
                      <span className="truncate">Add to quick videos</span>
                    </button>
                    <button className="px-4 hover:bg-sky-200 transition-colors flex items-center justify-center border-l border-sky-200 text-sky-900 shrink-0" onClick={() => handleAddClipboardToQuickVideos(true)} onTouchStart={() => handleAddClipboardToQuickVideos(true)} title="Add and Play immediately">
                      <Play size={14} className="fill-current" />
                    </button>
                  </div>
                  <div className="flex border-b border-sky-200">
                    <button className="flex-1 text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2 font-semibold" onClick={() => handleAddClipboardToCurrentPlaylist(false)} onTouchStart={() => handleAddClipboardToCurrentPlaylist(false)} title="Add clipboard to Current Playlist">
                      <Plus size={14} className="text-sky-700 shrink-0" />
                      <span className="truncate">Add to current playlist</span>
                    </button>
                    <button className="px-4 hover:bg-sky-200 transition-colors flex items-center justify-center border-l border-sky-200 text-sky-900 shrink-0" onClick={() => handleAddClipboardToCurrentPlaylist(true)} onTouchStart={() => handleAddClipboardToCurrentPlaylist(true)} title="Add and Play immediately">
                      <Play size={14} className="fill-current" />
                    </button>
                  </div>
                  {/* Dynamic Quick Assign Slots */}
                  {(quickAssignSlots || [null, null, null, null]).map((slot, idx) => {
                    const isAssigned = slot && slot.id && slot.name;
                    return (
                      <div key={idx} className={`flex ${idx < 3 ? 'border-b border-sky-100/60' : ''}`}>
                        <button
                          disabled={!isAssigned}
                          className={`flex-1 text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors overflow-hidden ${isAssigned ? 'text-sky-950 hover:bg-sky-100 font-medium' : 'text-slate-400 italic cursor-not-allowed'}`}
                          onClick={() => isAssigned && handleAddClipboardToTargetPlaylist(slot.id, false)}
                          onTouchStart={() => isAssigned && handleAddClipboardToTargetPlaylist(slot.id, false)}
                          title={isAssigned ? `Add clipboard to ${slot.name}` : `Empty Quick Assign Slot ${idx + 1}`}
                        >
                          <Plus size={14} className={`shrink-0 ${isAssigned ? "text-sky-600" : "text-slate-300"}`} />
                          <span className="truncate">Add to {isAssigned ? slot.name : `[EMPTY SLOT ${idx + 1}]`}</span>
                        </button>
                        <button
                          disabled={!isAssigned}
                          className={`px-4 flex items-center justify-center border-l border-sky-100/60 transition-colors shrink-0 ${isAssigned ? 'text-sky-900 hover:bg-sky-100' : 'text-slate-300 cursor-not-allowed'}`}
                          onClick={() => isAssigned && handleAddClipboardToTargetPlaylist(slot.id, true)}
                          onTouchStart={() => isAssigned && handleAddClipboardToTargetPlaylist(slot.id, true)}
                          title={isAssigned ? "Add and Play immediately" : undefined}
                        >
                          <Play size={14} className={isAssigned ? "fill-current" : ""} />
                        </button>
                      </div>
                    );
                  })}
                </div>}
              </div>

              {/* Right Side (2 items evenly spaced) */}
              <div className="flex-1 flex items-center justify-evenly h-full pl-4">
                {/* 4. Group Carousel Dot Button */}
                <div className="relative flex items-center justify-center h-full">
                  {(() => {
                    const folderColor = singleGroupForBadge?.folderColorId
                      ? getFolderColorById(singleGroupForBadge.folderColorId)
                      : null;
                    const dotHex = folderColor ? folderColor.hex : (singleGroupForBadge ? '#8b5cf6' : '#052F4A');
                    const isAll = !singleGroupForBadge;

                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isAll) {
                            setActiveGroupId(groupsOnPage && groupsOnPage[0] ? groupsOnPage[0].id : null);
                          } else {
                            setActiveGroupId(null);
                          }
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isAll) {
                            setActiveGroupId(groupsOnPage && groupsOnPage[0] ? groupsOnPage[0].id : null);
                          } else {
                            setActiveGroupId(null);
                          }
                        }}
                        className="flex items-center justify-center group/tool hover:scale-110 active:scale-95 transition-transform"
                        title={singleGroupForBadge ? `Carousel: ${singleGroupForBadge.name} (Click for ALL)` : 'Showing ALL Playlists (Click to switch to Carousels)'}
                      >
                        <span style={ICON_WHITE_OUTLINE} className="flex items-center justify-center">
                          <Circle 
                            size={Math.round(bottomIconSize * 0.5)} 
                            fill={isAll ? '#38bdf8' : dotHex} 
                            color="#052F4A" 
                            strokeWidth={3} 
                          />
                        </span>
                      </button>
                    );
                  })()}
                </div>

                {/* 5. Grid Button */}
                <div className="relative flex items-center justify-center h-full translate-x-[14px]">
                  <div className="absolute -left-6 opacity-100 pointer-events-auto">
                    <button onClick={() => navigatePlaylist('down')} onTouchStart={() => navigatePlaylist('down')} className="p-0.5 text-[#052F4A] hover:scale-110 active:scale-95 transition-transform" title={getInspectTitle('Previous playlist')}>
                      <ChevronLeft size={navChevronSize} strokeWidth={3} />
                    </button>
                  </div>

                  <button onClick={handlePlaylistsGrid} onTouchStart={handlePlaylistsGrid} className="flex items-center justify-center group/tool transition-all" title={getInspectTitle('View playlists grid')}>
                    <span style={ICON_WHITE_OUTLINE}>
                      <Menu size={Math.round(bottomIconSize * 0.5)} color="#052F4A" strokeWidth={3} />
                    </span>
                  </button>

                  <div className="absolute -right-6 opacity-100 pointer-events-auto">
                    <button onClick={() => navigatePlaylist('up')} onTouchStart={() => navigatePlaylist('up')} className="p-0.5 text-[#052F4A] hover:scale-110 active:scale-95 transition-transform" title={getInspectTitle('Next playlist')}>
                      <ChevronRight size={navChevronSize} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow relative z-10" />
        </div>
      </div>

    </div>
  );
}
