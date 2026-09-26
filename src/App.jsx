import React, { useState, useEffect, useRef } from 'react';
import LayoutShell from './LayoutShell';
import AudioVisualizer from './components/AudioVisualizer';
import PlayerController from './components/PlayerController';
import PlaylistsButton from './components/PlaylistsButton';
import PlaylistList from './components/PlaylistList';
import TopNavigation from './components/TopNavigation';
import PlaylistsPage from './components/PlaylistsPage';
import VideosPage from './components/VideosPage';
import HistoryPage from './components/HistoryPage';
import LikesPage from './components/LikesPage';
import PinsPage from './components/PinsPage';
import TasksPage from './components/TasksPage';
import OrbPage from './components/OrbPage';
import YouPage from './components/YouPage';
import AppPage from './components/AppPage';
import AssetManagerPage from './components/AssetManagerPage';
import BrowserPage from './components/BrowserPage';
import TweetPage from './components/TweetPage';
import MainSettingsPage from './components/MainSettingsPage';
import InlineBannerCropMode from './components/InlineBannerCropMode';
import ExplorerPage from './components/ExplorerPage';

import { listen, invoke } from './api/platformBridge';
import { AnimatePresence } from 'framer-motion';

import YouTubePlayer from './components/YouTubePlayer';
import LocalVideoPlayer from './components/LocalVideoPlayer';
import NativeVideoPlayer from './components/NativeVideoPlayer';
import { useLayoutStore } from './store/layoutStore';
import { usePlaylistStore } from './store/playlistStore';
import { useNavigationStore } from './store/navigationStore';
import { useConfigStore } from './store/configStore';
import { initializeTestData } from './utils/initDatabase';
import { addToWatchHistory, getWatchHistory, getAllPlaylists, getPlaylistItems, getSetting } from './api/playlistApi';
import { extractVideoId } from './utils/youtubeUtils';
import { clearOldPlaybackKeys } from './utils/storageUtils';
import SupportPage from './components/SupportPage';
import OrbConfigPlaceholderPage from './components/OrbConfigPlaceholderPage';
import SettingsPlaceholderPage from './components/SettingsPlaceholderPage';
import { THEMES } from './utils/themes';
import './App.css';

