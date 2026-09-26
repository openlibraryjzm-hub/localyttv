import { create } from 'zustand';

const VALID_VIEW_IDS = ['all', 'unsorted', 'groups'];

// Load tabs from localStorage
const loadTabs = () => {
  try {
    const stored = localStorage.getItem('playlistTabs');
    if (stored) {
      return JSON.parse(stored);
    }
    // Default: just "All" tab
    return [{ id: 'all', name: 'All', playlistIds: [] }];
  } catch {
    return [{ id: 'all', name: 'All', playlistIds: [] }];
  }
};

// Save tabs to localStorage
const saveTabs = (tabs) => {
  try {
    localStorage.setItem('playlistTabs', JSON.stringify(tabs));
  } catch (error) {
    console.error('Failed to save tabs:', error);
  }
};

const useTabStore = create((set, get) => ({
  tabs: loadTabs(),
  activeTabId: 'all',

  setActiveTab: (tabId) => {
    const id = VALID_VIEW_IDS.includes(tabId) ? tabId : 'all';
    set({ activeTabId: id });
    try {
      localStorage.setItem('activeTabId', id);
    } catch (error) {
      console.error('Failed to save active tab:', error);
    }
  },

  createTab: (name) => {
    const state = get();
    const newTab = {
      id: `tab-${Date.now()}`,
      name: name || `Tab ${state.tabs.length}`,
      playlistIds: [],
    };
    const updatedTabs = [...state.tabs, newTab];
    saveTabs(updatedTabs);
    set({ tabs: updatedTabs, activeTabId: newTab.id });
    return newTab.id;
  },

  deleteTab: (tabId) => {
    if (tabId === 'all') return; // Can't delete "All" tab
    const state = get();
    const updatedTabs = state.tabs.filter(tab => tab.id !== tabId);
    saveTabs(updatedTabs);
    const newActiveTabId = state.activeTabId === tabId ? 'all' : state.activeTabId;
    set({ tabs: updatedTabs, activeTabId: newActiveTabId });
    try {
      localStorage.setItem('activeTabId', newActiveTabId);
    } catch (error) {
      console.error('Failed to save active tab:', error);
    }
  },

  addPlaylistToTab: (tabId, playlistId) => {
    if (tabId === 'all') return; // Can't add to "All" tab
    const state = get();
    const updatedTabs = state.tabs.map(tab => {
      if (tab.id === tabId && !tab.playlistIds.some(id => String(id) === String(playlistId))) {
        return { ...tab, playlistIds: [...tab.playlistIds, playlistId] };
      }
      return tab;
    });
    saveTabs(updatedTabs);
    set({ tabs: updatedTabs });
  },

  removePlaylistFromTab: (tabId, playlistId) => {
    if (tabId === 'all') return; // Can't remove from "All" tab
    const state = get();
    const updatedTabs = state.tabs.map(tab => {
      if (tab.id === tabId) {
        return { ...tab, playlistIds: tab.playlistIds.filter(id => String(id) !== String(playlistId)) };
      }
      return tab;
    });
    saveTabs(updatedTabs);
    set({ tabs: updatedTabs });
  },

  renameTab: (tabId, newName) => {
    if (tabId === 'all') return; // Can't rename "All" tab
    const state = get();
    const updatedTabs = state.tabs.map(tab => {
      if (tab.id === tabId) {
        return { ...tab, name: newName };
      }
      return tab;
    });
    saveTabs(updatedTabs);
    set({ tabs: updatedTabs });
  },
}));

// Load active view from localStorage on init (only all | unsorted | groups)
const loadActiveTab = () => {
  try {
    const stored = localStorage.getItem('activeTabId');
    if (stored && VALID_VIEW_IDS.includes(stored)) return stored;
    return 'all';
  } catch {
    return 'all';
  }
};

// Restore saved view on load
useTabStore.getState().setActiveTab(loadActiveTab());

export { useTabStore };

