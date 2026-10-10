import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/storageUtils';

/**
 * Pin Store - Persistent video pinning
 * Pins persist across sessions until manually removed
 * Supports normal pins (added via pin click)
 * Supports priority pins (always first/leftmost) set via long-press yellow pin button
 */
export const usePinStore = create(
  persist(
    (set, get) => {
      const initialState = {
        pinnedVideos: [], // Array of video objects: { id, video_id, video_url, title, ..., pinnedAt: timestamp }
        priorityPinIds: [], // Array of priority pin IDs, order matters (most recent first)
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
          const isNormalPin = !!pin && !isPriority;

          return {
            isPinned: isNormalPin,
            isPriority: isPriority,
            pinnedAt: pin ? pin.pinnedAt : null
          };
        },

        /**
         * Toggle pin status for a video (normal pin toggle)
         * - If Not Pinned: Pin as Normal Pin.
         * - If Pinned (normal or priority): Unpin video.
         * @param {Object} video - Video object to pin/unpin
         */
        togglePin: (video) => {
          const state = get();
          const isPinnedAny = state.pinnedVideos.some(v => v.id === video.id);

          if (isPinnedAny) {
            get().removePin(video.id);
          } else {
            const newPriorityIds = state.priorityPinIds.filter(id => id !== video.id);
            const pinWithTimestamp = { ...video, pinnedAt: Date.now() };
            const newPins = [...state.pinnedVideos, pinWithTimestamp];

            set({
              pinnedVideos: get()._sortPinsWithPriority(newPins, newPriorityIds),
              priorityPinIds: newPriorityIds,
            });
          }
        },

        /**
         * Check if a video is pinned (NORMAL PIN ONLY)
         * @param {number} videoId - Video ID to check
         * @returns {boolean}
         */
        isPinned: (videoId) => {
          const state = get();
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

          set({
            pinnedVideos: newPins,
            priorityPinIds: newPriorityIds,
          });
        },

        /**
         * Remove a pin by YouTube video_id (removes from all pin lists)
         * Used for auto-unpinning when videos are watched to completion
         * @param {string} videoId - YouTube video_id to unpin
         */
        removePinByVideoId: (videoId) => {
          const state = get();
          const pinToRemove = state.pinnedVideos.find(v => v.video_id === videoId);
          if (pinToRemove) {
            const newPins = state.pinnedVideos.filter(v => v.id !== pinToRemove.id);
            const newPriorityIds = state.priorityPinIds.filter(id => id !== pinToRemove.id);
            set({
              pinnedVideos: newPins,
              priorityPinIds: newPriorityIds,
            });
          }
        },

        /**
         * Clear all pins
         */
        clearAllPins: () => {
          set({ pinnedVideos: [], priorityPinIds: [] });
        },

        /**
         * Toggle a video as a priority pin (via long press/hold)
         * - If Not Pinned: Pin as Priority.
         * - If Normal Pin: Promote to Priority.
         * - If Already Priority: No change.
         * @param {Object} video - Video object to set as priority pin
         */
        togglePriorityPin: (video) => {
          const state = get();
          const isPriority = state.priorityPinIds.includes(video.id);

          if (isPriority) {
            return;
          } else {
            const newPriorityIds = [video.id, ...state.priorityPinIds];
            let newPins = state.pinnedVideos;
            const existingPin = state.pinnedVideos.find(v => v.id === video.id);

            if (!existingPin) {
              const pinWithTimestamp = { ...video, pinnedAt: Date.now() };
              newPins = [pinWithTimestamp, ...state.pinnedVideos];
            }

            set({
              priorityPinIds: newPriorityIds,
              pinnedVideos: get()._sortPinsWithPriority(newPins, newPriorityIds),
            });
          }
        },

        checkExpiration: () => {
          // No-op: all pins persist until manually removed
        },
      };
    },
    {
      name: 'pin-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        pinnedVideos: state.pinnedVideos,
        priorityPinIds: state.priorityPinIds,
      }),
    }
  )
);
