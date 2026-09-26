import React, { useState } from 'react';
import { invoke } from '../api/platformBridge';
import { addVideoToPlaylist, createPlaylist } from '../api/playlistApi';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';


// Helper to extract a thumbnail frame (base64 JPEG) and video duration in the background
const extractVideoMetadata = (streamUrl) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = streamUrl;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    // Timeout in case loading/seeking stalls (e.g. invalid file or format issue)
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({ thumbnailUrl: null, duration: null });
    }, 6000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.src = '';
      try {
        video.load();
      } catch (e) {}
    };

    let duration = null;

    const onLoadedMetadata = () => {
      duration = video.duration;
      // Seek to 1 second or 5% of duration to avoid initial black frames
      const targetTime = Math.min(1.0, video.duration * 0.05 || 1.0);
      video.currentTime = targetTime;
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          cleanup();
          resolve({ thumbnailUrl: dataUrl, duration });
        } else {
          cleanup();
          resolve({ thumbnailUrl: null, duration });
        }
      } catch (err) {
        console.error('Error drawing frame to canvas:', err);
        cleanup();
        resolve({ thumbnailUrl: null, duration });
      }
    };

    const onError = (e) => {
      console.error('Error loading video for thumbnail extraction:', video.error);
      cleanup();
      resolve({ thumbnailUrl: null, duration: null });
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    
    video.load();
  });
};

const LocalVideoUploader = ({
  playlistId,
  targetMode = 'existing',
  newPlaylistName = '',
  newPlaylistDescription = '',
  prismPage = 1,
  onUploadComplete,
  onCancel
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  const handleFileSelect = async () => {
    try {
      // Use Tauri command to select video files
      const result = await invoke('select_video_files');
      
      if (result && Array.isArray(result) && result.length > 0) {
        setSelectedFiles(result);
        setError(null);
      } else if (result === null) {
        // User cancelled
        return;
      } else {
        setError('No files selected');
      }
    } catch (err) {
      console.error('Failed to select files:', err);
      setError('Failed to select files. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one video file');
      return;
    }

    let targetPlaylistId = playlistId;

    try {
      setLoading(true);
      setError(null);

      // Create new playlist if targetMode is 'new'
      if (targetMode === 'new') {
        if (!newPlaylistName.trim()) {
          setError('Playlist Name is required');
          setLoading(false);
          return;
        }
        setProgress({ current: 0, total: selectedFiles.length, message: 'Creating new playlist...' });
        const newId = await createPlaylist(newPlaylistName, newPlaylistDescription);
        targetPlaylistId = newId;

        // Assign to inbox page if prismPage > 1
        if (prismPage > 1 && targetPlaylistId) {
          try {
            const { groups, addGroup, addPlaylistToGroup } = usePlaylistGroupStore.getState();
            const inboxName = `Page ${prismPage} Inbox`;
            let inboxGroup = groups.find(g => g.name === inboxName && (g.page || 1) === prismPage);
            
            let groupId;
            if (inboxGroup) {
              groupId = inboxGroup.id;
            } else {
              groupId = addGroup(inboxName, null, prismPage);
            }
            
            addPlaylistToGroup(groupId, targetPlaylistId);
          } catch (groupError) {
            console.error('Failed to assign new playlist to page group:', groupError);
            // Don't crash upload if assignment fails
          }
        }
      }

      if (!targetPlaylistId) {
        setError('No playlist selected');
        setLoading(false);
        return;
      }

      setProgress({ current: 0, total: selectedFiles.length, message: 'Adding videos...' });

      let successCount = 0;
      for (let i = 0; i < selectedFiles.length; i++) {
        const filePath = selectedFiles[i];
        
        try {
          // Extract filename from path
          const pathParts = filePath.split(/[/\\]/);
          const fileName = pathParts[pathParts.length - 1];
          
          // Create a unique video ID from file path
          const videoId = `local_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
          // Use file path directly (Tauri will handle file:// conversion)
          const videoUrl = filePath;

          // Extract thumbnail and duration in the background
          setProgress({ 
            current: i, 
            total: selectedFiles.length, 
            message: `Extracting thumbnail for ${fileName}...` 
          });

          let thumbnailUrl = null;
          let durationSeconds = null;
          try {
            const streamUrl = await invoke('get_video_stream_url', { filePath });
            if (streamUrl) {
              const meta = await extractVideoMetadata(streamUrl);
              thumbnailUrl = meta.thumbnailUrl;
              durationSeconds = meta.duration ? Math.round(meta.duration) : null;
            }
          } catch (thumbErr) {
            console.error('Failed to extract metadata for:', fileName, thumbErr);
          }
          
          // Add to playlist with is_local flag, thumbnail, and duration
          await addVideoToPlaylist(
            targetPlaylistId,
            videoUrl,
            videoId,
            fileName, // Use filename as title
            thumbnailUrl, // Extracted base64 thumbnail URL
            'Local File', // author
            '0', // viewCount
            new Date().toISOString(), // publishedAt
            true, // isLocal = true
            null, // profileImageUrl
            durationSeconds // durationSeconds
          );
          
          successCount++;
          setProgress({ 
            current: i + 1, 
            total: selectedFiles.length, 
            message: `Added ${successCount}/${selectedFiles.length} videos...` 
          });
        } catch (fileError) {
          console.error(`Failed to add file ${filePath}:`, fileError);
        }
      }

      setProgress({ 
        current: selectedFiles.length, 
        total: selectedFiles.length, 
        message: `Successfully added ${successCount} video(s)!` 
      });

      // Callback after short delay to show success message
      setTimeout(() => {
        if (onUploadComplete) {
          onUploadComplete();
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to upload local videos:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to upload videos';
      setError(errorMessage);
      setProgress({ current: 0, total: 0, message: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Add Local Videos</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Select Video Files
          </label>
          <button
            type="button"
            onClick={handleFileSelect}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Select Video Files
          </button>
          {selectedFiles.length > 0 && (
            <div className="mt-2 p-3 bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-300 mb-2">
                {selectedFiles.length} file(s) selected:
              </p>
              <ul className="text-xs text-slate-400 space-y-1 max-h-32 overflow-y-auto">
                {selectedFiles.map((filePath, index) => {
                  const pathParts = filePath.split(/[/\\]/);
                  const fileName = pathParts[pathParts.length - 1];
                  return <li key={index}>{fileName}</li>;
                })}
              </ul>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Supported formats: MP4, MKV, AVI, MOV, WebM, FLV, WMV, M4V, MPG, MPEG
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Progress */}
        {loading && progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>{progress.message}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || selectedFiles.length === 0}
          className="w-full px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding Videos...' : `Add ${selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Video(s) to Playlist`}
        </button>
      </div>
    </div>
  );
};

export default LocalVideoUploader;
