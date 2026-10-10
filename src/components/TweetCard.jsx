import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import CardThumbnail from './CardThumbnail';
import BulkTagColorGrid from './BulkTagColorGrid';
import ImageHoverPreview from './ImageHoverPreview';
import { usePinStore } from '../store/pinStore';
import { useFolderStore } from '../store/folderStore';
import { usePlaylistStore } from '../store/playlistStore';
import { getDrumstickRating, setDrumstickRating } from '../api/playlistApi';
import VideoCardThreeDotMenu from './VideoCardThreeDotMenu';

const TweetCard = ({
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
    progress = 0,
    watchCount = 0,
    isStickied = false,
    playlistId = null,
    folderMetadata = {},
    onRenameFolder,
}) => {
    const { quickAssignFolder } = useFolderStore();

    const thumbnailUrl = useMemo(() => {
        // Upgrade Twitter card thumbnail to 'medium' for better clarity than 'thumb'
        // without the full overhead of 'large' for every grid item
        return video.thumbnail_url?.replace(/name=[a-z]+/, 'name=medium') || video.thumbnail_url;
    }, [video]);

    const previewUrl = useMemo(() => {
        // Use video raw mp4 url if available, otherwise upgrade Twitter thumbnail
        if (video.video_url && video.video_url.includes('.mp4')) {
            return video.video_url;
        }
        return video.thumbnail_url?.replace(/name=[a-z]+/, 'name=large') || video.thumbnail_url;
    }, [video]);

    const isVideoMedia = useMemo(() => {
        return !!(video.video_url && video.video_url.includes('.mp4'));
    }, [video]);

    const isPinnedVideo = usePinStore(state =>
        state.pinnedVideos.some(v => v.id === video.id) && !state.priorityPinIds.includes(video.id)
    );
    const isPriority = usePinStore(state => state.priorityPinIds.includes(video.id));
    const { togglePin, togglePriorityPin, removePin } = usePinStore();

    // Drumstick rating state
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
            if (video) video.drumstick_rating = newRating;
            usePlaylistStore.getState().updateItemRating(video.id, newRating);
        } catch (error) {
            console.error('Failed to set drumstick rating:', error);
        }
    };

    const splatterPath = "M47.5,12.2c0,0-2.3,16.2-7.8,19.3c-5.5,3.1-17.7-6.2-17.7-6.2s3.8,11.2-1.7,16.5c-5.5,5.3-20.2-2.1-20.2-2.1 s12.5,9.6,9.2,16.5c-3.3,6.9-10.7,5.5-10.7,5.5s12.9,5.7,12.5,14.7c-0.4,9-10.6,15.6-10.6,15.6s15.3-1.6,20.2,4.2 c4.9,5.8-0.9,13.8-0.9,13.8s9.4-9,16.9-5.3c7.5,3.7,5.9,14.6,5.9,14.6s5.9-11.8,13.6-10.6c7.7,1.2,13.6,9.5,13.6,9.5 s-1.8-13.6,5.3-16.7c7.1-3.1,16.5,2.7,16.5,2.7s-8.1-13.6-1.5-18.9c6.6-5.3,18.8,0.7,18.8,0.7s-13.2-8.1-11.1-16.7 C99.2,40.4,100,28.8,100,28.8s-12,8.8-17.7,3.1c-5.7-5.7-1.3-18.8-1.3-18.8s-9,11.6-16.5,9.4c-7.5-2.2-11.1-12.2-11.1-12.2 S50.4,14.5,47.5,12.2z";

    const menuOptions = [
        { label: isStickied ? 'Unsticky Video' : 'Sticky Video', action: 'toggleSticky', icon: <svg className="w-4 h-4 text-amber-500" viewBox="0 0 100 100" fill="currentColor"><path d={splatterPath} /></svg> },
        { label: 'Delete', danger: true, action: 'delete', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> },
        { label: 'Move to Playlist', action: 'moveToPlaylist', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg> },
        { label: 'Copy to Playlist', action: 'copyToPlaylist', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    ];

    // Parse author
    const authorMatch = video.author?.match(/^(.+?)\s*\(@(.+?)\)$/);
    const displayName = authorMatch ? authorMatch[1] : (video.author || 'Twitter User');
    const handle = authorMatch ? `@${authorMatch[2]}` : '';

    return (
        <Card
            onClick={bulkTagMode ? undefined : onVideoClick}
            selected={isSelected}
            playing={isCurrentlyPlaying}
            className={`h-full w-full group tweet-card transition-all duration-300 ${isCurrentlyPlaying ? 'ring-2 ring-sky-500 bg-sky-50/50' : ''}`}
            variant="minimal"
        >
            <div
                className="relative flex flex-col h-full bg-[#e0f2fe] rounded-2xl border border-sky-200 dark:border-sky-800/30 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >

                {/* Profile & Content Header */}
                <div className="flex gap-2.5 p-3 pb-2">
                    <div className="flex-shrink-0">
                        {video.profile_image_url ? (
                            <img
                                src={video.profile_image_url}
                                className="w-10 h-10 rounded-full border border-slate-100 shadow-sm object-cover"
                                alt={displayName}
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <div
                            className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold"
                            style={{ display: video.profile_image_url ? 'none' : 'flex' }}
                        >
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 group/author cursor-pointer">
                            <span className="font-bold truncate hover:underline text-sm" style={{ color: '#052F4A' }}>{displayName}</span>
                            <span className="text-slate-500 text-xs truncate">{handle}</span>
                            <span className="text-slate-400 text-xs">·</span>
                            <span className="text-slate-400 text-xs hover:underline">2026</span>
                        </div>

                        <p className="mt-0.5 text-sm leading-normal line-clamp-3" style={{ color: '#052F4A' }}>
                            {video.title || "Check out this amazing content!"}
                        </p>
                    </div>
                </div>

                {/* Media Content */}
                <div className="px-3 pb-2 flex-1 flex flex-col min-h-0">
                    <div className="relative rounded-xl overflow-hidden border border-sky-100 dark:border-sky-800/20 flex-1 min-h-[140px] bg-[#d0eafb]/50 p-1.5">
                        <ImageHoverPreview
                            src={thumbnailUrl}
                            previewSrc={previewUrl}
                            isVideo={isVideoMedia}
                            alt={video.title}
                            delay={500}
                        >
                            <CardThumbnail
                                src={thumbnailUrl}
                                alt={video.title}
                                progress={progress}
                                className="h-full w-full object-contain rounded-lg"
                            />
                        </ImageHoverPreview>

                        {!bulkTagMode && (
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <VideoCardThreeDotMenu
                                    video={video}
                                    playlistId={playlistId}
                                    isPinned={isPinnedVideo}
                                    isPriority={isPriority}
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
                                    onMenuOptionClick={onMenuOptionClick}
                                    triggerClassName="bg-black/50 hover:bg-black/70 backdrop-blur-md shadow-lg"
                                />
                            </div>
                        )}

                        {!isCurrentlyPlaying && watchCount > 0 && (
                            <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-green-400 font-bold text-xs shadow-lg flex items-center gap-0.5">
                                <svg className="w-3 h-3 stroke-[4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{watchCount}</span>
                            </div>
                        )}

                    </div>
                </div>

                {/* Bulk tag: below thumbnail when bulk tag mode is active */}
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

            <style jsx>{`
        .tweet-card :global(.card-thumbnail) {
          height: 100% !important;
        }
      `}</style>
        </Card>
    );
};

export default TweetCard;