function App() {
  const { viewMode, setViewMode, menuQuarterMode, toggleMenuQuarterMode, showDebugBounds, toggleDebugBounds, inspectMode, toggleInspectMode, showRuler, toggleRuler, showDevToolbar } = useLayoutStore();

  // Helper to get inspect label
  const getInspectTitle = (label) => inspectMode ? label : undefined;
  const { showPlaylists, setShowPlaylists, setPlaylistItems, currentPlaylistItems, currentPlaylistId, currentVideoIndex, setCurrentVideoIndex } = usePlaylistStore();
  const { currentPage, setCurrentPage } = useNavigationStore();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [secondPlayerVideoUrl, setSecondPlayerVideoUrl] = useState(null);

  const [secondPlayerVideoIndex, setSecondPlayerVideoIndex] = useState(0); // Track second player's video index
  const [secondPlayerPlaylistId, setSecondPlayerPlaylistId] = useState(null); // Track second player's playlist ID
  const [secondPlayerPlaylistItems, setSecondPlayerPlaylistItems] = useState([]); // Track second player's playlist items
  const [activePlayer, setActivePlayer] = useState(1); // 1 = main player, 2 = mode 2 (alternative video in main player)
  const [currentThemeId, setCurrentThemeId] = useState('blue'); // Theme state lifted from PlayerController

  // Mode 1 checkpoint - saves state before entering mode 2
  const [mode1Checkpoint, setMode1Checkpoint] = useState(null); // { videoUrl, playlistId, videoIndex, playlistItems }

  // Debug logging
  useEffect(() => {
    console.log('=== APP STATE DEBUG ===');
    console.log('showPlaylists:', showPlaylists);
    console.log('dbInitialized:', dbInitialized);
    console.log('viewMode:', viewMode);
    console.log('currentPage:', currentPage);
  }, [showPlaylists, dbInitialized, viewMode, currentPage]);


  useEffect(() => {
    // Clear orphaned playback keys from localStorage
    clearOldPlaybackKeys();
  }, []);

  // --- Android Right-Click Polyfill ---
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // 1. Track mouse position globally
    const handleMouseMove = (e) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    // 2. Listen for 'android-back-pressed' from Rust (triggered by Right Click on many Android devices)
    let unlisten;
    const setupAndroidListener = async () => {
      unlisten = await listen('android-back-pressed', () => {
        console.log('[AndroidPolyfill] Back button detected as Right Click');
        // Manually trigger contextmenu event at last known mouse position
        const target = document.elementFromPoint(lastMousePos.current.x, lastMousePos.current.y) || document.body;
        const contextMenuEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          buttons: 2,
          clientX: lastMousePos.current.x,
          clientY: lastMousePos.current.y
        });
        target.dispatchEvent(contextMenuEvent);
      });
    };

    // 3. Direct mousedown listener for button 2 (some mice might actually send this)
    const handleMouseDown = (e) => {
      if (e.button === 2) {
        console.log('[AndroidPolyfill] Native Right Click detected');
        // If it's a native button 2, we just let it through, but we can log it
      }
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mousedown', handleMouseDown, true);
    setupAndroidListener();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mousedown', handleMouseDown, true);
      if (unlisten) unlisten();
    };
  }, []);

  // Initialize database with test data on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeTestData();
        setDbInitialized(true);

        // Load YouTube API Key
        try {
          const key = await getSetting('youtube_api_key');
          if (key) {
            useConfigStore.setState({ youtubeApiKey: key });
            console.log('Loaded YouTube API Key from database.');
          }
        } catch (error) {
          console.error('Failed to load YouTube API Key setting:', error);
        }

        // Load most recent video from watch history
        try {
          const history = await getWatchHistory(1);
          if (history && history.length > 0) {
            const mostRecent = history[0];
            const videoId = mostRecent.video_id;

            // Find which playlist contains this video
            const allPlaylists = await getAllPlaylists();
            for (const playlist of allPlaylists) {
              try {
                const items = await getPlaylistItems(playlist.id);
                const videoIndex = items.findIndex(item => item.video_id === videoId);
                if (videoIndex >= 0) {
                  // Found the playlist - load it and set the video
                  setPlaylistItems(items, playlist.id);
                  setCurrentVideoIndex(videoIndex);
                  console.log('Loaded most recent video from watch history:', mostRecent.video_url);
                  return;
                }
              } catch (error) {
                console.error(`Failed to load playlist ${playlist.id}:`, error);
              }
            }
            console.log('Most recent video not found in any playlist, using default');
          }
        } catch (error) {
          console.error('Failed to load watch history for initialization:', error);
          // Continue with default video
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbInitialized(true); // Set to true anyway to prevent infinite loading
      }
    };
    init();
  }, [setPlaylistItems, setCurrentVideoIndex]);

  // Get current video URL from playlist - make it reactive
  const currentVideoUrl = React.useMemo(() => {
    if (currentPlaylistItems.length > 0 && currentVideoIndex < currentPlaylistItems.length) {
      return currentPlaylistItems[currentVideoIndex].video_url;
    }
    return 'https://www.youtube.com/watch?v=QiemgC39tA0'; // Default fallback
  }, [currentPlaylistItems, currentVideoIndex]);

  // Check if current video is local
  const isCurrentVideoLocal = React.useMemo(() => {
    if (currentPlaylistItems.length > 0 && currentVideoIndex < currentPlaylistItems.length) {
      const item = currentPlaylistItems[currentVideoIndex];
      const isYouTube = item.video_url?.includes('youtube.com') || item.video_url?.includes('youtu.be');
      return item.is_local || !isYouTube;
    }
    if (currentVideoUrl) {
      return !currentVideoUrl.includes('youtube.com') && !currentVideoUrl.includes('youtu.be');
    }
    return false;
  }, [currentPlaylistItems, currentVideoIndex, currentVideoUrl]);

  // Check if second video is local
  const isSecondVideoLocal = React.useMemo(() => {
    if (secondPlayerPlaylistItems.length > 0 && secondPlayerVideoIndex < secondPlayerPlaylistItems.length) {
      const item = secondPlayerPlaylistItems[secondPlayerVideoIndex];
      const isYouTube = item.video_url?.includes('youtube.com') || item.video_url?.includes('youtu.be');
      return item.is_local || !isYouTube;
    }
    if (secondPlayerVideoUrl) {
      return !secondPlayerVideoUrl.includes('youtube.com') && !secondPlayerVideoUrl.includes('youtu.be');
    }
    return false;
  }, [secondPlayerPlaylistItems, secondPlayerVideoIndex, secondPlayerVideoUrl]);

  // Get current video ID
  const currentVideoId = React.useMemo(() => {
    if (currentPlaylistItems.length > 0 && currentVideoIndex < currentPlaylistItems.length) {
      return currentPlaylistItems[currentVideoIndex].video_id;
    }
    return null;
  }, [currentPlaylistItems, currentVideoIndex]);

  // Get the active video URL based on which player is active
  const activeVideoUrl = React.useMemo(() => {
    if (activePlayer === 1) {
      return currentVideoUrl;
    } else {
      return secondPlayerVideoUrl || currentVideoUrl; // Fallback to main if second has no video
    }
  }, [activePlayer, currentVideoUrl, secondPlayerVideoUrl]);

  // Track video plays in watch history
  useEffect(() => {
    const trackVideoPlay = async () => {
      if (!currentVideoUrl || currentVideoUrl === 'https://www.youtube.com/watch?v=QiemgC39tA0') {
        return; // Skip default fallback
      }

      try {
        const currentVideo = currentPlaylistItems.length > 0 && currentVideoIndex < currentPlaylistItems.length
          ? currentPlaylistItems[currentVideoIndex]
          : null;

        const videoId = currentVideo?.video_id || extractVideoId(currentVideoUrl);
        if (!videoId) return;

        const title = currentVideo?.title || null;
        const thumbnailUrl = currentVideo?.thumbnail_url || null;

        // Add to watch history
        await addToWatchHistory(currentVideoUrl, videoId, title, thumbnailUrl);
      } catch (error) {
        console.error('Failed to track video play:', error);
        // Don't show error to user - history tracking is non-critical
      }
    };

    // Only track if database is initialized
    if (dbInitialized) {
      trackVideoPlay();
    }
  }, [currentVideoUrl, dbInitialized, currentPlaylistItems, currentVideoIndex]);



  const handlePlaylistSelect = (items, playlistId) => {
    setPlaylistItems(items, playlistId);
  };

  const handleVideoSelect = async (videoUrl) => {
    // Route to the appropriate player based on active player mode
    if (activePlayer === 1) {
      // Control main player
      // 1. Check currently playing playlist first
      let videoIndex = currentPlaylistItems.findIndex(item => item.video_url === videoUrl);
      if (videoIndex >= 0) {
        setCurrentVideoIndex(videoIndex);
        return;
      }

      // 2. Check the playlist currently being navigated in the Orb/Banner menus
      try {
        const config = useConfigStore.getState();
        const navId = (config.activeNavigationMode === 'orb' ? config.orbNavPlaylistId : config.bannerNavPlaylistId);

        if (navId) {
          const items = await getPlaylistItems(navId);
          videoIndex = items.findIndex(item => item.video_url === videoUrl);
          if (videoIndex >= 0) {
            setPlaylistItems(items, navId);
            if (handlePlaylistSelect) {
              handlePlaylistSelect(items, navId);
            }
            setCurrentVideoIndex(videoIndex);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to check navigated playlist for video:', err);
      }

      // 3. Fallback: Search through all playlists
      try {
        const allPlaylists = await getAllPlaylists();
        for (const playlist of allPlaylists) {
          try {
            const items = await getPlaylistItems(playlist.id);
            const index = items.findIndex(item => item.video_url === videoUrl);
            if (index >= 0) {
              // Found the video - load the playlist and set the index
              setPlaylistItems(items, playlist.id);
              // Also call handlePlaylistSelect to ensure side menu updates if needed
              handlePlaylistSelect(items, playlist.id);
              setCurrentVideoIndex(index);
              break;
            }
          } catch (error) {
            // Continue searching other playlists
            console.error(`Failed to load playlist ${playlist.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to search playlists for video:', error);
      }
    } else {
      // Control second player
      setSecondPlayerVideoUrl(videoUrl);
      // Try to find in second player's playlist first
      let videoIndex = -1;
      if (secondPlayerPlaylistItems.length > 0) {
        videoIndex = secondPlayerPlaylistItems.findIndex(item => item.video_url === videoUrl);
        if (videoIndex >= 0) {
          setSecondPlayerVideoIndex(videoIndex);
          // Keep the second player's playlist - don't change it
          return;
        }
      }
      // If not found in second player's playlist, search all playlists
      // This handles the case where navigation might have moved to a different playlist
      if (videoIndex < 0) {
        // First try current playlist
        videoIndex = currentPlaylistItems.findIndex(item => item.video_url === videoUrl);
        if (videoIndex >= 0) {
          setSecondPlayerVideoIndex(videoIndex);
          setSecondPlayerPlaylistId(currentPlaylistId);
          setSecondPlayerPlaylistItems(currentPlaylistItems);
        } else {
          // If not in current playlist either, search all playlists (similar to handleSecondPlayerSelect)
          try {
            const allPlaylists = await getAllPlaylists();
            for (const playlist of allPlaylists) {
              try {
                const items = await getPlaylistItems(playlist.id);
                const index = items.findIndex(item => item.video_url === videoUrl);
                if (index >= 0) {
                  setSecondPlayerVideoIndex(index);
                  setSecondPlayerPlaylistId(playlist.id);
                  setSecondPlayerPlaylistItems(items);
                  break;
                }
              } catch (error) {
                // Continue searching
                console.error(`Failed to load playlist ${playlist.id}:`, error);
              }
            }
          } catch (error) {
            console.error('Failed to search playlists for video:', error);
          }
        }
      }
    }
  };

  const handleSecondPlayerSelect = async (videoUrl) => {
    // Alternative Mode 2: Save current state as checkpoint, switch to mode 2, load video in main player
    // Only save checkpoint if we're currently in mode 1
    if (activePlayer === 1) {
      // Save current state as mode 1 checkpoint
      setMode1Checkpoint({
        videoUrl: currentVideoUrl,
        playlistId: currentPlaylistId,
        videoIndex: currentVideoIndex,
        playlistItems: [...currentPlaylistItems] // Copy array
      });
    }

    // Find the video in playlists
    let videoIndex = currentPlaylistItems.findIndex(item => item.video_url === videoUrl);
    let foundPlaylistId = currentPlaylistId;
    let foundPlaylistItems = currentPlaylistItems;

    // If not found in current playlist, search through all playlists
    if (videoIndex < 0) {
      try {
        const allPlaylists = await getAllPlaylists();
        for (const playlist of allPlaylists) {
          try {
            const items = await getPlaylistItems(playlist.id);
            const index = items.findIndex(item => item.video_url === videoUrl);
            if (index >= 0) {
              videoIndex = index;
              foundPlaylistId = playlist.id;
              foundPlaylistItems = items;
              break;
            }
          } catch (error) {
            // Continue searching other playlists
            console.error(`Failed to load playlist ${playlist.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to search playlists for video:', error);
      }
    }

    // Load the video in the main player and switch to mode 2
    if (videoIndex >= 0 && foundPlaylistItems.length > 0) {
      // Set playlist items and video index
      setPlaylistItems(foundPlaylistItems, foundPlaylistId);
      setCurrentVideoIndex(videoIndex);

      // Switch to mode 2
      setActivePlayer(2);

      // The video will play via the currentVideoUrl computed value
      // which will update when currentVideoIndex changes
    }
  };

  // Handle mode toggle - restore checkpoint when switching from mode 2 to mode 1
  const handleActivePlayerChange = (newActivePlayer) => {
    if (activePlayer === 2 && newActivePlayer === 1 && mode1Checkpoint) {
      // Restore mode 1 checkpoint
      setPlaylistItems(mode1Checkpoint.playlistItems, mode1Checkpoint.playlistId);
      setCurrentVideoIndex(mode1Checkpoint.videoIndex);
      // Clear checkpoint after restoring
      setMode1Checkpoint(null);
    }
    setActivePlayer(newActivePlayer);
  };

  // Handle video ended - autoplay next video
  const handleVideoEnded = (endedPlayerId) => {
    console.log(`Video ended in player: ${endedPlayerId}`);

    if (endedPlayerId === 'main') {
      // Main player corresponds to currentPlaylistItems and currentVideoIndex
      const nextIndex = currentVideoIndex + 1;
      if (nextIndex < currentPlaylistItems.length) {
        console.log('Autoplaying next video in main playlist');
        setCurrentVideoIndex(nextIndex);
      } else {
        console.log('Main playlist reached end');
        // Optional: Loop back to start if repeat mode is added later
      }
    } else if (endedPlayerId === 'second') {
      // Second player
      // We have secondPlayerPlaylistItems and secondPlayerVideoIndex
      const nextIndex = secondPlayerVideoIndex + 1;
      if (nextIndex < secondPlayerPlaylistItems.length) {
        console.log('Autoplaying next video in second playlist');
        setSecondPlayerVideoIndex(nextIndex);
        // Since we manually manage second player URL based on index in handleVideoSelect logic (mostly), 
        // but here we aren't using handleVideoSelect. We should update the URL.
        // Note: App.jsx doesn't have a clean "setSecondPlayerIndexAndUrl" but we can do it manually.
        const nextVideo = secondPlayerPlaylistItems[nextIndex];
        if (nextVideo) {
          setSecondPlayerVideoUrl(nextVideo.video_url);
        }
      } else {
        console.log('Second playlist reached end');
      }
    }
  };

  // Get banner crop mode state from config store
  const {
    bannerCropModeActive,
    setBannerCropModeActive,
    fullscreenBanner,
    splitscreenBanner,
    updateFullscreenBanner,
    updateSplitscreenBanner,
    bannerPreviewMode
  } = useConfigStore();

  // Determine active banner for crop mode based on view mode (or preview override)
  const activeBanner = fullscreenBanner;
  // Fallback to defaults if activeBanner is somehow undefined (e.g. during migration re-render)
  const bannerImage = activeBanner?.image;
  const bannerScale = activeBanner?.scale;
  const bannerVerticalPosition = activeBanner?.verticalPosition;
  const bannerHorizontalOffset = activeBanner?.horizontalOffset;
  const bannerSpillHeight = activeBanner?.spillHeight;
  const bannerMaskPath = activeBanner?.maskPath;

  const handleSetMaskPath = (newPath) => {
    const isFullscreenTarget = bannerPreviewMode ? (bannerPreviewMode === 'fullscreen') : (viewMode === 'full');
    if (isFullscreenTarget) {
      updateFullscreenBanner({ maskPath: newPath });
    } else {
      updateSplitscreenBanner({ maskPath: newPath });
    }
  };

  return (
    <div className={`app-container bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${THEMES[currentThemeId].bg}`} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* Main App Content */}
      <>
        {/* Inline Banner Crop Mode - Overlays the actual banner */}
        <InlineBannerCropMode
          isActive={bannerCropModeActive}
          onExit={() => setBannerCropModeActive(false)}
          maskPath={bannerMaskPath}
          setMaskPath={handleSetMaskPath}
          bannerImage={bannerImage || "/banner.PNG"}
          bannerScale={bannerScale}
          bannerVerticalPosition={bannerVerticalPosition}
          bannerHorizontalOffset={bannerHorizontalOffset}
          bannerSpillHeight={bannerSpillHeight}
        />
        {/* View Mode Toggle - Temporary for testing - Controlled by Dev Toolbar Toggle */}
        {showDevToolbar && (
          <div className="view-mode-toggle">
            <button
              onClick={() => setViewMode('full')}
              className={viewMode === 'full' ? 'active' : ''}
              title={getInspectTitle('Full screen view')}
            >
              Full
            </button>
            <button
              onClick={() => setViewMode('half')}
              className={viewMode === 'half' ? 'active' : ''}
              title={getInspectTitle('Half screen view')}
            >
              Half
            </button>
            <button
              onClick={() => setViewMode('quarter')}
              className={viewMode === 'quarter' ? 'active' : ''}
              title={getInspectTitle('Quarter screen view')}
            >
              Quarter
            </button>
            {/* Menu Quarter Mode Toggle - Only visible outside full screen */}
            {viewMode !== 'full' && (
              <button
                onClick={toggleMenuQuarterMode}
                className={menuQuarterMode ? 'active' : ''}
                title={getInspectTitle('Toggle menu quarter mode') || 'Toggle Menu Quarter Mode'}
              >
                Menu Q
              </button>
            )}
            {/* Debug Bounds Toggle */}
            <button
              onClick={toggleDebugBounds}
              className={showDebugBounds ? 'active' : ''}
              title={getInspectTitle('Toggle debug bounds') || 'Toggle Debug Bounds'}
              style={{
                backgroundColor: showDebugBounds ? '#3b82f6' : 'transparent',
                color: showDebugBounds ? 'white' : 'inherit',
                border: '1px solid #3b82f6',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Debug
            </button>
            {/* Inspect Mode Toggle */}
            <button
              onClick={toggleInspectMode}
              className={inspectMode ? 'active' : ''}
              title={getInspectTitle('Toggle inspect mode') || 'Toggle Inspect Mode'}
              style={{
                backgroundColor: inspectMode ? '#8b5cf6' : 'transparent',
                color: inspectMode ? 'white' : 'inherit',
                border: '1px solid #8b5cf6',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              Inspect
            </button>
            {/* Ruler Toggle */}
            <button
              onClick={toggleRuler}
              className={showRuler ? 'active' : ''}
              title={getInspectTitle('Toggle ruler') || 'Toggle Ruler'}
              style={{
                backgroundColor: showRuler ? '#ef4444' : 'transparent',
                color: showRuler ? 'white' : 'inherit',
                border: '1px solid #ef4444',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              Ruler
            </button>
          </div>
        )}

        <LayoutShell
          topController={<PlayerController
            onPlaylistSelect={handlePlaylistSelect}
            onVideoSelect={handleVideoSelect}
            activePlayer={activePlayer}
            onActivePlayerChange={handleActivePlayerChange}
            secondPlayerVideoUrl={secondPlayerVideoUrl}

            secondPlayerVideoIndex={secondPlayerVideoIndex}
            onSecondPlayerVideoIndexChange={setSecondPlayerVideoIndex}
            secondPlayerPlaylistId={secondPlayerPlaylistId}
            secondPlayerPlaylistItems={secondPlayerPlaylistItems}
            currentThemeId={currentThemeId}
            onThemeChange={setCurrentThemeId}
          />}
          mainPlayer={
            isCurrentVideoLocal ? (
              <LocalVideoPlayer
                videoUrl={currentVideoUrl}
                videoId={currentVideoId}
                playerId="main"
                onEnded={() => handleVideoEnded('main')}
                playlistItems={currentPlaylistItems}
              />
            ) : (
              <YouTubePlayer
                videoUrl={currentVideoUrl}
                playerId={currentVideoId}
                onEnded={() => handleVideoEnded('main')}
                playlistItems={currentPlaylistItems}
              />
            )
          }
          secondPlayer={
            secondPlayerVideoUrl ? (
              isSecondVideoLocal ? (
                <LocalVideoPlayer
                  videoUrl={secondPlayerVideoUrl}
                  videoId={secondPlayerPlaylistItems[secondPlayerVideoIndex]?.video_id}
                  playerId="second"
                  onEnded={() => handleVideoEnded('second')}
                  playlistItems={secondPlayerPlaylistItems}
                />
              ) : (
                <YouTubePlayer
                  videoUrl={secondPlayerVideoUrl}
                  playerId={secondPlayerPlaylistItems[secondPlayerVideoIndex]?.video_id}
                  onEnded={() => handleVideoEnded('second')}
                  playlistItems={secondPlayerPlaylistItems}
                />
              )
            ) : null
          }
          miniHeader={
            <div className="w-full h-full flex items-center min-w-0">
              <TopNavigation />
            </div>
          }
          animatedMenu={null}
          spacerMenu={null}
          menuSpacerMenu={null}
          sideMenu={
            showPlaylists && dbInitialized ? (
              (() => {
                console.log('=== RENDERING PLAYLISTLIST IN APP ===');
                console.log('showPlaylists:', showPlaylists);
                console.log('dbInitialized:', dbInitialized);
                return <PlaylistList onPlaylistSelect={handlePlaylistSelect} onVideoSelect={handleVideoSelect} />;
              })()
            ) : showPlaylists && !dbInitialized ? (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-black">Initializing database...</p>
              </div>
            ) : !showPlaylists && currentPage === 'explorer' ? (
              <ExplorerPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'playlists' ? (
              <PlaylistsPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'videos' ? (
              <VideosPage onVideoSelect={handleVideoSelect} onSecondPlayerSelect={handleSecondPlayerSelect} />
            ) : !showPlaylists && currentPage === 'history' ? (
              <HistoryPage onVideoSelect={handleVideoSelect} onSecondPlayerSelect={handleSecondPlayerSelect} />
            ) : !showPlaylists && currentPage === 'likes' ? (
              <LikesPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'pins' ? (
              <PinsPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'tasks' ? (
              <TasksPage />
            ) : !showPlaylists && currentPage === 'orbs' ? (
              <OrbPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'you' ? (
              <YouPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'app' ? (
              <AppPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'browser' ? (
              <BrowserPage />
            ) : !showPlaylists && currentPage === 'assets' ? (
              <AssetManagerPage />
            ) : !showPlaylists && currentPage === 'tweet' ? (
              <TweetPage />

            ) : !showPlaylists && currentPage === 'settings' ? (
              <MainSettingsPage
                onNavigateToOrb={() => setCurrentPage('orbs')}
                onNavigateToApp={() => setCurrentPage('app')}
                onNavigateToYou={() => setCurrentPage('you')}
              />
            ) : !showPlaylists && currentPage === 'support' ? (
              <SupportPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'orb-config' ? (
              <OrbConfigPlaceholderPage onVideoSelect={handleVideoSelect} />
            ) : !showPlaylists && currentPage === 'settings-new' ? (
              <SettingsPlaceholderPage onVideoSelect={handleVideoSelect} />
            ) : null
          }
        />

      </>
    </div>
  );
}

export default App;
