/**
 * Platform Bridge - Decouples the React frontend from Tauri.
 * Routes IPC and event APIs to Tauri, C# WebView2, or Web Browser Mock Mode.
 */

import {
  getSupabasePlaylists,
  getSupabasePlaylistMetadata,
  getSupabasePlaylistItems
} from './supabaseApi';

// Helper to determine active host environment
const isTauri = () => !!(window.__TAURI_INTERNALS__ || window.__TAURI__);
const isWebView2 = () => !!(window.chrome && window.chrome.webview);

// --- WebView2 Callback Registry (C# Integration) ---
const webViewCallbacks = new Map();
if (typeof window !== 'undefined' && isWebView2()) {
  window.chrome.webview.addEventListener('message', (event) => {
    const data = event.data;
    if (data && data.requestId) {
      const callback = webViewCallbacks.get(data.requestId);
      if (callback) {
        webViewCallbacks.delete(data.requestId);
        
        // If C# backend tells us it doesn't handle this command yet,
        // fall back to our local JS mock data so the UI functions.
        if (data.payload && data.payload.unhandled) {
          console.log(`[WPF Fallback] Routing unhandled C# command to JS Mock: ${callback.command}`);
          getMockResponse(callback.command, callback.args)
            .then(callback.resolve)
            .catch(callback.reject);
        } else {
          if (data.error) callback.reject(new Error(data.error));
          else callback.resolve(data.payload);
        }
      }
    } else if (data && data.type) {
      // Event listening dispatch (e.g. system events from C#)
      const listeners = eventListeners.get(data.type) || [];
      listeners.forEach(cb => cb({ payload: data.payload }));
    }
  });

  // Handle native window dragging in WebView2
  window.addEventListener('mousedown', (e) => {
    let target = e.target;
    while (target && target !== document.body) {
      if (target.classList?.contains('no-drag')) break;
      if (target.hasAttribute?.('data-tauri-drag-region')) {
        window.chrome.webview.postMessage({ command: 'window_drag' });
        break;
      }
      target = target.parentNode;
    }
  });
}

// --- Event Listener Registry (Universal) ---
const eventListeners = new Map();

// --- Browser Mock Mode State & Handlers ---
const MOCK_STORAGE_KEYS = {
  PLAYLISTS: 'mock_yttv_playlists',
  METADATA: 'mock_yttv_playlist_metadata',
  ITEMS: 'mock_yttv_playlist_items',
  PROGRESS: 'mock_yttv_video_progress',
  HISTORY: 'mock_yttv_watch_history',
  STUCK_FOLDERS: 'mock_yttv_stuck_folders',
  FOLDER_METADATA: 'mock_yttv_folder_metadata',
  FOLDER_ASSIGNMENTS: 'mock_yttv_folder_assignments',
  SETTINGS: 'mock_yttv_settings',
};

// Seed mock data if not present in localStorage (defaults to clean slate)
const seedMockData = () => {
  const existing = localStorage.getItem(MOCK_STORAGE_KEYS.PLAYLISTS);
  if (!existing || existing.includes('Lo-Fi Chill Beats') || existing.includes('Synthwave Retro Mix')) {
    localStorage.setItem(MOCK_STORAGE_KEYS.PLAYLISTS, JSON.stringify([]));
    localStorage.setItem(MOCK_STORAGE_KEYS.ITEMS, JSON.stringify({}));
    localStorage.setItem(MOCK_STORAGE_KEYS.PROGRESS, JSON.stringify({}));
    localStorage.setItem(MOCK_STORAGE_KEYS.HISTORY, JSON.stringify([]));
    localStorage.setItem(MOCK_STORAGE_KEYS.STUCK_FOLDERS, JSON.stringify([]));
    localStorage.setItem(MOCK_STORAGE_KEYS.FOLDER_METADATA, JSON.stringify({}));
    localStorage.setItem(MOCK_STORAGE_KEYS.FOLDER_ASSIGNMENTS, JSON.stringify({}));
  }
};

