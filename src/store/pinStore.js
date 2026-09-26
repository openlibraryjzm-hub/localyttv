import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/storageUtils';

/**
 * Pin Store - Persistent video pinning
 * Pins persist across sessions until manually removed
 * Supports priority pins (always first/leftmost) set via yellow pin button
 * Supports follower pins (modifier that can be applied to normal or priority pins)
 * All pins (normal, priority, and follower) persist until manually removed
 */
export const usePinStore = create(
  persist(
    (set, get) => {
      // access initial state if needed for reset, but persist middleware handles hydration
      const initialState = {
        pinnedVideos: [], // Array of video objects: { id, video_id, video_url, title, ..., pinnedAt: timestamp }
        priorityPinIds: [], // Array of priority pin IDs, order matters (most recent first)
        followerPinIds: [], // Array of follower pin IDs (can be combined with normal or priority)
      };

      return {
        ...initialState,

        /**
         * Helper to ensure priority pins are always first in the array
         * @param {Array} videos - Array of pinned videos
         * @param {Array} priorityIds - Array of priority pin IDs
         * @returns {Array} Sorted array with priority pins first
         */
        _sortPinsWithPriority: (videos, priorityIds) => {
          if (!priorityIds || priorityIds.length === 0) return videos;

          const priorityPins = [];
          const otherPins = [];

          videos.forEach(v => {
            if (priorityIds.includes(v.id)) {
              priorityPins.push(v);
            } else {
              otherPins.push(v);
            }
          });

          // Sort priority pins by their order in priorityIds
          priorityPins.sort((a, b) => {
            return priorityIds.indexOf(a.id) - priorityIds.indexOf(b.id);
          });

          return [...priorityPins, ...otherPins];
        },

        /**
         * Get full pin info for a video
         * @param {number} videoId 
         */
        getPinInfo: (videoId) => {
          const state = get();
          const pin = state.pinnedVideos.find(v => v.id === videoId);
          const isPriority = state.priorityPinIds.includes(videoId);
          const isFollower = state.followerPinIds.includes(videoId);
          const isNormalPin = !!pin && !isPriority;

          return {
            isPinned: isNormalPin,
            isPriority: isPriority,
            isFollower: isFollower,
            pinnedAt: pin ? pin.pinnedAt : null
          };
        },

        /**
         * Check if a video is a follower pin
         * @param {number} videoId - Video ID to check
         * @returns {boolean}
         */
        isFollowerPin: (videoId) => {
          const state = get();
          return state.followerPinIds.includes(videoId);
        },

        /**
         * Toggle follower status for an already pinned video
         * @param {number} videoId - Video ID to toggle follower status
         */
        toggleFollowerPin: (videoId) => {
          const state = get();
          const isFollower = state.followerPinIds.includes(videoId);

          if (isFollower) {
            // Remove from follower pins
            const newFollowerIds = state.followerPinIds.filter(id => id !== videoId);
            set({ followerPinIds: newFollowerIds });
          } else {
            // Add to follower pins
            const newFollowerIds = [videoId, ...state.followerPinIds];
            set({ followerPinIds: newFollowerIds });
          }
        },

        /**
         * Set a video as a follower pin (adds to followerPinIds if pinned)
         * @param {number} videoId - Video ID to set as follower
         */
        setFollowerPin: (videoId) => {
          const state = get();
          const isPinned = state.pinnedVideos.some(v => v.id === videoId);

          if (isPinned && !state.followerPinIds.includes(videoId)) {
            const newFollowerIds = [videoId, ...state.followerPinIds];
            set({ followerPinIds: newFollowerIds });
          }
        },

        /**
         * Remove follower status from a video
         * @param {number} videoId - Video ID to remove follower status
         */
        removeFollowerStatus: (videoId) => {
          const state = get();
          if (state.followerPinIds.includes(videoId)) {
            const newFollowerIds = state.followerPinIds.filter(id => id !== videoId);
            set({ followerPinIds: newFollowerIds });
          }
        },

        /**
         * Toggle pin status for a video (normal pin from video card)
         * NEW BEHAVIOR:
         * - If Not Pinned: Pin as Normal.
         * - If Pinned (normal or priority) and NOT follower: Add follower modifier.
         * - If Pinned (normal or priority) and IS follower: Remove follower modifier (keep pin).
         * Use removePin() or double-click for full unpin.
         * @param {Object} video - Video object to pin/toggle follower
         */
        togglePin: (video) => {
          const state = get();
          const isPinned = state.pinnedVideos.some(v => v.id === video.id);
          const isFollower = state.followerPinIds.includes(video.id);

          if (!isPinned) {
            // Not pinned → Add as Normal pin
            const newPriorityIds = state.priorityPinIds.filter(id => id !== video.id);
            const pinWithTimestamp = { ...video, pinnedAt: Date.now() };
            const newPins = [...state.pinnedVideos, pinWithTimestamp];

            set({
              pinnedVideos: get()._sortPinsWithPriority(newPins, newPriorityIds),
              priorityPinIds: newPriorityIds,
            });
          } else if (isFollower) {
            // Already a follower → Remove follower modifier (keep pin status)
            const newFollowerIds = state.followerPinIds.filter(id => id !== video.id);
            set({ followerPinIds: newFollowerIds });
          } else {
            // Pinned but not follower → Add follower modifier
            const newFollowerIds = [video.id, ...state.followerPinIds];
            set({ followerPinIds: newFollowerIds });
          }
        },

        /**
         * Check if a video is pinned (NORMAL PIN ONLY)
         * @param {number} videoId - Video ID to check
         * @returns {boolean}
         */
        isPinned: (videoId) => {
          const state = get();
          // It is pinned if in pinnedVideos AND NOT in priorityPinIds
          return state.pinnedVideos.some(v => v.id === videoId) && !state.priorityPinIds.includes(videoId);
        },

        /**
         * Check if a video is a priority pin
         * @param {number} videoId - Video ID to check
         * @returns {boolean}
         */
        isPriorityPin: (videoId) => {
          const state = get();
          return state.priorityPinIds.includes(videoId);
        },

        /**
         * Remove a pin by video ID (removes from all pin lists)
         * @param {number} videoId - Video ID to unpin
         */
        removePin: (videoId) => {
          const state = get();
          const newPins = state.pinnedVideos.filter(v => v.id !== videoId);
          const newPriorityIds = state.priorityPinIds.filter(id => id !== videoId);
          const newFollowerIds = state.followerPinIds.filter(id => id !== videoId);

          set({
            pinnedVideos: newPins,
            priorityPinIds: newPriorityIds,
            followerPinIds: newFollowerIds,
          });
        },

        /**
         * Remove a pin by YouTube video_id (removes from all pin lists)
         * Used for auto-unpinning when videos are watched to completion
         * @param {string} videoId - YouTube video_id to unpin
         */
        removePinByVideoId: (videoId) => {
          const state = get();
          // Find the pin by video_id (YouTube ID)
          const pinToRemove = state.pinnedVideos.find(v => v.video_id === videoId);
          if (pinToRemove) {
            // Remove by database id
            const newPins = state.pinnedVideos.filter(v => v.id !== pinToRemove.id);
            const newPriorityIds = state.priorityPinIds.filter(id => id !== pinToRemove.id);
            const newFollowerIds = state.followerPinIds.filter(id => id !== pinToRemove.id);
            set({
              pinnedVideos: newPins,
              priorityPinIds: newPriorityIds,
              followerPinIds: newFollowerIds,
            });
          }
        },

        /**
         * Handle follower pin completion - transfer pin to next video in playlist
         * If the completed video is a follower pin, the pin transfers to the next 
         * chronological video in the playlist. Otherwise, just unpins normally.
         * @param {string} videoId - YouTube video_id that was completed
         * @param {Array} playlistItems - Array of videos in the current playlist
         * @returns {Object|null} - Returns the next video if pin was transferred, null otherwise
         */
        handleFollowerPinCompletion: (videoId, playlistItems) => {
          const state = get();

          // Find the pin by video_id (YouTube ID)
          const pinToRemove = state.pinnedVideos.find(v => v.video_id === videoId);
          if (!pinToRemove) return null;

          const isFollower = state.followerPinIds.includes(pinToRemove.id);
          const isPriority = state.priorityPinIds.includes(pinToRemove.id);

          if (!isFollower || !playlistItems || playlistItems.length === 0) {
            // Not a follower pin or no playlist - just unpin normally
            get().removePinByVideoId(videoId);
            return null;
          }

          // Find current video's position in playlist
          const currentIndex = playlistItems.findIndex(v =>
            v.video_id === videoId ||
            (v.video_url && v.video_url.includes(videoId))
          );

          if (currentIndex === -1 || currentIndex >= playlistItems.length - 1) {
            // Video not found in playlist or is the last video - just unpin
            get().removePinByVideoId(videoId);
            return null;
          }

          // Get the next video in the playlist
          const nextVideo = playlistItems[currentIndex + 1];
          if (!nextVideo) {
            get().removePinByVideoId(videoId);
            return null;
          }

          // Transfer the pin to the next video
          // 1. Remove old pin from pinnedVideos
          const newPins = state.pinnedVideos.filter(v => v.id !== pinToRemove.id);

          // 2. Add new pin for next video
          const nextPinWithTimestamp = { ...nextVideo, pinnedAt: Date.now() };
          newPins.push(nextPinWithTimestamp);

          // 3. Update priority status if original was priority
          let newPriorityIds = state.priorityPinIds.filter(id => id !== pinToRemove.id);
          if (isPriority) {
            newPriorityIds = [nextVideo.id, ...newPriorityIds];
          }

          // 4. Transfer follower status to new video, remove from old
          let newFollowerIds = state.followerPinIds.filter(id => id !== pinToRemove.id);
          newFollowerIds = [nextVideo.id, ...newFollowerIds];

          set({
            pinnedVideos: get()._sortPinsWithPriority(newPins, newPriorityIds),
            priorityPinIds: newPriorityIds,
            followerPinIds: newFollowerIds,
          });

          console.log(`[FollowerPin] Transferred pin from "${pinToRemove.title}" to "${nextVideo.title}"`);
          return nextVideo;
        },

        /**
         * Clear all pins
         */
        clearAllPins: () => {
          set({ pinnedVideos: [], priorityPinIds: [], followerPinIds: [] });
        },

        /**
         * Toggle a video as a priority pin (via long press/hold)
         * NEW BEHAVIOR (called via long press):
         * - If Not Pinned: Pin as Priority.
         * - If Normal Pin: Promote to Priority.
         * - If Already Priority: No change (long press on priority is idempotent).
         * @param {Object} video - Video object to set as priority pin
         */
        togglePriorityPin: (video) => {
          const state = get();
          const isPriority = state.priorityPinIds.includes(video.id);

          if (isPriority) {
            // Already priority - do nothing (long press is idempotent)
            // User must use double-click or removePin to unpin
            return;
          } else {
            // Add to Priority (Promote or new)
            const newPriorityIds = [video.id, ...state.priorityPinIds];

            let newPins = state.pinnedVideos;
            const existingPin = state.pinnedVideos.find(v => v.id === video.id);

            if (!existingPin) {
              // Add to pinnedVideos if not present
              const pinWithTimestamp = { ...video, pinnedAt: Date.now() };
              newPins = [pinWithTimestamp, ...state.pinnedVideos];
            }

            set({
              priorityPinIds: newPriorityIds,
              pinnedVideos: get()._sortPinsWithPriority(newPins, newPriorityIds),
            });
          }
        },

        /**
         * Check and remove expired pins
         * NOTE: Pins no longer expire - this function is kept for backward compatibility
         * but does nothing. All pins persist until manually removed.
         */
        checkExpiration: () => {
          // Pins no longer expire - function kept for backward compatibility
          // No-op: all pins persist until manually removed
        },
      };
    },
    {
      name: 'pin-storage', // localStorage / idb key
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        pinnedVideos: state.pinnedVideos,
        priorityPinIds: state.priorityPinIds,
        followerPinIds: state.followerPinIds
      }), // Persist all pin lists
    }
  )
);
