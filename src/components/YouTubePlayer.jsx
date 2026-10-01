import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { updateVideoProgress } from '../api/playlistApi';
import { useLayoutStore } from '../store/layoutStore';
import { usePinStore } from '../store/pinStore';
import { getStoredPlaybackTime, savePlaybackTime } from '../utils/storageUtils';

/**
 * Extracts video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - VIDEO_ID (if already just an ID)
 */
const extractVideoId = (url) => {
  if (!url) return null;

  // If it's already just an ID
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return url;
  }

  // Extract from watch URL
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Extract from youtu.be URL
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
};


// Save video progress to database and handle pin completion (follower pin transfer or unpin)
const saveVideoProgress = async (videoId, videoUrl, duration, currentTime, handlePinCompletion, playlistItems) => {
  try {
    await updateVideoProgress(videoId, videoUrl, duration, currentTime);

    // Handle pin completion if video reached >=85%
    if (duration && duration > 0 && currentTime >= 0) {
      const progressPercentage = (currentTime / duration) * 100;
      if (progressPercentage >= 85 && handlePinCompletion) {
        // handlePinCompletion will either transfer follower pin or unpin normally
        handlePinCompletion(videoId, playlistItems);
      }
    }
  } catch (error) {
    console.error('Failed to save video progress to database:', error);
    // Don't throw - this is non-critical
  }
};