if (typeof window !== 'undefined') {
  seedMockData();
}

// Live simulated audio capture state
let mockAudioInterval = null;
let mockAudioTime = 0;

const getMockResponse = async (command, args) => {
  console.log(`[Mock API Request] ${command}`, args);
  await new Promise(r => setTimeout(r, 80)); // Simulate minor network/DB latency

  const getStored = (key) => JSON.parse(localStorage.getItem(key) || '[]');
  const setStored = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  switch (command) {
    case 'get_all_playlists': {
      const supaData = (await getSupabasePlaylists()) || [];
      const localData = getStored(MOCK_STORAGE_KEYS.PLAYLISTS) || [];
      const supaIds = new Set(supaData.map(p => String(p.id)));
      const filteredLocal = localData.filter(p => !supaIds.has(String(p.id)));
      return [...supaData, ...filteredLocal];
    }

    case 'get_all_playlist_metadata': {
      const supaMeta = (await getSupabasePlaylistMetadata()) || [];
      const supaIds = new Set(supaMeta.map(p => String(p.playlist_id || p.id)));
      const playlists = getStored(MOCK_STORAGE_KEYS.PLAYLISTS) || [];
      const itemsMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.ITEMS) || '{}');
      
      const localMeta = playlists
        .filter(p => !supaIds.has(String(p.id)))
        .map(p => {
          const items = itemsMap[p.id] || itemsMap[String(p.id)] || [];
          return {
            playlist_id: p.id,
            count: items.length,
            first_video: items[0] || null,
            recent_video: items[items.length - 1] || items[0] || null
          };
        });

      return [...supaMeta, ...localMeta];
    }

    case 'get_playlist': {
      const playlists = getStored(MOCK_STORAGE_KEYS.PLAYLISTS) || [];
      const localMatch = playlists.find(p => String(p.id) === String(args.id));
      if (localMatch) return localMatch;

      const supaPlaylists = await getSupabasePlaylists();
      if (supaPlaylists && supaPlaylists.length > 0) {
        const match = supaPlaylists.find(p => String(p.id) === String(args.id));
        if (match) return match;
      }
      return null;
    }

    case 'create_playlist': {
      const playlists = getStored(MOCK_STORAGE_KEYS.PLAYLISTS);
      const newId = playlists.length > 0 ? Math.max(...playlists.map(p => Number(p.id) || 0)) + 1000 : 1000;
      const newPlaylist = {
        id: newId,
        name: args.name,
        description: args.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      playlists.push(newPlaylist);
      setStored(MOCK_STORAGE_KEYS.PLAYLISTS, playlists);
      return newId;
    }

    case 'update_playlist': {
      const playlists = getStored(MOCK_STORAGE_KEYS.PLAYLISTS);
      const idx = playlists.findIndex(p => p.id === Number(args.id));
      if (idx !== -1) {
        if (args.name !== null) playlists[idx].name = args.name;
        if (args.description !== null) playlists[idx].description = args.description;
        playlists[idx].updated_at = new Date().toISOString();
        setStored(MOCK_STORAGE_KEYS.PLAYLISTS, playlists);
        return true;
      }
      return false;
    }

    case 'delete_playlist': {
      let playlists = getStored(MOCK_STORAGE_KEYS.PLAYLISTS);
      playlists = playlists.filter(p => p.id !== Number(args.id));
      setStored(MOCK_STORAGE_KEYS.PLAYLISTS, playlists);

      // Clean up items
      const itemsMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.ITEMS) || '{}');
      delete itemsMap[args.id];
      localStorage.setItem(MOCK_STORAGE_KEYS.ITEMS, JSON.stringify(itemsMap));
      return true;
    }

    case 'get_playlist_items':
    case 'get_playlist_items_preview': {
      const itemsMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.ITEMS) || '{}');
      const localItems = itemsMap[args.playlistId] || itemsMap[String(args.playlistId)];
      if (localItems && localItems.length > 0) {
        return command === 'get_playlist_items_preview'
          ? localItems.slice(0, args.limit || 4)
          : localItems;
      }
      const supaItems = await getSupabasePlaylistItems(args.playlistId);
      if (supaItems && supaItems.length > 0) {
        return command === 'get_playlist_items_preview'
          ? supaItems.slice(0, args.limit || 4)
          : supaItems;
      }
      return [];
    }

    case 'get_all_playlist_items_previews': {
      const limit = args.limit || 15;
      const result = {};

      const itemsMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.ITEMS) || '{}');
      for (const [playlistId, items] of Object.entries(itemsMap)) {
        if (Array.isArray(items) && items.length > 0) {
          result[playlistId] = items.slice(0, limit);
        }
      }

      const supaPlaylists = (await getSupabasePlaylists()) || [];
      for (const p of supaPlaylists) {
        if (!result[p.id]) {
          const supaItems = await getSupabasePlaylistItems(p.id);
          if (supaItems && supaItems.length > 0) {
            result[p.id] = supaItems.slice(0, limit);
          }
        }
      }
      return result;
    }

    case 'add_video_to_playlist': {
      const itemsMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.ITEMS) || '{}');
      const key = String(args.playlistId);
      const items = itemsMap[key] || [];
      const newId = Math.floor(Math.random() * 1000000);
      const newItem = {
        id: newId,
        playlist_id: args.playlistId,
        video_url: args.videoUrl,
        video_id: args.videoId,
        title: args.title || 'Untitled Video',
        thumbnail_url: args.thumbnailUrl || '',
        author: args.author || 'Unknown Author',
        view_count: args.viewCount || '0',
        published_at: args.publishedAt || null,
        profile_image_url: args.profileImageUrl || null,
        duration_seconds: args.durationSeconds || null,
        description: args.description || null,
        tags: args.tags || null,
        like_count: args.likeCount || null,
        comment_count: args.commentCount || null,
        position: items.length,
        added_at: new Date().toISOString(),
        is_local: args.isLocal ? 1 : 0
      };
      items.push(newItem);
      itemsMap[key] = items;
      localStorage.setItem(MOCK_STORAGE_KEYS.ITEMS, JSON.stringify(itemsMap));
      return newId;
    }

    case 'remove_video_from_playlist': {
      const itemsMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.ITEMS) || '{}');
      let items = itemsMap[args.playlistId] || [];
      items = items.filter(item => item.id !== Number(args.itemId));
      // Re-normalize positions
      items.forEach((item, index) => { item.position = index; });
      itemsMap[args.playlistId] = items;
      localStorage.setItem(MOCK_STORAGE_KEYS.ITEMS, JSON.stringify(itemsMap));
      return true;
    }

    case 'reorder_playlist_item': {
      const itemsMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.ITEMS) || '{}');
      let items = itemsMap[args.playlistId] || [];
      const itemToMove = items.find(item => item.id === Number(args.itemId));
      if (!itemToMove) return false;

      // Filter out item
      items = items.filter(item => item.id !== Number(args.itemId));
      // Insert at new position
      items.splice(args.newPosition, 0, itemToMove);
      // Re-normalize positions
      items.forEach((item, index) => { item.position = index; });
      itemsMap[args.playlistId] = items;
      localStorage.setItem(MOCK_STORAGE_KEYS.ITEMS, JSON.stringify(itemsMap));
      return true;
    }

    case 'get_video_progress': {
      const progressMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.PROGRESS) || '{}');
      return progressMap[args.videoId] || null;
    }

    case 'update_video_progress': {
      const progressMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.PROGRESS) || '{}');
      const prev = progressMap[args.videoId] || { watchCount: 0, hasFullyWatched: 0 };
      const duration = args.duration || 100;
      const progressPercent = (args.currentTime / duration) * 100;
      const isFullyWatched = progressPercent >= 85 || prev.hasFullyWatched === 1 ? 1 : 0;

      const record = {
        videoId: args.videoId,
        videoUrl: args.videoUrl,
        duration: duration,
        lastProgress: args.currentTime,
        progressPercentage: progressPercent,
        lastUpdated: new Date().toISOString(),
        hasFullyWatched: isFullyWatched,
        watchCount: prev.watchCount + (args.currentTime === 0 ? 1 : 0)
      };
      progressMap[args.videoId] = record;
      localStorage.setItem(MOCK_STORAGE_KEYS.PROGRESS, JSON.stringify(progressMap));
      return 1;
    }

    case 'get_watch_history': {
      return getStored(MOCK_STORAGE_KEYS.HISTORY).slice(0, args.limit || 100);
    }

    case 'add_to_watch_history': {
      const history = getStored(MOCK_STORAGE_KEYS.HISTORY);
      const newRecord = {
        id: Math.floor(Math.random() * 100000),
        video_url: args.videoUrl,
        video_id: args.videoId,
        title: args.title || 'Unknown Video',
        thumbnail_url: args.thumbnailUrl || '',
        watched_at: new Date().toISOString()
      };
      // Add to front, limit to 100
      const filtered = history.filter(h => h.video_id !== args.videoId);
      filtered.unshift(newRecord);
      setStored(MOCK_STORAGE_KEYS.HISTORY, filtered.slice(0, 100));
      return newRecord.id;
    }

    case 'clear_watch_history':
      setStored(MOCK_STORAGE_KEYS.HISTORY, []);
      return true;

    case 'get_video_folder_assignments': {
      const assignments = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.FOLDER_ASSIGNMENTS) || '{}');
      const key = `${args.playlistId}_${args.itemId}`;
      return assignments[key] || [];
    }

    case 'assign_video_to_folder': {
      const assignments = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.FOLDER_ASSIGNMENTS) || '{}');
      const key = `${args.playlistId}_${args.itemId}`;
      const list = assignments[key] || [];
      if (!list.includes(args.folderColor)) {
        list.push(args.folderColor);
        assignments[key] = list;
        localStorage.setItem(MOCK_STORAGE_KEYS.FOLDER_ASSIGNMENTS, JSON.stringify(assignments));
      }
      return 1;
    }

    case 'unassign_video_from_folder': {
      const assignments = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.FOLDER_ASSIGNMENTS) || '{}');
      const key = `${args.playlistId}_${args.itemId}`;
      let list = assignments[key] || [];
      list = list.filter(c => c !== args.folderColor);
      assignments[key] = list;
      localStorage.setItem(MOCK_STORAGE_KEYS.FOLDER_ASSIGNMENTS, JSON.stringify(assignments));
      return true;
    }

    case 'get_all_stuck_folders':
      return getStored(MOCK_STORAGE_KEYS.STUCK_FOLDERS);

    case 'is_folder_stuck': {
      const stuck = getStored(MOCK_STORAGE_KEYS.STUCK_FOLDERS);
      return stuck.some(s => s.playlistId === args.playlistId && s.folderColor === args.folderColor);
    }

    case 'toggle_stuck_folder': {
      const stuck = getStored(MOCK_STORAGE_KEYS.STUCK_FOLDERS);
      const existingIdx = stuck.findIndex(s => s.playlistId === args.playlistId && s.folderColor === args.folderColor);
      let isStuck = false;
      if (existingIdx !== -1) {
        stuck.splice(existingIdx, 1);
      } else {
        stuck.push({ playlistId: args.playlistId, folderColor: args.folderColor, created_at: new Date().toISOString() });
        isStuck = true;
      }
      setStored(MOCK_STORAGE_KEYS.STUCK_FOLDERS, stuck);
      return isStuck;
    }

    case 'get_folder_metadata': {
      const metadata = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.FOLDER_METADATA) || '{}');
      const key = `${args.playlistId}_${args.folderColor}`;
      return metadata[key] || null;
    }

    case 'set_folder_metadata': {
      const metadata = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.FOLDER_METADATA) || '{}');
      const key = `${args.playlistId}_${args.folderColor}`;
      metadata[key] = {
        name: args.name,
        description: args.description,
        customAscii: args.customAscii,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(MOCK_STORAGE_KEYS.FOLDER_METADATA, JSON.stringify(metadata));
      return true;
    }

    case 'start_audio_capture': {
      if (mockAudioInterval) clearInterval(mockAudioInterval);
      mockAudioInterval = setInterval(() => {
        mockAudioTime += 0.05;
        // Generate 113 values mapping to a moving sine wave visualizer + noise
        const bins = new Uint8Array(113);
        for (let i = 0; i < 113; i++) {
          // Low frequencies have higher amplitude, higher frequencies taper off
          const base = Math.max(0, 100 - i * 0.8);
          // Wave movement based on index and time
          const wave = Math.sin(i * 0.15 - mockAudioTime) * 30 + Math.sin(i * 0.05 + mockAudioTime * 2.1) * 20;
          // Random static noise
          const noise = Math.random() * 10 - 5;
          bins[i] = Math.max(0, Math.min(255, base + wave + noise));
        }

        // Trigger 'audio-bins' callbacks
        const callbacks = eventListeners.get('audio-bins') || [];
        callbacks.forEach(cb => cb({ payload: Array.from(bins) }));
      }, 16); // 60Hz loop
      return true;
    }

    case 'stop_audio_capture':
      if (mockAudioInterval) {
        clearInterval(mockAudioInterval);
        mockAudioInterval = null;
      }
      return true;

    case 'test_audio_command':
      return 'Mock audio service active';

    case 'get_video_stream_url':
      // Return standard public streaming MP4 for testing, or standard source if YouTube
      if (args.filePath?.includes('youtube.com') || args.filePath?.includes('youtu.be')) {
        return args.filePath;
      }
      // Return a public big buck bunny file if checking local streaming fallback
      return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    case 'select_video_files':
      return ['C:\\Videos\\SampleMovie1.mp4', 'C:\\Videos\\MusicVideo2.mkv'];

    case 'select_video_folder':
      return 'C:\\Videos\\MySummerClips';

    case 'get_videos_in_directory':
      return [
        `C:\\Videos\\MySummerClips\\clip1.mp4`,
        `C:\\Videos\\MySummerClips\\clip2.mp4`,
        `C:\\Videos\\MySummerClips\\family_day.mkv`
      ];

    case 'get_watched_video_ids': {
      const progressMap = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.PROGRESS) || '{}');
      return Object.values(progressMap)
        .filter(p => p.progressPercentage >= 85 || p.hasFullyWatched === 1)
        .map(p => p.videoId);
    }

    case 'save_image_to_cache':
      return args.base64Data;

    case 'get_setting': {
      const settings = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.SETTINGS) || '{}');
      return settings[args.key] || '';
    }

    case 'set_setting': {
      const settings = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEYS.SETTINGS) || '{}');
      settings[args.key] = args.value;
      localStorage.setItem(MOCK_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    }

    case 'get_video_subtitles':
      return [
        { id: 'mock-sub-1', label: 'English (Sidecar .vtt)', type: 'sidecar', path: 'mock_sub_en.vtt', isVtt: true },
        { id: 'mock-sub-2', label: 'Spanish (Sidecar .srt)', type: 'sidecar', path: 'mock_sub_es.srt', isVtt: false }
      ];

    case 'read_subtitle_vtt':
      return `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Welcome to YTTV Subtitle Support!

2
00:00:04.500 --> 00:00:08.000
This subtitle track is loaded dynamically for local videos.`;

    case 'read_raw_subtitle':
      return `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,{\\pos(640,100)}Welcome to YTTV JASSUB Styled Subtitles!`;

    case 'select_subtitle_file':
      return 'C:\\Videos\\ExternalSubtitle.vtt';

    default:
      console.warn(`[Mock API Warning] Unhandled mock command: ${command}`);
      return null;
  }
};

