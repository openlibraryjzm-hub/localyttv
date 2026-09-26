import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume1, Volume2, VolumeX, Shield, ShieldOff, ExternalLink, User, ChevronDown, Info, ListMusic, Subtitles, Check, FolderOpen } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useLayoutStore } from '../store/layoutStore';
import { useConfigStore } from '../store/configStore';
import { useSubtitleStore } from '../store/subtitleStore';
import { invoke } from '../api/platformBridge';
import { getPlaylistItemsPreview, getFoldersForPlaylist, getAllPlaylistMetadata, getAllPlaylists } from '../api/playlistApi';
import PlaylistCard from './PlaylistCard';

const TEXT_PRIMARY = {
  color: 'white',
  textShadow: '0 2px 4px rgba(0,0,0,0.4)',
};

const TEXT_SECONDARY = {
  color: '#e2e8f0', // slate-200
  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
};

const ICON_STYLE = {
  display: 'inline-flex',
  color: 'white',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
};

/** Parse tags from JSON string or return empty array */
const parseTags = (tagsStr) => {
  if (!tagsStr || typeof tagsStr !== 'string') return [];
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Get channel or author profile external link */
const getChannelUrl = (video) => {
  if (!video) return null;
  const url = video.video_url || video.videoUrl || '';
  
  // If it's a channel link already
  if (url.includes('youtube.com/channel/') || url.includes('youtube.com/@')) {
    return url;
  }
  
  // If it's a Twitter video / tweet
  const author = video.author || '';
  const authorMatch = author.match(/^(.+?)\s*\(@(.+?)\)$/);
  if (authorMatch) {
    return `https://x.com/${authorMatch[2]}`;
  }
  
  const isLocal = video.is_local || (!url.includes('youtube.com') && !url.includes('youtu.be'));
  if (isLocal) {
    return null;
  }
  
  // YouTube fallback
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(author)}`;
};

const FullscreenVideoInfo = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(100);
  const [descriptionMode, setDescriptionMode] = useState('full'); // 'min' | 'trunc' | 'full'
  const [activeTab, setActiveTab] = useState('playlist'); // 'info' | 'playlist' | 'subtitles'

  const { availableSubtitles, activeSubtitleId, fontSize, setActiveSubtitle, setFontSize } = useSubtitleStore();

  // Data for the current playlist card
  const [playlistMetadata, setPlaylistMetadata] = useState(null);
  const [playlistFolders, setPlaylistFolders] = useState([]);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [isLoadingPlaylistData, setIsLoadingPlaylistData] = useState(false);

  const { currentPlaylistItems, currentVideoIndex, currentPlaylistId, allPlaylists, setAllPlaylists } = usePlaylistStore();

  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!currentPlaylistId) {
        setPlaylistMetadata(null);
        setPlaylistFolders([]);
        setPreviewVideos([]);
        return;
      }

      setIsLoadingPlaylistData(true);
      try {
        // Ensure allPlaylists is populated if it's currently empty
        if (allPlaylists.length === 0) {
          const all = await getAllPlaylists();
          setAllPlaylists(all);
        }

        const [metaList, folders, previews] = await Promise.all([
          getAllPlaylistMetadata(),
          getFoldersForPlaylist(currentPlaylistId),
          getPlaylistItemsPreview(currentPlaylistId, 4)
        ]);

        const meta = metaList.find(m => String(m.playlist_id) === String(currentPlaylistId));
        setPlaylistMetadata(meta || null);
        setPlaylistFolders(folders || []);
        setPreviewVideos(previews || []);
      } catch (error) {
        console.error('Failed to fetch playlist data for fullscreen info:', error);
      } finally {
        setIsLoadingPlaylistData(false);
      }
    };

    fetchPlaylistData();
  }, [currentPlaylistId]);

  useEffect(() => {
    const handleStateChange = (e) => setIsPlaying(e.detail.isPlaying);
    const handleVolumeSync = (e) => setVolume(e.detail.volume);

    window.addEventListener('youtube-player-state-change', handleStateChange);
    window.addEventListener('youtube-player-volume-change', handleVolumeSync);

    return () => {
      window.removeEventListener('youtube-player-state-change', handleStateChange);
      window.removeEventListener('youtube-player-volume-change', handleVolumeSync);
    };
  }, []);

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: newState ? 'playVideo' : 'pauseVideo',
          args: []
        }), '*');
      } catch (e) { }
    });
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [newVol]
        }), '*');
      } catch (e) { }
    });
  };

  const { fullscreenInfoBlanked, screenProtectorActive, toggleScreenProtector } = useLayoutStore();
  const {
    fullscreenBanner,
    bannerPreviewMode,
    bannerNavBannerId,
    bannerPresets,
    orbFavorites
  } = useConfigStore();

  // Resolve effective fullscreen banner (same logic as LayoutShell: preset override when nav active)
  let effectiveBanner = fullscreenBanner;
  if (bannerNavBannerId && !bannerPreviewMode && bannerPresets?.length) {
    const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
    if (preset?.fullscreenBanner) effectiveBanner = preset.fullscreenBanner;
  }
  const bannerImage = effectiveBanner?.image || '/banner.PNG';
  const bannerScale = effectiveBanner?.scale ?? 100;
  const bannerVertical = effectiveBanner?.verticalPosition ?? 0;
  const bannerHorizontal = effectiveBanner?.horizontalOffset ?? 0;

  const blurredBannerStyle = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    backgroundImage: `url(${bannerImage})`,
    backgroundPosition: `${bannerHorizontal}% ${bannerVertical}%`,
    backgroundRepeat: 'repeat-x',
    backgroundSize: `${bannerScale}vw auto`,
    filter: 'blur(28px)',
    transform: 'scale(1.15)',
    pointerEvents: 'none'
  };

  const items = currentPlaylistItems || [];
  const hasValidIndex =
    items.length > 0 &&
    currentVideoIndex != null &&
    currentVideoIndex >= 0 &&
    currentVideoIndex < items.length;

  const video = hasValidIndex ? items[currentVideoIndex] : null;

  return (
    <div className="layout-shell__fullscreen-video-info" data-debug-label="Fullscreen Video Info" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Heavily blurred version of current app banner */}
      <div aria-hidden="true" style={blurredBannerStyle} />
      <div className="flex flex-col h-full w-full" style={{ position: 'relative', zIndex: 1, minHeight: 0 }}>
        {/* Scrollable area - metadata only now */}
        <div className="flex-1 overflow-y-auto px-0 pb-0 scrollbar-hide" style={{ minHeight: 0 }}>
          {!fullscreenInfoBlanked && video && (() => {
            const thumbnailUrl = video.thumbnail_url || video.thumbnailUrl || null;
            const author = video.author || 'Unknown';

            const formattedDate = video.published_at
              ? new Date(video.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })
              : null;

            let viewCountText = null;
            if (video.view_count != null && video.view_count !== '') {
              const raw =
                typeof video.view_count === 'string'
                  ? parseInt(video.view_count, 10)
                  : video.view_count;
              const safeNumber = Number.isFinite(raw) ? raw : 0;
              viewCountText = safeNumber.toLocaleString();
            }

            const description = video.description && String(video.description).trim() ? video.description : null;
            const tagsList = parseTags(video.tags);

            const profileImg = video ? (video.profile_image_url || video.profileImageUrl) : null;
            const isValidProfileImg = profileImg && profileImg !== 'null' && profileImg !== 'undefined' && profileImg.trim() !== '';
            const authorFallbackName = video ? (video.author || 'Unknown') : 'Unknown';
            const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorFallbackName)}&background=333&color=fff&size=128&rounded=true&bold=true`;

            const isLocal = video.is_local || (!video.video_url?.includes('youtube.com') && !video.video_url?.includes('youtu.be'));

            return (
              <div className="flex flex-col gap-0.5">
                {/* Thumbnail Container (No Overlay Avatar) */}
                <div className="relative group/thumb">
                  {thumbnailUrl ? (
                    <div className="rounded-xl overflow-hidden shadow-2xl border-[2px] border-black/50 aspect-video relative">
                      <img
                        src={thumbnailUrl}
                        alt={video.title || 'Video thumbnail'}
                        className="block w-full h-full object-cover"
                      />
                    </div>
                  ) : isLocal ? (
                    <div className="rounded-xl overflow-hidden shadow-2xl border-[2px] border-black/50 aspect-video relative bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 flex flex-col items-center justify-center text-white select-none">
                      <svg
                        className="w-16 h-16 text-sky-400/80 mb-2 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-[10px] tracking-widest font-black text-sky-300/40 uppercase">Local Video File</span>
                    </div>
                  ) : null}
                </div>

                {/* Channel Info & Metadata Area under Thumbnail */}
                <div className="mt-3 mx-1 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl flex flex-col gap-3">
                  {/* Row 1: Channel Author Avatar, Name, External Link */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    {/* Avatar on the left */}
                    <img
                      src={isValidProfileImg ? profileImg : fallbackSrc}
                      alt={author}
                      className="w-16 h-16 rounded-full border-2 border-sky-400/60 object-cover shadow-xl bg-slate-800 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackSrc;
                      }}
                    />

                    {/* Centered Channel Name */}
                    <div className="flex-1 min-w-0 px-2 flex items-center justify-center text-center">
                      <span className="text-xl font-black uppercase text-white truncate tracking-wide text-center" style={TEXT_PRIMARY} title={author}>
                        {author}
                      </span>
                    </div>

                    {/* External Link on the right */}
                    {(() => {
                      const channelUrl = getChannelUrl(video);
                      return channelUrl ? (
                        <a
                          href={channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 transition-all text-white flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 shadow-lg"
                          title="Open Channel"
                        >
                          <ExternalLink size={18} />
                        </a>
                      ) : (
                        <div className="w-10 shrink-0" />
                      );
                    })()}
                  </div>

                  {/* Row 2: View Count and Upload Date */}
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-2xl font-black uppercase tracking-wide text-white text-center border-t border-white/10 pt-2.5 mt-1" style={TEXT_PRIMARY}>
                    {viewCountText && <span className="text-white">{viewCountText} views</span>}
                    {viewCountText && formattedDate && <span className="opacity-40 text-slate-400">•</span>}
                    {formattedDate && <span className="text-slate-100">{formattedDate}</span>}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="px-0 min-h-0 flex-1 mt-4">
                  {activeTab === 'subtitles' ? (
                    /* Subtitles & Track Config Tab */
                    <div className="w-full px-2 mt-1 flex flex-col gap-3">
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/20 backdrop-blur-md shadow-2xl flex flex-col gap-3.5 text-white">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 px-1">
                          <span className="text-sm font-black uppercase tracking-wider text-sky-400">Subtitles & Track Config</span>
                          <span className="text-xs font-bold text-slate-300">
                            {availableSubtitles.length} track(s) found
                          </span>
                        </div>

                        {/* Subtitle Track Selector */}
                        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-hide">
                          {/* Off option */}
                          <button
                            onClick={() => setActiveSubtitle(null)}
                            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-bold text-left transition-all ${!activeSubtitleId ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}
                          >
                            <span>Off (No Subtitles)</span>
                            {!activeSubtitleId && <Check size={18} className="text-sky-400" />}
                          </button>

                          {/* Detected Tracks */}
                          {availableSubtitles.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={async () => {
                                try {
                                  const vtt = await invoke('read_subtitle_vtt', { subPath: sub.path });
                                  setActiveSubtitle(sub.id, vtt);
                                } catch (e) {
                                  console.error('Failed to load subtitle:', e);
                                }
                              }}
                              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-bold text-left transition-all ${activeSubtitleId === sub.id ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}
                            >
                              <span className="truncate pr-2">{sub.label}</span>
                              {activeSubtitleId === sub.id && <Check size={18} className="text-sky-400 shrink-0" />}
                            </button>
                          ))}
                        </div>

                        {/* Load External Subtitle File */}
                        <button
                          onClick={async () => {
                            try {
                              const file = await invoke('select_subtitle_file');
                              if (file) {
                                const vtt = await invoke('read_subtitle_vtt', { subPath: file });
                                const customId = `external-${Date.now()}`;
                                setActiveSubtitle(customId, vtt);
                              }
                            } catch (e) {
                              console.error('Failed to select subtitle file:', e);
                            }
                          }}
                          className="flex items-center justify-center gap-2.5 w-full py-2.5 px-3.5 bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/40 rounded-xl text-sm font-bold text-sky-200 transition-all active:scale-95 shadow-md"
                        >
                          <FolderOpen size={18} className="text-sky-400" />
                          <span>Load Custom Subtitle File...</span>
                        </button>

                        {/* Font Size Selector */}
                        <div className="border-t border-white/10 pt-2.5 flex items-center justify-between px-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Subtitle Size</span>
                          <div className="flex items-center gap-2">
                            {['sm', 'md', 'lg', 'xl'].map((sz) => (
                              <button
                                key={sz}
                                onClick={() => setFontSize(sz)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${fontSize === sz ? 'bg-sky-500 text-white shadow-md' : 'bg-white/10 text-slate-300 hover:text-white'}`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'info' ? (
                    <div className="flex flex-col gap-3 px-2">
                      {/* Integrated Description Box */}
                      {description && (
                        <div className="flex flex-col">
                          <div
                            className={`flex flex-col p-3 rounded-2xl border-2 border-slate-700/40 bg-black/30 backdrop-blur-md transition-all duration-300 overflow-hidden ${descriptionMode === 'full' ? 'h-auto max-h-[500px] overflow-y-auto scrollbar-hide' : 'h-[220px]'}`}
                          >
                            <div className="text-sm font-semibold leading-relaxed whitespace-pre-wrap" style={TEXT_SECONDARY}>
                              {description}
                            </div>
                          </div>

                          <div className="flex justify-start mt-1.5 px-1">
                            <button
                              onClick={() => setDescriptionMode(descriptionMode === 'full' ? 'trunc' : 'full')}
                              className="text-xs font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity"
                              style={TEXT_SECONDARY}
                            >
                              {descriptionMode === 'full' ? '[ Collapse Description ]' : '[ Expand Description ]'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Playlist Tab */
                    currentPlaylistId && (
                      <div className="w-full px-1 mt-3 flex justify-center">
                        <div className="w-full">
                          {(() => {
                            const playlistObj = allPlaylists.find(p => String(p.id) === String(currentPlaylistId));
                            if (!playlistObj) return null;

                            const orbList = Array.isArray(orbFavorites) ? orbFavorites : [];
                            const bannerList = Array.isArray(bannerPresets) ? bannerPresets : [];
                            const pidStr = String(currentPlaylistId);

                            const assignedOrbs = orbList
                              .filter(orb => Array.isArray(orb.playlistIds) && orb.playlistIds.map(String).includes(pidStr))
                              .map(orb => ({ ...orb, id: `orb-${orb.id}`, originalId: orb.id, isOrb: true, title: orb.name }));

                            const assignedBanners = bannerList
                              .filter(preset => Array.isArray(preset.playlistIds) && preset.playlistIds.map(String).includes(pidStr))
                              .map(preset => ({ ...preset, id: `banner-${preset.id}`, originalId: preset.id, isBannerPreset: true, title: preset.name }));

                            const initialPreviewVideos = [...assignedOrbs, ...assignedBanners, ...previewVideos];

                            let activeThumb = null;
                            if (playlistObj.custom_thumbnail_url) {
                              activeThumb = playlistObj.custom_thumbnail_url;
                            } else if (playlistMetadata?.first_video) {
                              const vid = playlistMetadata.first_video;
                              const isVidLocal = vid.is_local || (!vid.video_url?.includes('youtube.com') && !vid.video_url?.includes('youtu.be'));
                              activeThumb = vid.thumbnail_url?.replace(/name=[a-z]+/, 'name=large') || (isVidLocal ? null : `https://img.youtube.com/vi/${vid.video_id}/maxresdefault.jpg`);
                            }

                            return (
                              <PlaylistCard
                                playlist={playlistObj}
                                folders={playlistFolders}
                                itemCount={playlistMetadata?.count || 0}
                                videoCount={playlistMetadata?.count || 0}
                                orbCount={assignedOrbs.length}
                                bannerCount={assignedBanners.length}
                                initialPreviewVideos={initialPreviewVideos}
                                activeThumbnailUrl={activeThumb}
                                size="large"
                                inCarousel={false}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Video Controls - Fixed at bottom */}
        {!fullscreenInfoBlanked && video && (
          <div className="shrink-0 w-full mt-3 px-4 py-2.5 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex items-center justify-between gap-4 relative transition-all duration-300 z-20">
            {/* Subtitles & Track Config Button */}
            <button
              onClick={() => setActiveTab(activeTab === 'subtitles' ? 'playlist' : 'subtitles')}
              className={`group shrink-0 w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 relative rounded-full ${activeTab === 'subtitles' || activeSubtitleId ? 'bg-sky-500/40 border border-sky-400/60 shadow-lg' : ''}`}
              title="Subtitles & Track Config"
            >
              <span style={ICON_STYLE}>
                <Subtitles size={26} color={activeTab === 'subtitles' || activeSubtitleId ? "#38bdf8" : "white"} strokeWidth={2} />
              </span>
            </button>

            {/* Volume Control (Icon + Slider) */}
            <div className="flex items-center gap-2.5 flex-1 min-w-[100px]">
              <button
                onClick={() => handleVolumeChange({ target: { value: volume === 0 ? 100 : 0 } })}
                className="transition-all shrink-0 w-10 h-10 flex items-center justify-center hover:scale-110 active:scale-95"
                title="Mute/Unmute"
              >
                <span style={ICON_STYLE}>
                  {volume === 0 ? (
                    <VolumeX size={26} color="white" strokeWidth={2.5} />
                  ) : volume < 50 ? (
                    <Volume1 size={26} color="white" strokeWidth={2.5} />
                  ) : (
                    <Volume2 size={26} color="white" strokeWidth={2.5} />
                  )}
                </span>
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-white/25 rounded-lg appearance-none cursor-pointer accent-sky-400 transition-opacity outline-none opacity-90 hover:opacity-100"
                title={`Volume: ${volume}%`}
              />
            </div>

            {/* Content Mode Toggle (Info vs Playlist) */}
            <button
              onClick={() => setActiveTab(activeTab === 'info' ? 'playlist' : 'info')}
              className="group shrink-0 w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 relative"
              title={activeTab === 'info' ? "Show Playlist" : "Show Video Info"}
            >
              <span style={ICON_STYLE}>
                {activeTab === 'info' ? (
                  <ListMusic size={26} color="white" strokeWidth={2.5} />
                ) : (
                  <Info size={26} color="white" strokeWidth={2.5} />
                )}
              </span>
            </button>

            {/* Shield Toggle Capsule */}
            <button
              onClick={toggleScreenProtector}
              className={`group shrink-0 w-16 h-8 rounded-full flex items-center transition-all duration-300 relative border border-white/20 px-0.5 shadow-lg ${screenProtectorActive ? 'bg-green-500/80' : 'bg-slate-800/70'}`}
              title={screenProtectorActive ? "Disable Shield (Enable Embed UI)" : "Enable Shield (Hide Embed UI)"}
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <div
                className={`w-7 h-7 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${screenProtectorActive ? 'translate-x-8' : 'translate-x-0'}`}
              >
                {screenProtectorActive ? (
                  <Shield size={15} fill="currentColor" className="text-green-600" />
                ) : (
                  <ShieldOff size={15} className="text-slate-800" />
                )}
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullscreenVideoInfo;

