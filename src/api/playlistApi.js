import { invoke } from './platformBridge';
import { usePlaylistStore } from '../store/playlistStore';

const triggerUpdate = () => {
  try {
    const store = usePlaylistStore.getState();
    if (store && store.triggerPlaylistUpdate) {
      store.triggerPlaylistUpdate();
    }
  } catch (err) {
    console.error('Failed to trigger playlist update in store:', err);
  }
};

/**
 * Playlist API - All database operations for playlists
 */

// Playlist operations
export const createPlaylist = async (name, description = null) => {
  const result = await invoke('create_playlist', { name, description });
  triggerUpdate();
  return result;
};

export const getAllPlaylists = async () => {
  try {
    const result = await invoke('get_all_playlists');
    console.log('getAllPlaylists API result:', result);
    return result || [];
  } catch (error) {
    console.error('Error in getAllPlaylists API:', error);
    throw error;
  }
};

export const getAllPlaylistMetadata = async () => {
  try {
    const result = await invoke('get_all_playlist_metadata');
    return result || [];
  } catch (error) {
    console.error('Error in getAllPlaylistMetadata API:', error);
    throw error;
  }
};

export const getPlaylist = async (id) => {
  return await invoke('get_playlist', { id });
};

export const updatePlaylist = async (id, name = null, description = null, customAscii = null, customThumbnailUrl = null) => {
  const result = await invoke('update_playlist', { id, name, description, customAscii, customThumbnailUrl });
  triggerUpdate();
  return result;
};

export const deletePlaylist = async (id) => {
  const result = await invoke('delete_playlist', { id });
  triggerUpdate();
  return result;
};

export const deletePlaylistByName = async (name) => {
  const result = await invoke('delete_playlist_by_name', { name });
  triggerUpdate();
  return result;
};

// Playlist Source operations
export const addPlaylistSource = async (playlistId, sourceType, sourceValue, videoLimit = 10) => {
  return await invoke('add_playlist_source', { playlistId, sourceType, sourceValue, videoLimit });
};

export const updatePlaylistSourceLimit = async (id, videoLimit) => {
  return await invoke('update_playlist_source_limit', { id, videoLimit });
};

export const getPlaylistSources = async (playlistId) => {
  try {
    const result = await invoke('get_playlist_sources', { playlistId });
    return result || [];
  } catch (error) {
    console.error('Error in getPlaylistSources API:', error);
    throw error;
  }
};

export const updatePlaylistSourceName = async (id, customName) => {
  return await invoke('update_playlist_source_name', { id, customName });
};

export const updatePlaylistSourceSync = async (id) => {
  return await invoke('update_playlist_source_sync', { id });
};

export const removePlaylistSource = async (id) => {
  return await invoke('remove_playlist_source', { id });
};

// Playlist item operations
export const addVideoToPlaylist = async (playlistId, videoUrl, videoId, title, thumbnailUrl, author, viewCount, publishedAt, isLocal = false, profileImageUrl = null, durationSeconds = null, description = null, tags = null, likeCount = null, commentCount = null) => {
  try {
    const id = await invoke('add_video_to_playlist', {
      playlistId,
      videoUrl,
      videoId,
      title,
      thumbnailUrl,
      isLocal,
      author,
      viewCount,
      publishedAt,
      profileImageUrl,
      durationSeconds,
      description,
      tags,
      likeCount,
      commentCount
    });
    triggerUpdate();
    return id;
  } catch (error) {
    console.error('Failed to add video to playlist:', error);
    throw error;
  }
};

export const getPlaylistItems = async (playlistId) => {
  try {
    const result = await invoke('get_playlist_items', { playlistId });
    console.log('getPlaylistItems API result:', result);
    return result || [];
  } catch (error) {
    console.error('Error in getPlaylistItems API:', error);
    throw error;
  }
};

export const getPlaylistItemsPreview = async (playlistId, limit = 8) => {
  try {
    const result = await invoke('get_playlist_items_preview', { playlistId, limit });
    return result || [];
  } catch (error) {
    console.error('Error in getPlaylistItemsPreview API:', error);
    throw error;
  }
};