const YouTubePlayer = ({ videoUrl, videoId, playerId = 'default', onEnded, playlistItems = [], ...props }) => {
  const id = videoId || extractVideoId(videoUrl);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const durationRef = useRef(null); // Store video duration
  const [apiReady, setApiReady] = useState(false);
  const { viewMode, screenProtectorActive } = useLayoutStore();
  const { handleFollowerPinCompletion } = usePinStore();

  // Pseudo-Controls State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const uiTickRef = useRef(null);

  // Store playlistItems in a ref so the interval callback has access to latest value
  const playlistItemsRef = useRef(playlistItems);
  useEffect(() => {
    playlistItemsRef.current = playlistItems;
  }, [playlistItems]);

  // Create unique player ID using only player instance ID and a static random tag to prevent React DOM manipulation errors
  const [uniquePlayerId] = useState(() => `youtube-player-${playerId}-${Math.random().toString(36).substr(2, 9)}`);

  // VLC Style Volume Indicator State
  const [volumeIndicator, setVolumeIndicator] = useState({ show: false, val: 0 });
  const hideVolumeTimerRef = useRef(null);

  // Mouse Idle State (Shield Mode)
  const [isIdle, setIsIdle] = useState(false);
  const [isMouseHovered, setIsMouseHovered] = useState(false);
  const idleTimerRef = useRef(null);

  const resetIdleTimer = useCallback(() => {
    setIsMouseHovered(true);
    setIsIdle(false);

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 2500);
  }, []);

  const handleShieldMouseLeave = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    setIsMouseHovered(false);
    setIsIdle(false);
  }, []);

  // Allow clicking the shield to toggle play/pause
  const handleShieldClick = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
      const state = playerRef.current.getPlayerState();
      const playing = window.YT && window.YT.PlayerState && state === window.YT.PlayerState.PLAYING;

      if (playing) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  }, []);

  const handleProgressClick = useCallback((e) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const newTime = pct * duration;
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  }, [duration]);

  const handleProgressMouseMove = useCallback((e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(pct * duration);
    setHoverX(x);
  }, [duration]);

  const handleProgressMouseLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleShieldWheel = useCallback((e) => {
    if (playerRef.current && typeof playerRef.current.getVolume === 'function') {
      const currentVol = playerRef.current.getVolume();
      const change = e.deltaY < 0 ? 5 : -5;
      const newVol = Math.max(0, Math.min(100, currentVol + change));

      playerRef.current.setVolume(newVol);

      setVolumeIndicator({ show: true, val: newVol });

      if (hideVolumeTimerRef.current) {
        clearTimeout(hideVolumeTimerRef.current);
      }
      hideVolumeTimerRef.current = setTimeout(() => {
        setVolumeIndicator(prev => ({ ...prev, show: false }));
      }, 1000);

      window.dispatchEvent(new CustomEvent('youtube-player-volume-change', { detail: { volume: newVol } }));
    }
  }, []);

  const copyVideoLink = useCallback(() => {
    const url = videoUrl || `https://www.youtube.com/watch?v=${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }, [videoUrl, id]);

  const openInYouTube = useCallback(() => {
    const url = videoUrl || `https://www.youtube.com/watch?v=${id}`;
    window.open(url, '_blank');
  }, [videoUrl, id]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {
        setApiReady(true);
      };

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Simple resize when player is ready - just set to 100%
  useEffect(() => {
    if (!apiReady) return;

    const container = document.getElementById(uniquePlayerId);
    if (!container) return;

    const resize = () => {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        const parent = container.parentElement;
        if (parent) {
          // Simple: always 100% of parent
          iframe.style.width = '100%';
          iframe.style.height = '100%';
        }
      }
    };

    // Resize when viewMode changes
    resize();

    // Also resize on window resize
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [apiReady, viewMode, uniquePlayerId]);

  // Initialize player when API is ready and we have a video ID
  useEffect(() => {
    if (!apiReady || !id || !containerRef.current) return;

    // Reset container and insert a fresh div for the player to hijack
    containerRef.current.innerHTML = '';
    const tempDiv = document.createElement('div');
    tempDiv.id = uniquePlayerId;
    tempDiv.style.width = '100%';
    tempDiv.style.height = '100%';
    containerRef.current.appendChild(tempDiv);

    const storedTime = getStoredPlaybackTime(id);

    const playerConfig = {
      videoId: id,
      host: 'https://www.youtube.com',
      playerVars: {
        autoplay: 1,
        start: Math.floor(storedTime),
        enablejsapi: 1,
        origin: window.location.origin || '*',
        controls: screenProtectorActive ? 0 : 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        fs: screenProtectorActive ? 0 : 1,
      },
      events: {
        onReady: (event) => {
          // Get and store video duration
          try {
            const duration = event.target.getDuration();
            if (duration && duration > 0) {
              durationRef.current = duration;
              setDuration(duration);
            }
          } catch (e) {
            console.error('Failed to get video duration:', e);
          }

          // Optional: Verify iframe CSS is locked just in case
          setTimeout(() => {
            if (containerRef.current) {
              const iframe = containerRef.current.tagName.toLowerCase() === 'iframe' ? containerRef.current : containerRef.current.querySelector('iframe');
              if (iframe) {
                iframe.style.width = '100%';
                iframe.style.height = '100%';
              }
            }
          }, 50);

          // Seek to stored time if available
          if (storedTime > 0) {
            const duration = event.target.getDuration();
            // Smart Resume: If stored time is near the end (within 10s as YouTube buffers more, or 95%), start from beginning
            const isNearEnd = storedTime >= duration - 10 || (duration > 0 && storedTime / duration > 0.95);

            if (isNearEnd) {
              console.log('Video finished previously, restarting from 0');
              event.target.seekTo(0, true);
              savePlaybackTime(id, 0);
            } else {
              event.target.seekTo(storedTime, true);
            }
          }
        },
        onStateChange: (event) => {
          // Dispatch global event so external control bars can sync their play/pause buttons
          window.dispatchEvent(new CustomEvent('youtube-player-state-change', {
            detail: { isPlaying: event.data === window.YT.PlayerState.PLAYING }
          }));

          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);

          if (event.data === window.YT.PlayerState.PLAYING) {
            // Start UI tick
            if (uiTickRef.current) clearInterval(uiTickRef.current);
            uiTickRef.current = setInterval(() => {
              if (playerRef.current?.getCurrentTime) {
                setCurrentTime(playerRef.current.getCurrentTime());
              }
            }, 100);

            // Save interval
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            saveIntervalRef.current = setInterval(() => {
              if (playerRef.current && playerRef.current.getCurrentTime) {
                try {
                  const currentTime = playerRef.current.getCurrentTime();
                  const duration = durationRef.current || playerRef.current.getDuration?.() || null;

                  // Save to localStorage for quick access
                  savePlaybackTime(id, currentTime);

                  // Save to database with progress percentage (may trigger follower pin at 85%)
                  saveVideoProgress(id, videoUrl || `https://www.youtube.com/watch?v=${id}`, duration, currentTime, handleFollowerPinCompletion, playlistItemsRef.current);
                } catch (e) {}
              }
            }, 5000); // Save every 5 seconds
          } else {
            if (uiTickRef.current) clearInterval(uiTickRef.current);
            uiTickRef.current = null;
            
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            saveIntervalRef.current = null;
            
            // Save when paused/stopped
            if (playerRef.current && playerRef.current.getCurrentTime) {
              try {
                const currentTime = playerRef.current.getCurrentTime();
                const duration = durationRef.current || playerRef.current.getDuration?.() || null;
                savePlaybackTime(id, currentTime);
                saveVideoProgress(id, videoUrl || `https://www.youtube.com/watch?v=${id}`, duration, currentTime, null, null);
              } catch (e) {}
            }
          }

          // Video ended
          if (event.data === window.YT.PlayerState.ENDED) {
            savePlaybackTime(id, 0);
            const duration = durationRef.current || playerRef.current?.getDuration?.() || 0;
            saveVideoProgress(id, videoUrl || `https://www.youtube.com/watch?v=${id}`, duration, duration, handleFollowerPinCompletion, playlistItemsRef.current);

            if (onEnded) {
              onEnded();
            }
          }
        },
      },
    };

    playerRef.current = new window.YT.Player(uniquePlayerId, playerConfig);

    return () => {
      // Cleanup: save final time and clear interval
      if (playerRef.current) {
        try {
          if (playerRef.current.getCurrentTime) {
            const currentTime = playerRef.current.getCurrentTime();
            const duration = durationRef.current || playerRef.current.getDuration?.() || null;

            // Save to localStorage
            savePlaybackTime(id, currentTime);

            // Save to database with progress percentage (no pin handling on cleanup)
            saveVideoProgress(id, videoUrl || `https://www.youtube.com/watch?v=${id}`, duration, currentTime, null, null);
          }
          if (playerRef.current.destroy) {
            playerRef.current.destroy();
          }
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      if (uiTickRef.current) {
        clearInterval(uiTickRef.current);
      }
      if (hideVolumeTimerRef.current) {
        clearTimeout(hideVolumeTimerRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [apiReady, id, videoUrl, handleFollowerPinCompletion, uniquePlayerId, screenProtectorActive]);

  if (!id) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        <p>Invalid YouTube URL or ID</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group/player">
      <div className="w-full h-full" ref={containerRef}>
        {/* Player injects here without reacting seeing the iframe manipulation */}
      </div>

      {/* Transparent overlay that blocks pointer events when active */}
      {screenProtectorActive && (
        <div
          className={`absolute inset-0 z-10 bg-transparent transition-all ${
            isMouseHovered && isIdle ? 'cursor-none' : 'cursor-default'
          }`}
          onClick={(e) => {
            resetIdleTimer();
            handleShieldClick();
          }}
          onWheel={(e) => {
            resetIdleTimer();
            handleShieldWheel(e);
          }}
          onMouseMove={resetIdleTimer}
          onMouseLeave={handleShieldMouseLeave}
        >
          {/* Minimal Bottom Bar */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 ${
              isMouseHovered && !isIdle
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0 pointer-events-none'
            }`}
          >
            {/* Progress Bar Container */}
            <div
              className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer group/progress relative"
              onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
              onMouseMove={handleProgressMouseMove}
              onMouseLeave={handleProgressMouseLeave}
            >
              {/* Scrub Tooltip */}
              {hoverTime !== null && (
                <div
                  className="absolute bottom-6 -translate-x-1/2 pointer-events-none"
                  style={{ left: `${hoverX}px` }}
                >
                  <div className="bg-black/90 text-white text-[11px] font-black px-2 py-1 rounded border border-white/10 shadow-xl backdrop-blur-sm tabular-nums">
                    {formatTime(hoverTime)}
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45"></div>
                </div>
              )}

              <div className="absolute inset-0 overflow-hidden rounded-full">
                {/* Buffer Background (Mockup for now) */}
                <div className="absolute inset-0 bg-white/10" style={{ width: '100%' }}></div>
                {/* Playback Progress */}
                <div
                  className="absolute inset-y-0 left-0 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                ></div>
              </div>
              {/* Hover Thumb */}
              <div className="absolute inset-0 opacity-0 group-hover/progress:opacity-100 bg-white/10 transition-opacity rounded-full"></div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-start text-white/90 text-sm font-bold tracking-tight">
              <span className="ml-12 drop-shadow-md tabular-nums bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                {formatTime(currentTime)} <span className="text-white/40 mx-1">/</span> {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VLC Style Volume Indicator */}
      {volumeIndicator.show && (
        <div className="absolute top-6 right-8 z-20 pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className="text-7xl font-black text-white" style={{
            WebkitTextStroke: '2px #000',
            textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0px 8px 16px rgba(0,0,0,0.8)'
          }}>
            {volumeIndicator.val}%
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;

