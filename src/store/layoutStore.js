import { create } from 'zustand';

export const useLayoutStore = create((set) => ({
  viewMode: 'full', // 'full' | 'half' | 'quarter'
  menuQuarterMode: false, // Menu docked in bottom-right
  showDebugBounds: false, // Visual debug mode for layout bounds
  inspectMode: false, // Inspect element mode for showing UI labels
  showRuler: false, // Ruler overlay for measurements
  showDevToolbar: true, // Visibility of the floating dev toolbar (full/half/quarter/etc buttons)
  videoCardStyle: 'youtube', // 'youtube' | 'twitter' - Card display style

  // When true, FullscreenVideoInfo renders blank immediately (used when opening splitscreen from fullscreen)
  fullscreenInfoBlanked: false,
  setFullscreenInfoBlanked: (v) => set({ fullscreenInfoBlanked: !!v }),

  // When true, a transparent shield blocks pointer events over the YouTube player to prevent its UI from showing
  screenProtectorActive: true,
  toggleScreenProtector: () => set((state) => ({ screenProtectorActive: !state.screenProtectorActive })),

  setViewMode: (mode) => {
    if (['full', 'half', 'quarter'].includes(mode)) {
      set((state) => ({
        viewMode: mode,
        ...(mode === 'full' ? { fullscreenInfoBlanked: false } : {})
      }));
      // Disable menu quarter mode when switching to full screen
      if (mode === 'full') {
        set({ menuQuarterMode: false });
      }
    }
  },

  toggleMenuQuarterMode: () => set((state) => {
    // Only allow toggling when not in full screen mode
    if (state.viewMode === 'full') return state;
    return { menuQuarterMode: !state.menuQuarterMode };
  }),

  toggleDebugBounds: () => set((state) => {
    const newValue = !state.showDebugBounds;
    console.log('Debug bounds toggled:', newValue);
    return { showDebugBounds: newValue };
  }),

  toggleInspectMode: () => set((state) => {
    const newValue = !state.inspectMode;
    console.log('Inspect mode toggled:', newValue);
    return { inspectMode: newValue };
  }),

  toggleRuler: () => set((state) => {
    const newValue = !state.showRuler;
    console.log('Ruler toggled:', newValue);
    return { showRuler: newValue };
  }),

  // Toggle visibility of the dev toolbar
  toggleDevToolbar: () => set((state) => ({ showDevToolbar: !state.showDevToolbar })),

  // Toggle video card style between YouTube and Twitter/X
  toggleVideoCardStyle: () => set((state) => ({
    videoCardStyle: state.videoCardStyle === 'youtube' ? 'twitter' : 'youtube'
  })),

  // Playlists page: show video titles on all cards (synced from localStorage in PlaylistsPage)
  playlistsPageShowTitles: false,
  setPlaylistsPageShowTitles: (v) => set((s) => ({
    playlistsPageShowTitles: v === undefined ? !s.playlistsPageShowTitles : v
  })),

  // Playlists page: when true, PlaylistsPage opens uploader and clears this
  showPlaylistUploader: false,
  setShowPlaylistUploader: (v) => set({ showPlaylistUploader: !!v }),

  // Videos page: when true, VideosPage opens uploader and clears this
  showVideosUploader: false,
  setShowVideosUploader: (v) => set({ showVideosUploader: !!v }),

  // Videos page: subscription manager modal (VideosPage renders it)
  showSubscriptionManager: false,
  setShowSubscriptionManager: (v) => set({ showSubscriptionManager: !!v }),

  // Videos page: one-shot trigger to run subscription refresh (VideosPage handles and clears)
  requestSubscriptionRefresh: false,
  setRequestSubscriptionRefresh: (v) => set({ requestSubscriptionRefresh: !!v }),

  // Videos page: one-shot to open Auto-Tag modal (e.g. right-click on Bulk tag in TopNav)
  requestShowAutoTagModal: false,
  setRequestShowAutoTagModal: (v) => set({ requestShowAutoTagModal: !!v }),

  // Videos page: visibility of different card source types
  visibleSourceTypes: {
    orb: true,
    banner: true,
    video: true,
    image: true,
    tracker: true,
    channel: true,
    tweet: true,
  },
  setVisibleSourceTypes: (types) => set({ visibleSourceTypes: types }),
  toggleSourceTypeVisibility: (type) => set((state) => ({
    visibleSourceTypes: {
      ...state.visibleSourceTypes,
      [type]: !state.visibleSourceTypes[type]
    }
  })),
}));

if (typeof window !== 'undefined') {
  window.useLayoutStore = useLayoutStore;
}