export const getPlaylistsForVideoIds = async (videoIds) => {
  try {
    const result = await invoke('get_playlists_for_video_ids', { videoIds });
    console.log('getPlaylistsForVideoIds API result:', result);
    return result || {};
  } catch (error) {
    console.error('Error in getPlaylistsForVideoIds API:', error);
    throw error;
  }
};

export const removeVideoFromPlaylist = async (playlistId, itemId) => {
  const result = await invoke('remove_video_from_playlist', {
    playlistId,
    itemId,
  });
  triggerUpdate();
  return result;
};

export const reorderPlaylistItem = async (playlistId, itemId, newPosition) => {
  const result = await invoke('reorder_playlist_item', {
    playlistId,
    itemId,
    newPosition,
  });
  triggerUpdate();
  return result;
};

// Folder assignment operations
export const assignVideoToFolder = async (playlistId, itemId, folderColor) => {
  const result = await invoke('assign_video_to_folder', {
    playlistId,
    itemId,
    folderColor,
  });
  triggerUpdate();
  return result;
};

export const unassignVideoFromFolder = async (playlistId, itemId, folderColor) => {
  const result = await invoke('unassign_video_from_folder', {
    playlistId,
    itemId,
    folderColor,
  });
  triggerUpdate();
  return result;
};

export const getVideosInFolder = async (playlistId, folderColor) => {
  return await invoke('get_videos_in_folder', {
    playlistId,
    folderColor,
  });
};

export const getVideoFolderAssignments = async (playlistId, itemId) => {
  return await invoke('get_video_folder_assignments', {
    playlistId,
    itemId,
  });
};

export const getAllFolderAssignments = async (playlistId) => {
  try {
    const result = await invoke('get_all_folder_assignments', { playlistId });
    return result || {};
  } catch (error) {
    console.error('Error in getAllFolderAssignments API:', error);
    throw error;
  }
};

export const getAllFoldersWithVideos = async () => {
  return await invoke('get_all_folders_with_videos');
};

export const getFoldersForPlaylist = async (playlistId) => {
  try {
    const result = await invoke('get_folders_for_playlist', { playlistId });
    return result || [];
  } catch (error) {
    console.error('Error in getFoldersForPlaylist API:', error);
    throw error;
  }
};

// Stuck folders operations
export const toggleStuckFolder = async (playlistId, folderColor) => {
  return await invoke('toggle_stuck_folder', { playlistId, folderColor });
};

export const isFolderStuck = async (playlistId, folderColor) => {
  return await invoke('is_folder_stuck', { playlistId, folderColor });
};

export const getAllStuckFolders = async () => {
  try {
    const result = await invoke('get_all_stuck_folders');
    return result || [];
  } catch (error) {
    console.error('Error in getAllStuckFolders API:', error);
    throw error;
  }
};

// Folder Metadata operations
export const getFolderMetadata = async (playlistId, folderColor) => {
  try {
    const result = await invoke('get_folder_metadata', { playlistId, folderColor });
    return result || null;
  } catch (error) {
    console.error('Error in getFolderMetadata API:', error);
    throw error;
  }
};

export const setFolderMetadata = async (playlistId, folderColor, name, description, customAscii) => {
  try {
    return await invoke('set_folder_metadata', { playlistId, folderColor, name, description, customAscii });
  } catch (error) {
    console.error('Error in setFolderMetadata API:', error);
    throw error;
  }
};

// Watch history operations
export const addToWatchHistory = async (videoUrl, videoId, title = null, thumbnailUrl = null) => {
  return await invoke('add_to_watch_history', {
    videoUrl,
    videoId,
    title,
    thumbnailUrl,
  });
};

export const getWatchHistory = async (limit = 100) => {
  try {
    const result = await invoke('get_watch_history', { limit });
    return result || [];
  } catch (error) {
    console.error('Error in getWatchHistory API:', error);
    throw error;
  }
};

