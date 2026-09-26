import { create } from 'zustand';

export const useQueueStore = create((set, get) => ({
    queue: [], // Array of video objects
    addToQueue: (video) => set((state) => ({ queue: [...state.queue, video] })),
    removeFromQueue: (videoId) => set((state) => ({ queue: state.queue.filter(v => v.id !== videoId) })),
    clearQueue: () => set({ queue: [] }),
    getQueue: () => get().queue
}));