// --- Exported IPC Wrappers ---

export const invoke = async (command, args = {}) => {
  if (isTauri()) {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    return await tauriInvoke(command, args);
  }

  if (isWebView2()) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2, 11);
      webViewCallbacks.set(requestId, { resolve, reject, command, args });
      window.chrome.webview.postMessage({ command, args, requestId });
    });
  }

  // Fallback to browser mock mode
  return await getMockResponse(command, args);
};

export const listen = async (eventName, callback) => {
  if (isTauri()) {
    const { listen: tauriListen } = await import('@tauri-apps/api/event');
    return await tauriListen(eventName, callback);
  }

  // Register in local callback registry
  let list = eventListeners.get(eventName);
  if (!list) {
    list = [];
    eventListeners.set(eventName, list);
  }
  list.push(callback);

  // Return unlisten function
  return () => {
    let current = eventListeners.get(eventName);
    if (current) {
      eventListeners.set(eventName, current.filter(cb => cb !== callback));
    }
  };
};

export const openUrl = async (url) => {
  if (isTauri()) {
    const { openUrl: tauriOpenUrl } = await import('@tauri-apps/plugin-opener');
    return await tauriOpenUrl(url);
  }

  if (isWebView2()) {
    // Dispatch to C# to handle starting process in default browser
    window.chrome.webview.postMessage({ command: 'open_url', args: { url } });
    return true;
  }

  // Standard web browser fallback
  window.open(url, '_blank');
  return true;
};

