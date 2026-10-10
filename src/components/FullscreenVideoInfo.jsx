import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume1, Volume2, VolumeX, Shield, ShieldOff, ExternalLink, User, ChevronDown, Info, ListMusic, Check } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useLayoutStore } from '../store/layoutStore';
import { useConfigStore } from '../store/configStore';
import { invoke } from '../api/platformBridge';
import { getPlaylistItemsPreview, getFoldersForPlaylist, getAllPlaylistMetadata, getAllPlaylists, getAllFolderAssignments } from '../api/playlistApi';
import { getThumbnailUrl, fetchVideoMetadata, extractVideoId } from '../utils/youtubeUtils';
import { FOLDER_COLORS } from '../utils/folderColors';
import PlaylistCard from './PlaylistCard';

const TEXT_PRIMARY = {
  color: 'white',
  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 3px 6px rgba(0,0,0,0.9)',
};

const TEXT_SECONDARY = {
  color: '#ffffff',
  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.9)',
};

const ICON_STYLE = {
  display: 'inline-flex',
  color: 'white',
  filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000) drop-shadow(0 3px 6px rgba(0,0,0,0.8))'
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
  const [activeTab, setActiveTab] = useState('playlist'); // 'info' | 'playlist'

  // Data for the current playlist card
  const [playlistMetadata, setPlaylistMetadata] = useState(null);
  const [playlistFolders, setPlaylistFolders] = useState([]);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [folderCounts, setFolderCounts] = useState({});
  const [isLoadingPlaylistData, setIsLoadingPlaylistData] = useState(false);
  const [enrichedMetadata, setEnrichedMetadata] = useState({});

  const { currentPlaylistItems, currentVideoIndex, currentPlaylistId, allPlaylists, setAllPlaylists, setCurrentVideoIndex } = usePlaylistStore();

  const items = currentPlaylistItems || [];
  const hasValidIndex =
    items.length > 0 &&
    currentVideoIndex != null &&
    currentVideoIndex >= 0 &&
    currentVideoIndex < items.length;

  const video = hasValidIndex ? items[currentVideoIndex] : null;

  const handleVideoSelect = (videoUrl) => {
    if (!videoUrl || !items || items.length === 0) return;
    const targetVidId = extractVideoId(videoUrl);
    const targetIndex = items.findIndex(v => {
      if (v.video_url === videoUrl) return true;
      if (targetVidId && (v.video_id === targetVidId || extractVideoId(v.video_url) === targetVidId)) return true;
      return false;
    });

    if (targetIndex >= 0) {
      setCurrentVideoIndex(targetIndex);
    }
  };

  useEffect(() => {
    if (!video) return;
    const vId = video.video_id || video.videoId || extractVideoId(video.video_url || video.videoUrl);
    const isYt = vId && !video.is_local && !video.video_url?.startsWith('local:');

    if (isYt && (video.view_count == null || !video.description || !video.thumbnail_url || (!video.profile_image_url && !video.profileImageUrl))) {
      let canceled = false;
      fetchVideoMetadata(vId).then(meta => {
        if (!canceled && meta) {
          setEnrichedMetadata(prev => ({
            ...prev,
            [vId]: meta
          }));
        }
      });
      return () => { canceled = true; };
    }
  }, [video?.video_id, video?.videoId, video?.video_url]);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!currentPlaylistId) {
        setPlaylistMetadata(null);
        setPlaylistFolders([]);
        setPreviewVideos([]);
        setFolderCounts({});
        return;
      }

      setIsLoadingPlaylistData(true);
      try {
        // Ensure allPlaylists is populated if it's currently empty
        if (allPlaylists.length === 0) {
          const all = await getAllPlaylists();
          setAllPlaylists(all);
        }

        const [metaList, folders, previews, folderAssignments] = await Promise.all([
          getAllPlaylistMetadata(),
          getFoldersForPlaylist(currentPlaylistId),
          getPlaylistItemsPreview(currentPlaylistId, 30),
          getAllFolderAssignments(currentPlaylistId).catch(() => ({}))
        ]);

        const meta = metaList.find(m => String(m.playlist_id) === String(currentPlaylistId));
        setPlaylistMetadata(meta || null);
        setPlaylistFolders(folders || []);
        setPreviewVideos(previews || []);

        // Compute folder counts distribution
        const counts = {};
        if (folderAssignments && typeof folderAssignments === 'object') {
          Object.values(folderAssignments).forEach(val => {
            const arr = Array.isArray(val) ? val : [val];
            arr.forEach(col => {
              if (typeof col === 'string' && col) {
                counts[col] = (counts[col] || 0) + 1;
              }
            });
          });
        }
        if (Object.keys(counts).length === 0 && Array.isArray(folders)) {
          folders.forEach(f => {
            const col = f.id || f.folder_color || f.color;
            const cnt = f.count ?? f.video_count ?? 1;
            if (col) counts[col] = (counts[col] || 0) + cnt;
          });
        }
        setFolderCounts(counts);
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

  return (
    <div className="layout-shell__fullscreen-video-info" data-debug-label="Fullscreen Video Info" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Heavily blurred version of current app banner */}
      <div aria-hidden="true" style={blurredBannerStyle} />
      <div className="flex flex-col h-full w-full" style={{ position: 'relative', zIndex: 1, minHeight: 0 }}>
        {/* Scrollable area - metadata only now */}
        <div className="flex-1 overflow-y-auto px-0 pb-0 scrollbar-hide" style={{ minHeight: 0 }}>
          {!fullscreenInfoBlanked && video && (() => {
            const vId = video.video_id || video.videoId || extractVideoId(video.video_url || video.videoUrl);
            const extra = enrichedMetadata[vId] || {};

            const thumbnailUrl = video.thumbnail_url || video.thumbnailUrl || extra.thumbnailUrl || (vId ? getThumbnailUrl(vId, 'max') : null);
            const author = video.author || extra.author || 'Unknown';

            const rawDate = video.published_at || video.publishedAt || extra.publishedAt;
            const formattedDate = rawDate
              ? new Date(rawDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })
              : null;

            const rawViewCount = video.view_count ?? video.viewCount ?? extra.viewCount ?? null;
            let viewCountText = null;
            if (rawViewCount != null && rawViewCount !== '' && rawViewCount !== '0' && rawViewCount !== 0) {
              const raw =
                typeof rawViewCount === 'string'
                  ? parseInt(rawViewCount, 10)
                  : rawViewCount;
              const safeNumber = Number.isFinite(raw) ? raw : 0;
              if (safeNumber > 0) {
                viewCountText = safeNumber.toLocaleString();
              }
            }

            const rawDesc = (video.description && String(video.description).trim()) ? video.description : extra.description;
            const description = rawDesc && String(rawDesc).trim() ? rawDesc : null;
            const tagsList = parseTags(video.tags || extra.tags);

            const profileImg = video ? (video.profile_image_url || video.profileImageUrl || extra.profileImageUrl || extra.profile_image_url) : null;
            const isValidProfileImg = profileImg && profileImg !== 'null' && profileImg !== 'undefined' && profileImg.trim() !== '';

            const isLocal = video.is_local || (!video.video_url?.includes('youtube.com') && !video.video_url?.includes('youtu.be'));

            const renderVideoThumbnail = () => (
              <div className="relative group/thumb px-0 my-1">
                {thumbnailUrl ? (
                  <div className="rounded-xl overflow-hidden shadow-2xl border-[2px] border-black/50 aspect-video relative">
                    <img
                      src={thumbnailUrl}
                      alt={video.title || 'Video thumbnail'}
                      className="block w-full h-full object-cover"
                    />

                    {/* Hover Overlay Controls Bar */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between gap-2 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200 z-20">
                      {/* Left: Volume Controller */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-[90px]" onClick={(e) => e.stopPropagation()}>
                        <style>{`
                          .volume-slider-thumb::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            background: #ffffff;
                            border: 2px solid #000000;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.6);
                            cursor: pointer;
                            transition: transform 0.15s ease;
                          }
                          .volume-slider-thumb::-webkit-slider-thumb:hover {
                            transform: scale(1.15);
                          }
                          .volume-slider-thumb::-moz-range-thumb {
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            background: #ffffff;
                            border: 2px solid #000000;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.6);
                            cursor: pointer;
                            transition: transform 0.15s ease;
                          }
                          .volume-slider-thumb::-moz-range-thumb:hover {
                            transform: scale(1.15);
                          }
                        `}</style>
                        <button
                          onClick={() => handleVolumeChange({ target: { value: volume === 0 ? 100 : 0 } })}
                          className="transition-transform shrink-0 hover:scale-110 active:scale-95 flex items-center justify-center text-white"
                          style={ICON_STYLE}
                          title={volume === 0 ? "Unmute" : "Mute"}
                        >
                          {volume === 0 ? (
                            <VolumeX size={18} strokeWidth={2.5} />
                          ) : volume < 50 ? (
                            <Volume1 size={18} strokeWidth={2.5} />
                          ) : (
                            <Volume2 size={18} strokeWidth={2.5} />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={handleVolumeChange}
                          style={{
                            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${volume}%, #475569 ${volume}%, #475569 100%)`
                          }}
                          className="volume-slider-thumb w-full h-2 border border-black rounded-full appearance-none cursor-pointer outline-none"
                          title={`Volume: ${volume}%`}
                        />
                      </div>

                      {/* Right: Info/Playlist Toggle & Shield Capsule */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Info / Playlist Toggle Button */}
                        <button
                          onClick={() => setActiveTab(activeTab === 'info' ? 'playlist' : 'info')}
                          className={`border border-white/40 rounded-lg px-2 py-0.5 shadow-md flex items-center gap-1 font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0 ${activeTab === 'info' ? 'bg-sky-500 text-white' : 'bg-black/70 hover:bg-slate-800 text-white'}`}
                          title={activeTab === 'info' ? "Show Playlist" : "Show Video Info"}
                        >
                          {activeTab === 'info' ? (
                            <>
                              <ListMusic size={13} strokeWidth={2.5} />
                              <span>Playlist</span>
                            </>
                          ) : (
                            <>
                              <Info size={13} strokeWidth={2.5} />
                              <span>Info</span>
                            </>
                          )}
                        </button>

                        {/* Shield Toggle Capsule */}
                        <button
                          onClick={toggleScreenProtector}
                          className={`group shrink-0 h-6 rounded-full flex items-center transition-all duration-300 relative border border-white/40 px-0.5 shadow-md ${screenProtectorActive ? 'bg-emerald-500 w-11' : 'bg-black/70 hover:bg-slate-800 w-11'}`}
                          title={screenProtectorActive ? "Disable Shield (Enable Embed UI)" : "Enable Shield (Hide Embed UI)"}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${screenProtectorActive ? 'translate-x-5' : 'translate-x-0'}`}
                          >
                            {screenProtectorActive ? (
                              <Shield size={10} fill="currentColor" className="text-emerald-700" />
                            ) : (
                              <ShieldOff size={10} className="text-slate-800" />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
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
            );

            return (
              <div className="flex flex-col gap-0.5">
                {/* Single Unified Hero Video Metadata Card */}
                <div className="mt-1 px-2.5">
                  <div className="border-2 border-[#052F4A] rounded-2xl p-3 bg-slate-100 shadow-md relative overflow-hidden flex flex-col gap-2.5 shrink-0 text-[#052F4A]">
                    {/* Row 1: Centered Avatar (48px) & Uploader Name with Subtle YouTube Icon Button on Right */}
                    <div className="relative flex items-center justify-center w-full min-w-0">
                      <div className="flex items-center justify-center gap-3 min-w-0 max-w-full px-7">
                        {isValidProfileImg ? (
                          <img
                            src={profileImg}
                            alt={author}
                            className="w-12 h-12 rounded-full border-2 border-[#052F4A] object-cover bg-slate-900 shrink-0 shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-[#052F4A] bg-[#052F4A] flex items-center justify-center text-white shrink-0 shadow-sm">
                            <User size={22} strokeWidth={2.5} />
                          </div>
                        )}

                        <span className="font-black text-lg text-[#052F4A] truncate leading-tight text-center" title={author}>
                          {author}
                        </span>
                      </div>

                      {/* Subtle Compact YouTube External Link Button */}
                      {(() => {
                        const ytUrl = video.video_url || video.videoUrl || (video.video_id ? `https://www.youtube.com/watch?v=${video.video_id}` : null);
                        if (!ytUrl) return null;
                        return (
                          <a
                            href={ytUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-0 top-1/2 -translate-y-1/2 border-2 border-[#052F4A] rounded-xl p-1.5 bg-slate-200/60 hover:bg-sky-100 shadow-sm flex items-center justify-center text-[#052F4A] transition-all active:scale-95 cursor-pointer select-none shrink-0"
                            title="View on YouTube"
                          >
                            <ExternalLink size={16} strokeWidth={2.5} />
                          </a>
                        );
                      })()}
                    </div>

                    {/* Horizontal Divider */}
                    <div className="w-full h-px bg-[#052F4A]/20" />

                    {/* Row 2: Dedicated Full-Width Prominent View Count & Upload Date */}
                    {(viewCountText || formattedDate) && (
                      <div className="flex items-center justify-center text-center font-black text-[15px] text-[#052F4A] truncate py-0.5 tracking-tight">
                        {viewCountText && <span>{viewCountText} views</span>}
                        {viewCountText && formattedDate && <span className="mx-2.5 opacity-40">•</span>}
                        {formattedDate && <span>{formattedDate}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="px-0 min-h-0 flex-1 mt-2">
                  {activeTab === 'info' ? (
                    <div className="flex flex-col gap-3 px-2.5">
                      {renderVideoThumbnail()}
                      {/* Integrated Description Box */}
                      <div className="flex flex-col">
                        <div
                          className={`flex flex-col p-3 rounded-2xl border-2 border-slate-700/40 bg-black/30 backdrop-blur-md transition-all duration-300 overflow-hidden ${descriptionMode === 'full' ? 'h-auto max-h-[500px] overflow-y-auto scrollbar-hide' : 'h-[220px]'}`}
                        >
                          <div className="text-sm font-semibold leading-relaxed whitespace-pre-wrap" style={TEXT_SECONDARY}>
                            {description ? (
                              description
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6 text-center gap-1.5">
                                <span className="text-xs font-black uppercase tracking-wider text-sky-400">No API Key Configured</span>
                                <p className="text-xs text-slate-300/80 max-w-xs leading-relaxed">
                                  Video descriptions, exact view counts, and channel avatars require a YouTube Data API Key. Click the Key (🔑) button in the top menu to enter your API key for full metadata.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {description && (
                          <div className="flex justify-start mt-1.5 px-1">
                            <button
                              onClick={() => setDescriptionMode(descriptionMode === 'full' ? 'trunc' : 'full')}
                              className="text-xs font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity"
                              style={TEXT_SECONDARY}
                            >
                              {descriptionMode === 'full' ? '[ Collapse Description ]' : '[ Expand Description ]'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Playlist Tab */
                    currentPlaylistId && (
                      <div className="w-full px-0 mt-0 flex justify-center">
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

                            const initialPreviewVideos = [...previewVideos];

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
                                contentAboveGrid={renderVideoThumbnail()}
                                showOnlyShuffleHover={true}
                                hideTitleBar={true}
                                miniGridLimit={18}
                                onVideoSelect={handleVideoSelect}
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
      </div>
    </div>
  );
};

export default FullscreenVideoInfo;

