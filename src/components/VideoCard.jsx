import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import CardThumbnail from './CardThumbnail';
import CardContent from './CardContent';
import BulkTagColorGrid from './BulkTagColorGrid';
import DrumstickRating from './DrumstickRating';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import { FOLDER_COLORS, getFolderColorById } from '../utils/folderColors';
import { usePinStore } from '../store/pinStore';
import { useFolderStore } from '../store/folderStore';
import { getDrumstickRating, setDrumstickRating } from '../api/playlistApi';
import VideoCardThreeDotMenu from './VideoCardThreeDotMenu';
import useLongPress from '../hooks/useLongPress';
import LocalImageCard from './LocalImageCard';

/**
 * VideoCard - Entry component that routes local images to LocalImageCard
 * and standard videos to VideoCardInner
 */
const VideoCard = (props) => {
  const { video } = props;
  const isImage = video?.video_url && /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(video.video_url);
  if (isImage) {
    return <LocalImageCard {...props} />;
  }
  return <VideoCardInner {...props} />;
};

const VideoCardInner = ({
  video,
  index,
  originalIndex,
  isSelected = false,
  isCurrentlyPlaying = false,
  videoFolders = [],
  selectedFolder = null,
  onVideoClick,
  onStarClick,
  onStarColorLeftClick,
  onStarColorRightClick,
  onMenuOptionClick,
  onQuickAssign,
  bulkTagMode = false,
  bulkTagSelections = new Set(),
  onBulkTagColorClick,
  onPinClick,
  onLongClick,
  onSecondPlayerSelect,
  progress = 0,
  watchCount = 0,
  isStickied = false,
  playlistId = null,
  folderMetadata = {},
  onRenameFolder,
  cardStyle = 'youtube', // 'youtube' | 'twitter'
}) => {
  const { quickAssignFolder } = useFolderStore();

  const menuRef = useRef(null);

  const handleContextMenu = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!bulkTagMode && menuRef.current) {
      menuRef.current.openAt(e.clientX, e.clientY);
    }
  };

  const longPressProps = useLongPress(
    (e) => handleContextMenu(e),
    (e) => handleCardClick(e)
  );

  // Drumstick rating state (used by 3-dot menu)
  const [drumstickRating, setDrumstickRatingState] = useState(video.drumstick_rating || 0);

  // Load drumstick rating from database
  useEffect(() => {
    if (playlistId && video.id) {
      getDrumstickRating(playlistId, video.id)
        .then(rating => setDrumstickRatingState(rating))
        .catch(err => console.error('Failed to load drumstick rating:', err));
    }
  }, [playlistId, video.id]);

  // Handle drumstick rating change
  const handleDrumstickRate = async (newRating) => {
    if (!playlistId || !video.id) return;

    try {
      await setDrumstickRating(playlistId, video.id, newRating);
      setDrumstickRatingState(newRating);
    } catch (error) {
      console.error('Failed to set drumstick rating:', error);
    }
  };

  const isLocal = video.is_local || (!video.video_url?.includes('youtube.com') && !video.video_url?.includes('youtu.be'));
  const isImage = video.video_url && /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(video.video_url);
  // Use stored thumbnail_url if available (for Twitter/local content), otherwise construct YouTube thumbnail
  const thumbnailUrl = video.thumbnail_url || (isLocal ? null : getThumbnailUrl(video.video_id, 'medium'));

  const localFallbackIcon = (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 text-white select-none">
      <svg
        className="w-10 h-10 text-sky-400/80 mb-1.5 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
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
      <span className="text-[9px] tracking-widest font-black text-sky-300/40 uppercase">Local Video</span>
    </div>
  );

  const localImageFallbackIcon = (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-purple-950 to-slate-900 text-white select-none">
      <svg
        className="w-10 h-10 text-purple-400/80 mb-1.5 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-[9px] tracking-widest font-black text-purple-300/40 uppercase">Local Image</span>
    </div>
  );

  // Get border color for bulk tag selections
  const getBulkTagBorderColor = () => {
    if (!bulkTagMode || bulkTagSelections.size === 0) {
      return null;
    }
    // Use the first selected folder color for the border
    const firstSelectedFolder = Array.from(bulkTagSelections)[0];
    const folderColor = getFolderColorById(firstSelectedFolder);
    return folderColor ? folderColor.hex : null;
  };

  const bulkTagBorderColor = getBulkTagBorderColor();

  const handleCardClick = (e) => {
    if (!bulkTagMode && onVideoClick) {
      onVideoClick(e);
    }
  };


  // FIX: Split selectors to prevent "Maximum update depth exceeded" error
  const isPinnedVideo = usePinStore(state =>
    state.pinnedVideos.some(v => v.id === video.id) && !state.priorityPinIds.includes(video.id)
  );
  const isPriority = usePinStore(state => state.priorityPinIds.includes(video.id));
  const isFollower = usePinStore(state => state.followerPinIds.includes(video.id));
  const { togglePin, togglePriorityPin, removePin } = usePinStore();

  // Flattened splatter icon path for re-use
  const splatterPath = "M47.5,12.2c0,0-2.3,16.2-7.8,19.3c-5.5,3.1-17.7-6.2-17.7-6.2s3.8,11.2-1.7,16.5c-5.5,5.3-20.2-2.1-20.2-2.1 s12.5,9.6,9.2,16.5c-3.3,6.9-10.7,5.5-10.7,5.5s12.9,5.7,12.5,14.7c-0.4,9-10.6,15.6-10.6,15.6s15.3-1.6,20.2,4.2 c4.9,5.8-0.9,13.8-0.9,13.8s9.4-9,16.9-5.3c7.5,3.7,5.9,14.6,5.9,14.6s5.9-11.8,13.6-10.6c7.7,1.2,13.6,9.5,13.6,9.5 s-1.8-13.6,5.3-16.7c7.1-3.1,16.5,2.7,16.5,2.7s-8.1-13.6-1.5-18.9c6.6-5.3,18.8,0.7,18.8,0.7s-13.2-8.1-11.1-16.7 C99.2,40.4,100,28.8,100,28.8s-12,8.8-17.7,3.1c-5.7-5.7-1.3-18.8-1.3-18.8s-9,11.6-16.5,9.4c-7.5-2.2-11.1-12.2-11.1-12.2 S50.4,14.5,47.5,12.2z";

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (countStr) => {
    if (!countStr) return '';
    const count = parseInt(countStr, 10);
    if (isNaN(count)) return '';
    if (count >= 1000000000) return Math.floor(count / 1000000000) + 'B';
    if (count >= 1000000) return Math.floor(count / 1000000) + 'M';
    if (count >= 1000) return Math.floor(count / 1000) + 'K';
    return count.toString();
  };

  const extractYear = (dateStr) => {
    if (!dateStr) return '';
    const match = dateStr.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : '';
  };

  // Quick action - star for folder assignment (must be defined before badges)
  const quickActions = [];

  // Menu options - easy to extend! (must be defined before badges)
  const menuOptions = [
    {
      label: isStickied ? 'Unsticky Video' : 'Sticky Video',
      icon: (
        <svg className="w-4 h-4 text-amber-500" viewBox="0 0 100 100" fill="currentColor">
          <path d={splatterPath} />
        </svg>
      ),
      action: 'toggleSticky',
    },
    {
      label: 'Delete',
      danger: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      action: 'delete',
    },
    {
      label: 'Move to Playlist',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      ),
      action: 'moveToPlaylist',
    },
    {
      label: 'Set as Playlist Cover',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      action: 'setPlaylistCover',
    },
    {
      label: 'Copy to Playlist',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      action: 'copyToPlaylist',
    },
  ];

  // Play overlay for hover (only show when not in bulk tag mode)
  const playOverlay = null;

  // Badges for thumbnail (now can safely use quickActions, menuOptions, submenuOptions)
  const badges = [

    // Watched badge and Duration badge (Top Left)
    (!isCurrentlyPlaying && watchCount > 0) || video.duration_seconds ? {
      component: (
        <div className="flex items-center gap-1.5">
          {!isCurrentlyPlaying && watchCount > 0 && (
            <div className="flex items-center gap-0.5 bg-black/60 px-1.5 py-0.5 rounded text-green-400 font-bold text-xs filter drop-shadow-lg">
              <svg className="w-3.5 h-3.5 stroke-[4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{watchCount}</span>
            </div>
          )}
          {video.duration_seconds ? (
            <div className="bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap">
              {formatDuration(video.duration_seconds)}
            </div>
          ) : null}
        </div>
      ),
      position: 'top-left',
    } : null,

    // 3-Dot Menu - Bottom Right (overhauled: Pins, Folder, Rating, and actions)
    !bulkTagMode && cardStyle === 'twitter' && {
      component: (
        <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <VideoCardThreeDotMenu
            ref={menuRef}
            video={video}
            playlistId={playlistId}
            isPinned={isPinnedVideo}
            isPriority={isPriority}
            isFollower={isFollower}
            onTogglePin={(v) => { togglePin(v); if (onPinClick) onPinClick(v); }}
            onTogglePriorityPin={togglePriorityPin}
            onRemovePin={(id) => { removePin(id); if (onPinClick) onPinClick(video); }}
            videoFolders={videoFolders}
            folderMetadata={folderMetadata}
            onStarColorLeftClick={onStarColorLeftClick}
            onRenameFolder={onRenameFolder}
            drumstickRating={drumstickRating}
            onDrumstickRate={handleDrumstickRate}
            menuOptions={menuOptions}
            onMenuOptionClick={(option) => onMenuOptionClick?.(option, video)}
            triggerClassName="bg-black/60 hover:bg-black/80"
          />
        </div>
      ),
      position: 'bottom-right'
    }
  ].filter(Boolean);

  // Twitter/X style rendering
  if (cardStyle === 'twitter') {
    return (
      <Card
        {...longPressProps}
        onContextMenu={handleContextMenu}
        selected={isSelected}
        playing={isCurrentlyPlaying}
        className={bulkTagMode ? 'cursor-default' : 'cursor-context-menu'}
        variant="minimal"
        rounded={false}
      >
        <div className={`relative group ${bulkTagMode ? 'overflow-visible' : 'overflow-hidden'}`}>
          {/* Thumbnail first */}
          <div className="px-3 pt-3 pb-0">
            <CardThumbnail
              src={thumbnailUrl}
              alt={video.title || `Video ${index + 1}`}
              fallbackIcon={isImage ? localImageFallbackIcon : (isLocal ? localFallbackIcon : null)}
              overlay={playOverlay}
              badges={badges}
              progress={progress}
              className={`overflow-hidden ${bulkTagBorderColor ? 'border-2' : ''} ${isCurrentlyPlaying ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-white shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]' : ''}`}
              style={bulkTagBorderColor ? { borderColor: bulkTagBorderColor, borderWidth: '2px' } : undefined}
            />
          </div>

          {/* Twitter/X Header Section (title) */}
          <div className="flex items-start gap-3 p-3 pb-2">
            <div className="flex-shrink-0">
              {video.profile_image_url ? (
                <img
                  src={video.profile_image_url}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden"
                style={{ display: video.profile_image_url ? 'none' : 'flex' }}
              >
                {video.author ? video.author.charAt(0).toUpperCase() : 'T'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {(() => {
                  const authorMatch = video.author?.match(/^(.+?)\s*\(@(.+?)\)$/);
                  if (authorMatch) {
                    return (
                      <>
                        <span className="font-bold text-[#052F4A] text-sm">{authorMatch[1]}</span>
                        <span className="text-slate-500 text-xs">@{authorMatch[2]}</span>
                      </>
                    );
                  }
                  return <span className="font-bold text-[#052F4A] text-sm">{video.author || 'Twitter User'}</span>;
                })()}
              </div>
              <p className="text-slate-700 text-xs leading-relaxed line-clamp-2">
                {video.title || "Check out this amazing content!"}
              </p>
            </div>
          </div>

          {/* Bulk tag: below thumbnail and title */}
          {bulkTagMode && (
            <div className="relative w-full h-20 flex-shrink-0 overflow-hidden mt-2 px-3 pb-3" data-card-action="true">
              <BulkTagColorGrid
                videoId={video.id}
                currentFolders={videoFolders}
                selectedFolders={bulkTagSelections}
                onColorClick={onBulkTagColorClick}
                playlistId={playlistId}
                folderMetadata={folderMetadata}
                onRenameFolder={onRenameFolder}
              />
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Default YouTube style rendering
  return (
    <div
      className={`group relative bg-white dark:bg-slate-800 rounded-2xl border border-black dark:border-black shadow-sm hover:shadow-md transition-all flex flex-col h-full ${isSelected ? 'ring-2 ring-sky-500' : ''
        } ${isCurrentlyPlaying ? 'ring-4 ring-red-500' : ''} ${bulkTagMode ? 'overflow-visible cursor-default' : 'overflow-visible cursor-context-menu'
        }`}
      {...longPressProps}
      onContextMenu={handleContextMenu}
      style={bulkTagBorderColor ? { borderColor: bulkTagBorderColor, borderWidth: '2px' } : undefined}
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
        <CardThumbnail
          src={thumbnailUrl}
          alt={video.title || `Video ${index + 1}`}
          fallbackIcon={isImage ? localImageFallbackIcon : (isLocal ? localFallbackIcon : null)}
          overlay={playOverlay}
          badges={badges}
          progress={progress}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isCurrentlyPlaying
            ? 'shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]'
            : ''
            }`}
        />
      </div>

      {/* Content Section (White bar at bottom) */}
      <div
        className={`relative pt-5 px-3 pb-3 flex flex-col justify-center bg-white dark:bg-slate-800 flex-1 overflow-hidden ${bulkTagMode ? '' : 'rounded-b-2xl'
          }`}
      >
        {/* Metadata overlay on hover */}
        {!bulkTagMode && (
          <div className="absolute pointer-events-none left-0 right-0 top-0 h-5 bg-black/90 text-white flex items-center justify-between px-2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            <div className="flex-1 truncate text-center px-1" title={video.author || 'Unknown'}>
              {video.author || 'Unknown'}
            </div>
            <div className="text-gray-400 text-[8px]">&bull;</div>
            <div className="flex-1 text-center px-1 shrink-0">
              {extractYear(video.published_at) || 'N/A'}
            </div>
            <div className="text-gray-400 text-[8px]">&bull;</div>
            <div className="flex-1 text-center px-1 shrink-0">
              {formatViewCount(video.view_count) || '0'}
            </div>
          </div>
        )}
        <div className="relative z-10 flex items-center justify-between min-h-[28px]">
          <div className="min-w-0 flex-1 mr-2">
            <h3
              className="font-bold text-sm text-slate-800 dark:text-white leading-tight line-clamp-2"
              title={video.title}
            >
              {video.title || `Video ${index + 1}`}
            </h3>
          </div>

          {/* Actions: 3-dot menu */}
          {!bulkTagMode && (
            <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              <VideoCardThreeDotMenu
                ref={menuRef}
                video={video}
                playlistId={playlistId}
                isPinned={isPinnedVideo}
                isPriority={isPriority}
                isFollower={isFollower}
                onTogglePin={(v) => { togglePin(v); if (onPinClick) onPinClick(v); }}
                onTogglePriorityPin={togglePriorityPin}
                onRemovePin={(id) => { removePin(id); if (onPinClick) onPinClick(video); }}
                videoFolders={videoFolders}
                folderMetadata={folderMetadata}
                onStarColorLeftClick={onStarColorLeftClick}
                onRenameFolder={onRenameFolder}
                drumstickRating={drumstickRating}
                onDrumstickRate={handleDrumstickRate}
                menuOptions={menuOptions}
                onMenuOptionClick={(option) => onMenuOptionClick?.(option, video)}
                triggerClassName="text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bulk tag: below thumbnail and title, when bulk tag mode is active */}
      {bulkTagMode && (
        <div
          className="relative w-full h-20 flex-shrink-0 overflow-hidden px-3 pb-3 rounded-b-2xl bg-white dark:bg-slate-800"
          data-card-action="true"
        >
          <BulkTagColorGrid
            videoId={video.id}
            currentFolders={videoFolders}
            selectedFolders={bulkTagSelections}
            onColorClick={onBulkTagColorClick}
            playlistId={playlistId}
            folderMetadata={folderMetadata}
            onRenameFolder={onRenameFolder}
          />
        </div>
      )}
    </div>
  );
};

export default VideoCard;