export const getCurrentWindow = () => {
  if (isTauri()) {
    return {
      label: 'main',
      minimize: async () => {
        const { getCurrentWindow: getTauriWin } = await import('@tauri-apps/api/window');
        return await getTauriWin().minimize();
      },
      toggleMaximize: async () => {
        const { getCurrentWindow: getTauriWin } = await import('@tauri-apps/api/window');
        return await getTauriWin().toggleMaximize();
      },
      close: async () => {
        const { getCurrentWindow: getTauriWin } = await import('@tauri-apps/api/window');
        return await getTauriWin().close();
      },
      isMaximized: async () => {
        const { getCurrentWindow: getTauriWin } = await import('@tauri-apps/api/window');
        return await getTauriWin().isMaximized();
      }
    };
  }

  if (isWebView2()) {
    return {
      label: 'main',
      minimize: async () => {
        window.chrome.webview.postMessage({ command: 'window_minimize' });
      },
      toggleMaximize: async () => {
        window.chrome.webview.postMessage({ command: 'window_toggle_maximize' });
      },
      close: async () => {
        window.chrome.webview.postMessage({ command: 'window_close' });
      },
      isMaximized: async () => {
        return new Promise((resolve) => {
          const requestId = Math.random().toString(36).substring(2, 11);
          webViewCallbacks.set(requestId, { resolve, reject: () => resolve(false) });
          window.chrome.webview.postMessage({ command: 'window_is_maximized', requestId });
        });
      }
    };
  }

  // Browser Mock Mode fallback
  return {
    label: 'mock-browser-window',
    minimize: async () => console.log('[Window Action] Minimize clicked'),
    toggleMaximize: async () => console.log('[Window Action] Toggle Maximize clicked'),
    close: async () => console.log('[Window Action] Close clicked'),
    isMaximized: async () => false
  };
};

export const saveImageToCache = async (base64Data, prefix = 'image') => {
  if (!base64Data || !base64Data.startsWith('data:')) return base64Data;
  try {
    return await invoke('save_image_to_cache', { base64Data, prefix });
  } catch (err) {
    console.error('Failed to save image to C# cache:', err);
    return base64Data;
  }
};
