import { create } from 'zustand';

export const useSubtitleStore = create((set, get) => ({
  availableSubtitles: [],
  activeSubtitleId: null, // null or 'off' = disabled
  activeVttUrl: null, // Blob URL or http stream URL for <track>
  fontSize: 'md', // 'sm' | 'md' | 'lg' | 'xl'

  setAvailableSubtitles: (subtitles) => {
    set({ availableSubtitles: Array.isArray(subtitles) ? subtitles : [] });
  },

  setActiveSubtitle: (trackId, vttUrlOrContent) => {
    const currentUrl = get().activeVttUrl;
    if (currentUrl && currentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentUrl);
    }

    if (!trackId || trackId === 'off' || !vttUrlOrContent) {
      set({ activeSubtitleId: null, activeVttUrl: null });
      return;
    }

    let finalUrl = vttUrlOrContent;
    // If it's VTT text content, convert to Blob URL
    if (typeof vttUrlOrContent === 'string' && (vttUrlOrContent.startsWith('WEBVTT') || vttUrlOrContent.includes('-->'))) {
      const blob = new Blob([vttUrlOrContent], { type: 'text/vtt' });
      finalUrl = URL.createObjectURL(blob);
    }

    set({ activeSubtitleId: trackId, activeVttUrl: finalUrl });
  },

  setFontSize: (fontSize) => set({ fontSize }),

  clearSubtitles: () => {
    const currentUrl = get().activeVttUrl;
    if (currentUrl && currentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentUrl);
    }
    set({ availableSubtitles: [], activeSubtitleId: null, activeVttUrl: null });
  }
}));
