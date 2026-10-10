import React, { useEffect, useRef, useState, useCallback } from 'react';
import { updateVideoProgress } from '../api/playlistApi';
import { invoke } from '../api/platformBridge';
import { usePinStore } from '../store/pinStore';
import { useLayoutStore } from '../store/layoutStore';
import { useSubtitleStore } from '../store/subtitleStore';
import { getStoredPlaybackTime, savePlaybackTime } from '../utils/storageUtils';

// Save video progress to database and handle pin completion (follower pin transfer or unpin)
const saveVideoProgress = async (videoId, videoUrl, duration, currentTime, removePinByVideoId) => {
  try {
    await updateVideoProgress(videoId, videoUrl, duration, currentTime);

    // Auto-unpin if video reached >=85%
    if (duration && duration > 0 && currentTime >= 0) {
      const progressPercentage = (currentTime / duration) * 100;
      if (progressPercentage >= 85 && removePinByVideoId) {
        removePinByVideoId(videoId);
      }
    }
  } catch (error) {
    console.error('Failed to save video progress to database:', error);
    // Don't throw - this is non-critical
  }
};

const LocalVideoPlayer = ({ videoUrl, videoId, playerId = 'default', onEnded, playlistItems = [], ...props }) => {
  const videoRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [error, setError] = useState(null);
  const { removePinByVideoId } = usePinStore();
  const { screenProtectorActive } = useLayoutStore();

  // Custom Controls State (matching YouTubePlayer)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const [volumeIndicator, setVolumeIndicator] = useState({ show: false, val: 0 });
  const hideVolumeTimerRef = useRef(null);
  const [videoDims, setVideoDims] = useState(null);

  // Store playlistItems in a ref so callbacks have access to latest value
  const playlistItemsRef = useRef(playlistItems);
  useEffect(() => {
    playlistItemsRef.current = playlistItems;
  }, [playlistItems]);

  const { activeVttUrl, fontSize, setAvailableSubtitles, clearSubtitles } = useSubtitleStore();

  const FONT_SIZE_MAP = {
    sm: '14px',
    md: '18px',
    lg: '24px',
    xl: '32px'
  };

  // Clear old text tracks from DOM video element when video or subtitle URL changes
  useEffect(() => {
    if (videoRef.current && videoRef.current.textTracks) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'disabled';
      }
    }
  }, [activeVttUrl, videoSrc]);

  // Get streaming URL for local video file
  useEffect(() => {
    clearSubtitles(); // Reset & purge old subtitles on video change
    setVideoDims(null); // Reset dimensions on source change
    if (!videoUrl) {
      setVideoSrc(null);
      return;
    }

    // Check if it's a web URL
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      setVideoSrc(videoUrl);
      setError(null);
      setAvailableSubtitles([]);
      return;
    }

    // It's a local file path - get streaming URL from server
    const getStreamingUrl = async () => {
      try {
        let filePath = videoUrl;

        // Remove file:// prefix if present
        if (filePath.startsWith('file://')) {
          filePath = filePath.replace(/^file:\/\/+/, '');
          // On Windows, "/C:/path" becomes "C:/path"
          if (filePath.startsWith('/') && /^\/[a-zA-Z]:/.test(filePath)) {
            filePath = filePath.substring(1);
          }
        }
        try {
          filePath = decodeURIComponent(filePath);
        } catch (e) {}

        console.log('Getting streaming URL for local video file:', filePath);

        // Get streaming URL from Tauri command
        const streamUrl = await invoke('get_video_stream_url', { filePath });

        console.log('Streaming URL:', streamUrl);
        setVideoSrc(streamUrl);
        setError(null);

        // Fetch available subtitle tracks for this local file
        try {
          const subs = await invoke('get_video_subtitles', { filePath });
          setAvailableSubtitles(subs || []);
        } catch (subErr) {
          console.warn('Failed to detect subtitles:', subErr);
          setAvailableSubtitles([]);
        }
      } catch (err) {
        console.error('Failed to get streaming URL:', err);
        console.error('Original videoUrl:', videoUrl);
        setError(`Failed to load video file: ${err.message || err}`);
        setVideoSrc(null);
        setAvailableSubtitles([]);
      }
    };

    getStreamingUrl();
  }, [videoUrl, setAvailableSubtitles]);

  // Handle click on screen protector layer to play/pause
  const handleShieldClick = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error(e));
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  // Handle wheel event to change volume
  const handleShieldWheel = useCallback((e) => {
    if (videoRef.current) {
      const currentVol = videoRef.current.volume * 100;
      const change = e.deltaY < 0 ? 5 : -5;
      const newVol = Math.max(0, Math.min(100, currentVol + change));

      videoRef.current.volume = newVol / 100;
      setVolumeIndicator({ show: true, val: Math.round(newVol) });

      if (hideVolumeTimerRef.current) {
        clearTimeout(hideVolumeTimerRef.current);
      }
      hideVolumeTimerRef.current = setTimeout(() => {
        setVolumeIndicator(prev => ({ ...prev, show: false }));
      }, 1000);

      window.dispatchEvent(new CustomEvent('youtube-player-volume-change', { detail: { volume: newVol } }));
    }
  }, []);

  // Handle custom progress bar interaction
  const handleProgressClick = useCallback((e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const newTime = pct * duration;
    videoRef.current.currentTime = newTime;
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

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
        return;
      }

      if (!videoRef.current) return;
      const video = videoRef.current;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (video.paused) {
            video.play().catch(err => console.error(err));
          } else {
            video.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.05);
          setVolumeIndicator({ show: true, val: Math.round(video.volume * 100) });
          if (hideVolumeTimerRef.current) clearTimeout(hideVolumeTimerRef.current);
          hideVolumeTimerRef.current = setTimeout(() => {
            setVolumeIndicator(prev => ({ ...prev, show: false }));
          }, 1000);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.05);
          setVolumeIndicator({ show: true, val: Math.round(video.volume * 100) });
          if (hideVolumeTimerRef.current) clearTimeout(hideVolumeTimerRef.current);
          hideVolumeTimerRef.current = setTimeout(() => {
            setVolumeIndicator(prev => ({ ...prev, show: false }));
          }, 1000);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Initialize player and restore playback position
  useEffect(() => {
    if (!videoRef.current || !videoSrc) return;

    const video = videoRef.current;
    const id = videoId || videoUrl;

    // Restore playback position
    const storedTime = getStoredPlaybackTime(id);
    if (storedTime > 0) {
      video.currentTime = storedTime;
    }

    // Set up progress tracking
    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      const dur = video.duration;

      // Save to localStorage for quick access
      savePlaybackTime(id, time);

      // Save to database every 5 seconds (throttled)
      if (!saveIntervalRef.current) {
        saveIntervalRef.current = setInterval(() => {
          if (video && !video.paused) {
            saveVideoProgress(id, videoUrl, video.duration, video.currentTime, removePinByVideoId);
          }
        }, 5000);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      // Dispatch global event so external elements can sync
      window.dispatchEvent(new CustomEvent('youtube-player-state-change', {
        detail: { isPlaying: true }
      }));

      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      saveIntervalRef.current = setInterval(() => {
        if (video && !video.paused) {
          const time = video.currentTime;
          const dur = video.duration;
          savePlaybackTime(id, time);
          saveVideoProgress(id, videoUrl, dur, time, removePinByVideoId);
        }
      }, 5000);
    };

    const handlePause = () => {
      setIsPlaying(false);
      window.dispatchEvent(new CustomEvent('youtube-player-state-change', {
        detail: { isPlaying: false }
      }));

      if (video) {
        const time = video.currentTime;
        const dur = video.duration;
        savePlaybackTime(id, time);
        saveVideoProgress(id, videoUrl, dur, time, null);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };

    const handleLoadedMetadata = () => {
      const dur = video.duration;
      setDuration(dur);

      const width = video.videoWidth;
      const height = video.videoHeight;
      console.log('Video dimensions loaded:', width, 'x', height);
      if (width && height) {
        setVideoDims({ width, height });
      }
      
      if (storedTime > 0) {
        // Smart Resume: If stored time is near the end (within 5 seconds or 95%), start from beginning
        const isNearEnd = storedTime >= dur - 5 || (dur > 0 && storedTime / dur > 0.95);

        if (isNearEnd) {
          video.currentTime = 0;
          savePlaybackTime(id, 0);
        } else {
          video.currentTime = storedTime;
        }
      }
    };

    const handleEnded = () => {
      savePlaybackTime(id, 0);
      saveVideoProgress(id, videoUrl, video.duration, video.duration, removePinByVideoId);

      if (onEnded) {
        onEnded();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    // Autoplay
    video.play().catch(err => {
      console.error('Autoplay failed:', err);
    });

    return () => {
      if (video) {
        try {
          const time = video.currentTime;
          const dur = video.duration;
          savePlaybackTime(id, time);
          saveVideoProgress(id, videoUrl, dur, time, null);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoSrc, videoId, videoUrl, removePinByVideoId]);

  // Add error handler for video element
  const handleVideoError = (e) => {
    const video = e.target;
    console.error('Video error:', {
      error: video.error,
      code: video.error?.code,
      message: video.error?.message,
      networkState: video.networkState,
      readyState: video.readyState,
      src: videoSrc
    });

    if (video.error) {
      let errorMsg = 'Failed to load video';
      switch (video.error.code) {
        case video.error.MEDIA_ERR_ABORTED:
          errorMsg = 'Video loading aborted';
          break;
        case video.error.MEDIA_ERR_NETWORK:
          errorMsg = 'Network error while loading video';
          break;
        case video.error.MEDIA_ERR_DECODE:
          errorMsg = 'Video decoding error - format may not be supported';
          break;
        case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMsg = 'Video format not supported or source not found';
          break;
      }
      setError(errorMsg);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        <p>{error}</p>
      </div>
    );
  }

  if (!videoSrc) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        <p>No video file selected</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group/player">
      <style>{`
        video::cue {
          font-size: ${FONT_SIZE_MAP[fontSize] || '18px'} !important;
          background: rgba(0, 0, 0, 0.8) !important;
          color: #ffffff !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
        }
      `}</style>
      <video
        ref={videoRef}
        src={videoSrc}
        className="max-w-full max-h-full object-contain"
        controls={!screenProtectorActive}
        autoPlay
        onError={handleVideoError}
        crossOrigin="anonymous"
        preload="metadata"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: videoDims ? `${videoDims.width} / ${videoDims.height}` : undefined,
          objectFit: 'contain',
        }}
      >
        {activeVttUrl && (
          <track
            key={activeVttUrl}
            kind="subtitles"
            src={activeVttUrl}
            srcLang="en"
            label="Subtitles"
            default
          />
        )}
        Your browser does not support the video tag.
      </video>

      {/* Custom transparent overlay mimicking YouTubePlayer's Zen Mode interface */}
      {screenProtectorActive && (
        <div
          className="absolute inset-0 z-10 bg-transparent cursor-default group/player"
          onClick={handleShieldClick}
          onWheel={handleShieldWheel}
        >
          {/* Minimal Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-2 opacity-0 group-hover/player:translate-y-0 group-hover/player:opacity-100 transition-all duration-300">
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
                {/* Buffer Background */}
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

export default LocalVideoPlayer;
