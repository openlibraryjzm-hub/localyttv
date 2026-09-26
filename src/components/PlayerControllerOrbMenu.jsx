import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Folder, Play, Home, List, Shuffle, Grid3X3, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, CheckCircle2, X, Settings2, Pin, Share2, Info, BarChart2, Bookmark, MoreHorizontal, Heart, ListMusic, Zap, Radio, Flame, ChevronsLeft, ChevronsRight, Upload, Palette, History as HistoryIcon, Layout, Layers, Compass, Library, Eye, EyeOff, RotateCcw, ThumbsUp, Plus, Anchor as AnchorIcon, Type, MousePointer2, ArrowLeftRight, Circle, Settings, Move, LayoutGrid, Clock, HelpCircle, Monitor, Smartphone, Dice1, Dice2, Target } from 'lucide-react';
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
import { invoke } from '../api/platformBridge';

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

export default function PlayerControllerOrbMenu(props) {
  const {
    viewMode,
    orbMenuGap,
    isVisualizerEnabled,
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
    getInspectTitle,
    theme,
    setFullscreenInfoBlanked,
    setViewMode,
    setCurrentPage,
    handlePlaylistNav,
    handleItemNav,
    activePage,
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
    displayOrbMaskModes,
    displayOrbMaskPaths
  } = props;

  const clipPathId = `orbClipPath-${isOrbPreviewMode ? 'preview' : (orbNavOrbId || 'default')}`;

  const [buttonCycle, setButtonCycle] = useState(1);

  return (
    <div className="flex items-center justify-center relative group z-30 flex-shrink-0 overflow-visible">

      {/* Audio Visualizer - Around Orb */}
      <AudioVisualizer enabled={isVisualizerEnabled} orbSize={orbSize} barCount={113} barWidth={4} radius={77} radiusY={77} maxBarLength={76} minBarLength={7} colors={[255, 255, 255, 255]} smoothing={0.75} preAmpGain={4.0} angleTotal={Math.PI * 2} angleStart={-Math.PI / 2} clockwise={true} inward={false} fftSize={2048} freqMin={60} freqMax={11000} sensitivity={64} updateRate={16} />

      <div className="flex items-center justify-center transition-all relative overflow-visible z-20" style={{
        width: `${orbSize}px`,
        height: `${orbSize}px`
      }}>
        {/* BACKGROUND LAYER (Underlay - Fully Transparent) */}
        <div className="absolute inset-0 rounded-full pointer-events-none z-0" />

        {/* IMAGE LAYER (Spillover) */}
        <div 
          key={`orb-image-layer-${clipPathId}`}
          className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center z-40 overflow-visible" 
          style={{
            clipPath: `url(#${clipPathId})`
          }}
        >
          <img src={orbImageSrc} alt="" className="max-w-none transition-all duration-500" style={{
            width: displayIsSpillEnabled ? `${orbSize * displayScale * orbImageScaleW}px` : '100%',
            height: displayIsSpillEnabled ? `${orbSize * displayScale * orbImageScaleH}px` : '100%',
            transform: displayIsSpillEnabled ? `translate(${displayX}px, ${displayY}px)` : 'none',
            objectFit: displayIsSpillEnabled ? 'contain' : 'cover'
          }} />
        </div>

        <input type="file" ref={fileInputRef} onChange={handleOrbImageUpload} accept="image/*" className="hidden" />
        
        {/* Cycle Button (Bottom Left) */}
        <button 
          className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" 
          style={{
            left: '15%',
            top: '85%',
            transform: 'translate(-50%, -50%)',
            width: `28px`,
            height: `28px`
          }} 
          onClick={() => setButtonCycle(prev => prev === 1 ? 2 : 1)} 
          onTouchStart={() => setButtonCycle(prev => prev === 1 ? 2 : 1)} 
          title={buttonCycle === 1 ? "Switch to Cycle 2" : "Switch to Cycle 1"}
        >
          {buttonCycle === 1 ? (
            <Dice1 size={16} className={theme.accent} strokeWidth={3} />
          ) : (
            <Dice2 size={16} className={theme.accent} strokeWidth={3} />
          )}
        </button>

        {buttonCycle === 1 && (
          <>

            {/* Orb Config Button (Top Left) */}
            <button onClick={() => {
              if (viewMode === 'full') {
                setFullscreenInfoBlanked(true);
                requestAnimationFrame(() => {
                  setViewMode('half');
                  setCurrentPage('orb-config');
                });
              } else {
                setCurrentPage('orb-config');
              }
            }} onTouchStart={() => {
              if (viewMode === 'full') {
                setFullscreenInfoBlanked(true);
                requestAnimationFrame(() => {
                  setViewMode('half');
                  setCurrentPage('orb-config');
                });
              } else {
                setCurrentPage('orb-config');
              }
            }} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" style={{
              left: '15%',
              top: '15%',
              transform: 'translate(-50%, -50%)',
              width: `28px`,
              height: `28px`
            }} title={getInspectTitle('Orb Config') || 'Orb Config'}>
              <Circle size={14} className="text-black" strokeWidth={2.5} />
            </button>

            {/* Settings Button (Top Right) */}
            <button onClick={() => {
              if (viewMode === 'full') {
                setFullscreenInfoBlanked(true);
                requestAnimationFrame(() => {
                  setViewMode('half');
                  setCurrentPage('app');
                });
              } else {
                setCurrentPage('app');
              }
            }} onTouchStart={() => {
              if (viewMode === 'full') {
                setFullscreenInfoBlanked(true);
                requestAnimationFrame(() => {
                  setViewMode('half');
                  setCurrentPage('app');
                });
              } else {
                setCurrentPage('app');
              }
            }} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" style={{
              left: '85%',
              top: '15%',
              transform: 'translate(-50%, -50%)',
              width: `28px`,
              height: `28px`
            }} title={getInspectTitle('Settings') || 'Settings'}>
              <Settings size={14} className="text-black" strokeWidth={2.5} />
            </button>

            {/* Home Explorer Button (Bottom Center) */}
            <button onClick={() => {
              if (viewMode === 'full') {
                setFullscreenInfoBlanked(true);
                requestAnimationFrame(() => {
                  setViewMode('half');
                  setCurrentPage('explorer');
                });
              } else {
                setCurrentPage('explorer');
              }
            }} onTouchStart={() => {
              if (viewMode === 'full') {
                setFullscreenInfoBlanked(true);
                requestAnimationFrame(() => {
                  setViewMode('half');
                  setCurrentPage('explorer');
                });
              } else {
                setCurrentPage('explorer');
              }
            }} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" style={{
              left: '50%',
              top: '100%',
              transform: 'translate(-50%, -50%)',
              width: `28px`,
              height: `28px`
            }} title={`Explorer (Page ${activePage || 1})`}>
              <span className="text-[14px] font-black text-black leading-none">{activePage || 1}</span>
            </button>

            {/* Navigation Mode Toggle (Bottom Right) */}
            <button onClick={() => setActiveNavigationMode(activeNavigationMode === 'orb' ? 'banner' : 'orb')} onTouchStart={() => setActiveNavigationMode(activeNavigationMode === 'orb' ? 'banner' : 'orb')} className={`absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black text-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300`} style={{
              left: '85%',
              top: '85%',
              transform: 'translate(-50%, -50%)',
              width: `28px`,
              height: `28px`
            }} title={activeNavigationMode === 'orb' ? "Switch to Banner Navigation" : "Switch to Orb Navigation"}>
              {activeNavigationMode === 'orb' ? <Circle size={14} className="text-black" strokeWidth={2.5} /> : <Layout size={14} className="text-black" strokeWidth={2.5} />}
            </button>

            {/* Prev Playlist */}
            <button onClick={() => handlePlaylistNav('prev')} onTouchStart={() => handlePlaylistNav('prev')} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" style={{
              left: '2%',
              top: '38%',
              transform: 'translate(-50%, -50%)',
              width: `28px`,
              height: `28px`
            }} title={activeNavigationMode === 'orb' ? "Previous Orb Playlist" : "Previous Banner Category"}>
              <ChevronsLeft size={14} className="text-black" strokeWidth={2.5} />
            </button>

            {/* Prev Item */}
            <button onClick={() => handleItemNav('prev')} onTouchStart={() => handleItemNav('prev')} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" style={{
              left: '2%',
              top: '62%',
              transform: 'translate(-50%, -50%)',
              width: `28px`,
              height: `28px`
            }} title={activeNavigationMode === 'orb' ? "Previous Orb" : "Previous Banner"}>
              <ChevronLeft size={14} className="text-black" strokeWidth={2.5} />
            </button>

            {/* Next Playlist */}
            <button onClick={() => handlePlaylistNav('next')} onTouchStart={() => handlePlaylistNav('next')} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" style={{
              left: '98%',
              top: '38%',
              transform: 'translate(-50%, -50%)',
              width: `28px`,
              height: `28px`
            }} title={activeNavigationMode === 'orb' ? "Next Orb Playlist" : "Next Banner Category"}>
              <ChevronsRight size={14} className="text-black" strokeWidth={2.5} />
            </button>

            {/* Next Item */}
            <button onClick={() => handleItemNav('next')} onTouchStart={() => handleItemNav('next')} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" style={{
              left: '98%',
              top: '62%',
              transform: 'translate(-50%, -50%)',
              width: `28px`,
              height: `28px`
            }} title={activeNavigationMode === 'orb' ? "Next Orb" : "Next Banner"}>
              <ChevronRight size={14} className="text-black" strokeWidth={2.5} />
            </button>
          </>
        )}

        {buttonCycle === 2 && (
          <>
            {/* Placeholder Button (Bottom Center) */}
            <button 
              className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300" 
              style={{
                left: '50%',
                top: '100%',
                transform: 'translate(-50%, -50%)',
                width: `28px`,
                height: `28px`
              }} 
              onClick={() => console.log('Placeholder clicked')}
              onTouchStart={() => console.log('Placeholder touched')}
              title="Placeholder"
            >
              <HelpCircle size={14} className="text-black" strokeWidth={2.5} />
            </button>
          </>
        )}

      </div>
    </div>
  );
}