export const clearWatchHistory = async () => {
  return await invoke('clear_watch_history');
};

export const getWatchedVideoIds = async () => {
  try {
    const result = await invoke('get_watched_video_ids');
    return result || [];
  } catch (error) {
    console.error('Error in getWatchedVideoIds API:', error);
    throw error;
  }
};

// Video progress operations
export const updateVideoProgress = async (videoId, videoUrl, duration = null, currentTime) => {
  return await invoke('update_video_progress', {
    videoId,
    videoUrl,
    duration,
    currentTime,
  });
};

export const getVideoProgress = async (videoId) => {
  try {
    const result = await invoke('get_video_progress', { videoId });
    return result;
  } catch (error) {
    console.error('Error in getVideoProgress API:', error);
    throw error;
  }
};

export const getAllVideoProgress = async () => {
  try {
    const result = await invoke('get_all_video_progress');
    return result || [];
  } catch (error) {
    console.error('Error in getAllVideoProgress API:', error);
    throw error;
  }
};

// Drumstick rating operations
export const getDrumstickRating = async (playlistId, itemId) => {
  try {
    const result = await invoke('get_drumstick_rating', { playlistId, itemId });
    return result || 0;
  } catch (error) {
    console.error('Error in getDrumstickRating API:', error);
    return 0;
  }
};

export const setDrumstickRating = async (playlistId, itemId, rating) => {
  try {
    return await invoke('set_drumstick_rating', { playlistId, itemId, rating });
  } catch (error) {
    console.error('Error in setDrumstickRating API:', error);
    throw error;
  }
};

/**
 * Export playlist to JSON format
 */
export const exportPlaylist = async (playlistId) => {
  try {
    const playlist = await getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    const videos = await getPlaylistItems(playlistId);
    
    const videosWithFolders = await Promise.all(
      videos.map(async (video) => {
        const folderAssignments = await getVideoFolderAssignments(playlistId, video.id);
        return {
          video_url: video.video_url,
          video_id: video.video_id,
          title: video.title,
          thumbnail_url: video.thumbnail_url,
          author: video.author,
          view_count: video.view_count,
          published_at: video.published_at,
          is_local: video.is_local,
          profile_image_url: video.profile_image_url,
          duration_seconds: video.duration_seconds,
          description: video.description,
          tags: video.tags,
          position: video.position,
          folder_assignments: Array.isArray(folderAssignments) ? folderAssignments : [],
        };
      })
    );

    return {
      version: '1.1',
      playlist: {
        name: playlist.name,
        description: playlist.description,
        created_at: playlist.created_at,
        updated_at: playlist.updated_at,
      },
      videos: videosWithFolders,
    };
  } catch (error) {
    console.error('Failed to export playlist:', error);
    throw error;
  }
};

/**
 * Import playlist from JSON format
 */
export const importPlaylistFromJson = async (jsonData) => {
  try {
    if (!jsonData.playlist || !jsonData.videos) throw new Error('Invalid JSON format');
    const playlistId = await createPlaylist(jsonData.playlist.name || 'Imported', jsonData.playlist.description || null);
    
    for (const video of jsonData.videos) {
      const itemId = await addVideoToPlaylist(
        playlistId,
        video.video_url || `https://www.youtube.com/watch?v=${video.video_id}`,
        video.video_id,
        video.title || null,
        video.thumbnail_url || null
      );
      if (video.folder_assignments) {
        for (const folderColor of video.folder_assignments) {
          await assignVideoToFolder(playlistId, itemId, folderColor);
        }
      }
    }
    return { playlistId };
  } catch (error) {
    console.error('Failed to import playlist:', error);
    throw error;
  }
};

export const getSetting = async (key) => {
  try {
    return await invoke('get_setting', { key });
  } catch (error) {
    console.error('Error in getSetting API:', error);
    return '';
  }
};

export const setSetting = async (key, value) => {
  try {
    return await invoke('set_setting', { key, value });
  } catch (error) {
    console.error('Error in setSetting API:', error);
    throw error;
  }
};
