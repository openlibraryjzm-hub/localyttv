import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '../api/platformBridge';
import { createPlaylist, addVideoToPlaylist, assignVideoToFolder, getAllPlaylists, getPlaylistItems, getVideosInFolder, addPlaylistSource, getVideoFolderAssignments, getAllFolderAssignments, removeVideoFromPlaylist } from '../api/playlistApi';
import { extractPlaylistId, extractVideoId, parseYouTubeDuration, extractChannelInfo, fetchChannelMetadata } from '../utils/youtubeUtils';
import { FOLDER_COLORS } from '../utils/folderColors';
import PlaylistFolderSelector from './PlaylistFolderSelector';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import LocalVideoUploader from './LocalVideoUploader';
import SubscriptionManagerModal from './SubscriptionManagerModal';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useConfigStore } from '../store/configStore';
import { Video, Image, ListVideo, User, MessageSquare, Radio, Layout } from 'lucide-react';

import { extractVideoMetadata, extractImageMetadata } from '../utils/localFileUtils';

const LinkBubbleInput = ({ value, onChange, placeholder, disabled, colorHex, minHeight = "8rem" }) => {
  const links = value ? value.split('\n').filter(Boolean) : [];
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputId = `bubble-input-${colorHex || 'all'}`;

  const getBubbleType = (link) => {
    if (link.includes('youtube.com/playlist') || (link.includes('youtube.com/watch') && link.includes('list='))) {
      return { label: 'Playlist', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    } else if (link.includes('youtu.be') || link.includes('youtube.com/watch')) {
      return { label: 'Video', color: 'bg-red-100 text-red-700 border-red-200' };
    } else if (link.includes('youtube.com/channel/') || link.includes('youtube.com/@') || link.startsWith('@')) {
      return { label: 'Channel', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    } else if (link.startsWith('local:playlist:')) {
      return { label: 'Local List', color: 'bg-sky-100 text-sky-700 border-sky-200' };
    } else if (link.startsWith('local:folder:')) {
      return { label: 'Local Folder', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    } else if (link.startsWith('local:device_folder:')) {
      return { label: 'Device Folder', color: 'bg-teal-100 text-teal-700 border-teal-200' };
    } else if (
      link.startsWith('local_') ||
      /^[a-zA-Z]:[\\/]/.test(link) || // Windows path like C:\
      link.startsWith('/') || // absolute unix path
      link.startsWith('\\\\') || // UNC path
      /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v|mpg|mpeg)$/i.test(link)
    ) {
      return { label: 'Local Video', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    return { label: 'Link', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addLinks(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '') {
      e.preventDefault();
      removeLink(links.length - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    addLinks(paste);
  };

  const addLinks = (text) => {
    const newParts = text.split(/[\s,;|]+/).filter(Boolean);
    if (newParts.length > 0) {
      const updated = [...links];
      newParts.forEach(part => {
        if (!updated.includes(part)) updated.push(part);
      });
      onChange(updated.join('\n'));
    }
  };

  const removeLink = (index) => {
    if (index < 0 || index >= links.length) return;
    const updated = [...links];
    updated.splice(index, 1);
    onChange(updated.join('\n'));
  };

  const focusStyle = isFocused ? 'border-sky-500 ring-1 ring-sky-500' : 'border-slate-200';
  const customBorderStyle = colorHex ? { borderLeft: `3px solid ${colorHex}` } : {};

  return (
    <div
      className={`w-full overflow-y-auto bg-slate-50 border rounded-lg p-2 flex flex-wrap gap-2 items-start transition-colors cursor-text ${focusStyle}`}
      style={{ minHeight, maxHeight: "16rem", ...customBorderStyle }}
      onClick={() => document.getElementById(inputId)?.focus()}
    >
      {links.map((link, i) => {
        const typeInfo = getBubbleType(link);
        return (
          <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${typeInfo.color} break-all max-w-full animate-in zoom-in-95 duration-100`} title={link}>
            <span className="opacity-75">{typeInfo.label}:</span>
            <span className="truncate max-w-[200px]">{link.replace(/^local:(playlist|folder|device_folder):/, '')}</span>
            <button
              onClick={(e) => { e.stopPropagation(); removeLink(i); }}
              className="ml-1 opacity-50 hover:opacity-100 hover:bg-black/10 rounded-full p-0.5 transition-all"
              disabled={disabled}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        );
      })}
      <input
        id={inputId}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (inputValue.trim()) {
            addLinks(inputValue);
            setInputValue('');
          }
        }}
        disabled={disabled}
        placeholder={links.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-slate-700 py-1"
      />
    </div>
  );
};

const PlaylistUploader = ({ onUploadComplete, onCancel, initialPlaylistId, prismPage = 1 }) => {
  // Store access for page-aware uploading
  const { groups, getGroupIdsForPlaylist, addGroup, addPlaylistToGroup, getNextAvailableColorId } = usePlaylistGroupStore();
  
  // Zustand Stores for Card Source Toggling
  const { visibleSourceTypes, setVisibleSourceTypes, toggleSourceTypeVisibility } = useLayoutStore();
  const activePlaylistItems = usePlaylistStore(s => s.previewPlaylistItems || s.currentPlaylistItems) || [];
  const activePlaylistId = usePlaylistStore(s => s.previewPlaylistId || s.currentPlaylistId);
  const orbFavorites = useConfigStore(s => s.orbFavorites) || [];
  const bannerPresets = useConfigStore(s => s.bannerPresets) || [];

  // Main Tab State
  const [activeTab, setActiveTab] = useState(initialPlaylistId ? 'export' : 'add'); // 'add', 'export', 'json', 'subscriptions', 'source'

  const getEffectivePlaylistId = () => {
    if (initialPlaylistId) return initialPlaylistId;
    if (selectedPlaylistId) return selectedPlaylistId;
    if (availablePlaylists.length > 0) {
      const unsorted = availablePlaylists.find(p => p.name === 'Unsorted');
      return unsorted ? unsorted.id : availablePlaylists[0].id;
    }
    return null;
  };

  // General State
  const [availablePlaylists, setAvailablePlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  // === NEW: SUBSCRIPTION STATE ===
  const [subscribeToChannels, setSubscribeToChannels] = useState(false);
  const [maxVideosPerSource, setMaxVideosPerSource] = useState(50); // 10, 20, 50

  // === ADD TAB STATE ===
  const [targetMode, setTargetMode] = useState('existing'); // 'existing' or 'new'
  // If initialPlaylistId is provided, use it. Otherwise empty string (for Unsorted/Default).
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(initialPlaylistId ? String(initialPlaylistId) : '');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  const [playlistLinks, setPlaylistLinks] = useState({
    all: '', // No folder assignment
    ...FOLDER_COLORS.reduce((acc, color) => {
      acc[color.id] = '';
      return acc;
    }, {}),
  });
  const [activeSegment, setActiveSegment] = useState('all');

  // Compute counts of each source type for the current playlist context
  const getSourceCounts = () => {
    const playlistId = initialPlaylistId || (selectedPlaylistId ? parseInt(selectedPlaylistId) : activePlaylistId);
    if (!playlistId) return { orb: 0, banner: 0, video: 0, image: 0, tracker: 0, channel: 0, tweet: 0 };

    const assignedOrbsCount = orbFavorites.filter(orb => orb.playlistIds?.includes(playlistId)).length;
    const assignedBannersCount = bannerPresets.filter(preset => preset.playlistIds && preset.playlistIds.map(String).includes(String(playlistId))).length;

    let videoCount = 0;
    let imageCount = 0;
    let trackerCount = 0;
    let channelCount = 0;
    let tweetCount = 0;

    activePlaylistItems.forEach(video => {
      const isTweet = !video.is_local && (video.video_url?.includes('twitter.com') || video.video_url?.includes('x.com') || video.thumbnail_url?.includes('twimg.com'));
      if (isTweet) {
        tweetCount++;
        return;
      }

      const isChannel = video.video_url?.includes('youtube.com/channel/') ||
        video.video_url?.includes('youtube.com/@') ||
        video.video_url?.startsWith('@') ||
        video.isChannel;
      if (isChannel) {
        channelCount++;
        return;
      }

      const isPlaylistTracker = video.isPlaylist || video.video_url?.includes('youtube.com/playlist?list=');
      if (isPlaylistTracker) {
        trackerCount++;
        return;
      }

      const isImage = video.video_url && /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(video.video_url);
      if (isImage) {
        imageCount++;
        return;
      }

      videoCount++;
    });

    return {
      orb: assignedOrbsCount,
      banner: assignedBannersCount,
      video: videoCount,
      image: imageCount,
      tracker: trackerCount,
      channel: channelCount,
      tweet: tweetCount
    };
  };

  const counts = getSourceCounts();

  const handleSelectLocalVideosForAdd = async () => {
    try {
      const result = await invoke('select_video_files');
      if (result && Array.isArray(result) && result.length > 0) {
        // Append selected file paths to the active segment's link list
        const currentLinks = playlistLinks[activeSegment] ? playlistLinks[activeSegment].split('\n').filter(Boolean) : [];
        const updated = [...currentLinks];
        result.forEach(filePath => {
          if (!updated.includes(filePath)) {
            updated.push(filePath);
          }
        });
        handleLinkChange(activeSegment, updated.join('\n'));
      }
    } catch (err) {
      console.error('Failed to select local files:', err);
    }
  };

  const handleSelectLocalFolderForAdd = async () => {
    try {
      const result = await invoke('select_video_folder');
      if (result) {
        // Append selected folder path with prefix to the active segment's link list
        const currentLinks = playlistLinks[activeSegment] ? playlistLinks[activeSegment].split('\n').filter(Boolean) : [];
        const updated = [...currentLinks];
        const folderToken = `local:device_folder:${result}`;
        if (!updated.includes(folderToken)) {
          updated.push(folderToken);
        }
        handleLinkChange(activeSegment, updated.join('\n'));
      }
    } catch (err) {
      console.error('Failed to select local folder:', err);
    }
  };

  // Selector Modal State (for adding existing playlists/folders to inputs)
  const [showSelector, setShowSelector] = useState(false);
  const [selectorField, setSelectorField] = useState(null);

  // === JSON TAB STATE ===
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef(null);
  
  // === EXPORT TAB STATE ===
  const [exportPlaylistId, setExportPlaylistId] = useState(initialPlaylistId ? String(initialPlaylistId) : '');
  const [exportOptions, setExportOptions] = useState({
    videos: true,
    folders: true,
    idCards: true,
    channelCards: true,
  });

  useEffect(() => {
    loadPlaylists();
  }, []);

  const [targetFolderCounts, setTargetFolderCounts] = useState({});

  useEffect(() => {
    let effectivePlaylistId = selectedPlaylistId;
    if (targetMode === 'new') {
      setTargetFolderCounts({});
      return;
    }

    if (!effectivePlaylistId && availablePlaylists.length > 0) {
      const unsorted = availablePlaylists.find(p => p.name === 'Unsorted');
      if (unsorted) {
        effectivePlaylistId = String(unsorted.id);
      }
    }

    if (effectivePlaylistId) {
      getAllFolderAssignments(parseInt(effectivePlaylistId))
        .then(assignments => {
          const counts = {};
          if (assignments) {
            Object.values(assignments).forEach(folders => {
              if (Array.isArray(folders)) {
                folders.forEach(folderId => {
                  counts[folderId] = (counts[folderId] || 0) + 1;
                });
              }
            });
          }
          setTargetFolderCounts(counts);
        })
        .catch(err => {
          console.error('Failed to load folder assignments for uploader target:', err);
          setTargetFolderCounts({});
        });
    } else {
      setTargetFolderCounts({});
    }
  }, [selectedPlaylistId, availablePlaylists, targetMode]);

  const loadPlaylists = async () => {
    try {
      const allPlaylistsFromDb = await getAllPlaylists();
      const filtered = allPlaylistsFromDb.filter(p => {
        const groupIds = getGroupIdsForPlaylist(p.id);
        if (prismPage === 1) {
          // Page 1: Playlists in P1 groups + Unsorted
          if (groupIds.length === 0) return true;
          return groupIds.some(gid => {
            const group = groups.find(g => g.id === gid);
            return group && (group.page || 1) === 1;
          });
        } else {
          // Page 2+: Only playlists assigned to carousels on this page (including Inbox)
          return groupIds.some(gid => {
            const group = groups.find(g => g.id === gid);
            return group && (group.page || 1) === prismPage;
          });
        }
      });
      setAvailablePlaylists(filtered);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    }
  };

  // ==========================================
  // LOGIC: LINK PARSING & IMPORTING (From BulkImporter)
  // ==========================================

  const parseLinks = (text) => {
    if (!text || !text.trim()) return [];
    return text
      .split(/\n/)
      .flatMap(line => {
        const trimmed = line.trim();
        // If it looks like a local path, keep the entire line intact (preserves spaces in path)
        const isLocalPath = (
          trimmed.startsWith('local_') ||
          trimmed.startsWith('local:device_folder:') ||
          /^[a-zA-Z]:[\\/]/.test(trimmed) || // C:\...
          trimmed.startsWith('/') ||
          trimmed.startsWith('\\\\') ||
          /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v|mpg|mpeg|png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(trimmed)
        );
        if (isLocalPath) {
          return [trimmed];
        }

        if (line.includes(',')) return line.split(',').map(part => part.trim());
        if (line.includes(';')) return line.split(';').map(part => part.trim());
        if (line.includes('|')) return line.split('|').map(part => part.trim());
        return line.split(/\s+/).map(part => part.trim());
      })
      .filter(link => {
        if (!link) return false;
        const isYouTube = (
          link.includes('youtube.com/playlist') ||
          link.includes('youtu.be') ||
          (link.includes('youtube.com/watch') && link.includes('list=')) ||
          link.includes('youtube.com/watch') || // Single video support
          link.includes('youtube.com/channel/') ||
          link.includes('youtube.com/@')
        );
        const isLocal = link.startsWith('local:playlist:') || link.startsWith('local:folder:') || link.startsWith('local:device_folder:');
        const isLocalVideo = (
          link.startsWith('local_') ||
          /^[a-zA-Z]:[\\/]/.test(link) ||
          link.startsWith('/') ||
          link.startsWith('\\\\') ||
          /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v|mpg|mpeg|png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(link)
        );
        return isYouTube || isLocal || isLocalVideo;
      })
      .filter((link, index, self) => self.indexOf(link) === index);
  };

  const fetchPlaylistVideos = async (playlistUrl) => {
    const API_KEY = useConfigStore.getState().youtubeApiKey;
    if (!API_KEY) {
      throw new Error('Importing YouTube playlists and channels requires a personal YouTube API Key. Click the Info (ⓘ) button in the top menu to enter your free YouTube API Key to unlock playlist/channel importing.');
    }

    // Check if it's a single video
    const singleVideoId = extractVideoId(playlistUrl);
    // If it has 'list=', it might be a playlist, but extractVideoId favors video ID.
    // Let's check specifically for playlist ID first.
    const playlistId = extractPlaylistId(playlistUrl);

    // Note: extractVideoId will return ID even if it is part of a playlist URL like watch?v=...&list=...
    // We prioritize playlist import if it IS a playlist URL (contains list=), UNLESS it is just a watch URL without list.
    // Actually, user might paste a single video.

    // Logic: 
    // If it is a channel link, return channel card.
    // If it has "list=PL...", treat as playlist.
    // Else if it has "v=..." or "youtu.be/...", treat as single video.

    const channelInfo = extractChannelInfo(playlistUrl);
    if (channelInfo) {
      const metadata = await fetchChannelMetadata(playlistUrl);
      if (!metadata) throw new Error('Could not fetch channel metadata');
      return metadata;
    }

    if (playlistId) {
      // --- PLAYLIST IMPORT ---
      // If subscription mode and it looks like a channel ID (UC...), define uploads playlist (UU...)
      let targetListId = playlistId;
      if (playlistId.startsWith('UC')) {
        targetListId = 'UU' + playlistId.substring(2);
      }

      const playlistDetailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${targetListId}&key=${API_KEY}`;
      const playlistResponse = await fetch(playlistDetailsUrl);

      if (!playlistResponse.ok) throw new Error('Failed to fetch playlist details');
      const playlistData = await playlistResponse.json();
      if (!playlistData.items?.length) throw new Error('Playlist not found or private');

      const sourcePlaylistName = playlistData.items[0].snippet.title;
      let nextPageToken = null;
      let allVideos = [];

      // Loop for pages ONLY if NOT subscribing or if we want more than 50
      // If subscribing, we usually want just the latest X. But let's respect maxVideosPerSource regardless.
      // API maxResults is 50.

      let fetchCount = 0;
      const effectiveLimit = subscribeToChannels ? maxVideosPerSource : 1000; // Default limit for massive playlists?

      do {
        const remaining = effectiveLimit - allVideos.length;
        if (remaining <= 0) break;
        const fetchSize = Math.min(50, remaining);

        const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${targetListId}&maxResults=${fetchSize}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const res = await fetch(videosUrl);
        if (!res.ok) throw new Error('Failed to fetch videos');
        const data = await res.json();
        if (data.items) allVideos = allVideos.concat(data.items);
        nextPageToken = data.nextPageToken;
      } while (nextPageToken && allVideos.length < effectiveLimit);

      if (allVideos.length === 0) throw new Error('No videos in playlist');

      // 3. Fetch view counts (and ensure other details) for all videos
      // The playlistItems endpoint doesn't give view counts, we need the 'videos' endpoint.
      // We can fetch in batches of 50.
      const videoIds = allVideos.map(item => item.snippet.resourceId.videoId);
      const videoDetails = {};
      const channelIds = new Set();

      for (let i = 0; i < videoIds.length; i += 50) {
        const batch = videoIds.slice(i, i + 50);
        const batchUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch.join(',')}&key=${API_KEY}`;
        try {
          const batchRes = await fetch(batchUrl);
          if (batchRes.ok) {
            const batchData = await batchRes.json();
            if (batchData.items) {
              batchData.items.forEach(v => {
                const durationIso = v.contentDetails?.duration;
                const durationSeconds = durationIso ? parseYouTubeDuration(durationIso) : null;
                const tagsArr = v.snippet?.tags;
                const tagsStr = Array.isArray(tagsArr) && tagsArr.length > 0 ? JSON.stringify(tagsArr) : null;
                if (v.snippet.channelId) channelIds.add(v.snippet.channelId);
                videoDetails[v.id] = {
                  videoUrl: `https://www.youtube.com/watch?v=${v.id}`,
                  title: v.snippet.title,
                  thumbnailUrl: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
                  author: v.snippet.channelTitle,
                  channelId: v.snippet.channelId,
                  viewCount: v.statistics?.viewCount,
                  publishedAt: v.snippet.publishedAt,
                  durationSeconds: durationSeconds ?? undefined,
                  description: v.snippet.description || undefined,
                  tags: tagsStr ?? undefined
                };
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch batch details', err);
        }
      }

      // Fetch channel avatars
      const channelAvatars = {};
      const uniqueChannelIds = Array.from(channelIds);
      for (let i = 0; i < uniqueChannelIds.length; i += 50) {
        const batch = uniqueChannelIds.slice(i, i + 50);
        const batchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${batch.join(',')}&key=${API_KEY}`;
        try {
          const batchRes = await fetch(batchUrl);
          if (batchRes.ok) {
            const batchData = await batchRes.json();
            if (batchData.items) {
              batchData.items.forEach(c => {
                channelAvatars[c.id] = c.snippet.thumbnails?.high?.url || c.snippet.thumbnails?.medium?.url || c.snippet.thumbnails?.default?.url;
              });
            }
          }
        } catch (err) {}
      }

      const playlistRef = {
        videoId: targetListId,
        videoUrl: `https://www.youtube.com/playlist?list=${targetListId}`,
        title: sourcePlaylistName,
        thumbnailUrl: allVideos[0]?.snippet?.thumbnails?.medium?.url || allVideos[0]?.snippet?.thumbnails?.default?.url || null,
        author: 'Playlist Tracker',
        viewCount: '0',
        publishedAt: new Date().toISOString(),
        durationSeconds: null,
        description: 'Playlist Link Tracker',
        tags: null,
        isPlaylist: true
      };

      const extractedVideos = allVideos
        .filter(item => item.snippet?.resourceId?.kind === 'youtube#video')
        .map(item => {
          const vid = item.snippet.resourceId.videoId;
          const details = videoDetails[vid] || {};
          return {
            videoId: vid,
            videoUrl: details.videoUrl || `https://www.youtube.com/watch?v=${vid}`,
            title: details.title || item.snippet.title,
            thumbnailUrl: details.thumbnailUrl || item.snippet.thumbnails?.medium?.url,
            author: details.author || item.snippet.videoOwnerChannelTitle || 'Unknown',
            viewCount: details.viewCount || '0',
            publishedAt: details.publishedAt || item.snippet.publishedAt,
            profileImageUrl: details.channelId ? channelAvatars[details.channelId] : null,
            durationSeconds: details.durationSeconds,
            description: details.description,
            tags: details.tags
          };
        });

      return {
        sourcePlaylistName,
        videos: [playlistRef, ...extractedVideos]
      };
    } else if (singleVideoId) {
      // --- SINGLE VIDEO IMPORT ---
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${singleVideoId}&key=${API_KEY}`;
      const res = await fetch(videoUrl);
      const data = await res.json();
      let title = 'Unknown Video';
      let thumbnailUrl = null;
      let author = 'Unknown';
      let viewCount = '0';
      let publishedAt = null;
      let durationSeconds = null;
      let description = null;
      let tags = null;
      let profileImageUrl = null;

      if (data.items && data.items.length > 0) {
        const snippet = data.items[0].snippet;
        const statistics = data.items[0].statistics;
        const contentDetails = data.items[0].contentDetails;
        title = snippet.title;
        thumbnailUrl = snippet.thumbnails?.medium?.url;
        author = snippet.channelTitle;
        viewCount = statistics?.viewCount || '0';
        publishedAt = snippet.publishedAt;
        if (contentDetails?.duration) {
          durationSeconds = parseYouTubeDuration(contentDetails.duration);
        }
        description = snippet.description || null;
        if (Array.isArray(snippet.tags) && snippet.tags.length > 0) {
          tags = JSON.stringify(snippet.tags);
        }
        
        if (snippet.channelId) {
          try {
            const cUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${snippet.channelId}&key=${API_KEY}`;
            const cRes = await fetch(cUrl);
            const cData = await cRes.json();
            if (cData.items && cData.items.length > 0) {
              profileImageUrl = cData.items[0].snippet.thumbnails?.high?.url || cData.items[0].snippet.thumbnails?.medium?.url || cData.items[0].snippet.thumbnails?.default?.url;
            }
          } catch (e) {}
        }
      }

      return {
        sourcePlaylistName: 'Single Video',
        videos: [{
          videoId: singleVideoId,
          videoUrl: `https://www.youtube.com/watch?v=${singleVideoId}`,
          title,
          thumbnailUrl,
          author,
          viewCount,
          publishedAt,
          profileImageUrl,
          durationSeconds,
          description,
          tags
        }]
      };
      // Should be handled by channelInfo block now.
      return null;
    } else {
      throw new Error(`Invalid URL: ${playlistUrl}`);
    }
  };

  const fetchLocalPlaylistVideos = async (id) => {
    const items = await getPlaylistItems(parseInt(id));
    return {
      sourcePlaylistName: `Local Playlist ${id}`,
      videos: items.map(i => ({
        videoId: i.video_id,
        videoUrl: i.video_url,
        title: i.title,
        thumbnailUrl: i.thumbnail_url,
        author: i.author || 'Unknown',
        viewCount: i.view_count || '0',
        publishedAt: i.published_at || null,
        durationSeconds: i.duration_seconds ?? undefined,
        description: i.description ?? undefined,
        tags: i.tags ?? undefined
      }))
    };
  };

  const fetchLocalFolderVideos = async (id, color) => {
    const items = await getVideosInFolder(parseInt(id), color);
    return {
      sourcePlaylistName: `Local ${color} Folder`,
      videos: items.map(i => ({
        videoId: i.video_id,
        videoUrl: i.video_url,
        title: i.title,
        thumbnailUrl: i.thumbnail_url,
        author: i.author || 'Unknown',
        viewCount: i.view_count || '0',
        publishedAt: i.published_at || null,
        durationSeconds: i.duration_seconds ?? undefined,
        description: i.description ?? undefined,
        tags: i.tags ?? undefined
      }))
    };
  };

  // ==========================================
  // HANDLERS: ADD TAB
  // ==========================================

  const handleLinkChange = (field, value) => {
    setPlaylistLinks(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSelectorClick = (field) => {
    setSelectorField(field);
    setShowSelector(true);
  };

  const handleSelectorSelect = (selectedItems) => {
    if (selectorField && selectedItems.length > 0) {
      const current = playlistLinks[selectorField] || '';
      const addition = selectedItems.join('\n');
      handleLinkChange(selectorField, current ? `${current}\n${addition}` : addition);
    }
    setShowSelector(false);
    setSelectorField(null);
  };

  const handleAddSubmit = async () => {
    // 1. Determine Target Playlist
    let dbPlaylistId;
    let targetName = '';

    try {
      setLoading(true);
      setError(null);

      if (targetMode === 'new') {
        if (!newPlaylistName.trim()) throw new Error('Playlist Name is required');
        targetName = newPlaylistName;
        setProgress({ current: 0, total: 1, message: 'Creating new playlist...' });
        dbPlaylistId = await createPlaylist(newPlaylistName, newPlaylistDescription);

        // --- NEW: Explorer Page Awareness ---
        // If we're on Page 2+, and we created a NEW playlist, assign it to a default "New Uploads" group
        // for this page (no color) so it stays on this page but isn't in a colored carousel.
        if (prismPage > 1 && dbPlaylistId) {
          const inboxName = `Page ${prismPage} Inbox`;
          let inboxGroup = groups.find(g => g.name === inboxName && (g.page || 1) === prismPage);
          
          let groupId;
          if (inboxGroup) {
            groupId = inboxGroup.id;
          } else {
            groupId = addGroup(inboxName, null, prismPage);
          }
          
          addPlaylistToGroup(groupId, dbPlaylistId);
        }
      } else {
        // Existing or Unsorted
        if (selectedPlaylistId === '') {
          // Check if Unsorted exists
          const unsorted = availablePlaylists.find(p => p.name === 'Unsorted');
          if (unsorted) {
            dbPlaylistId = unsorted.id;
            targetName = 'Unsorted';
          } else {
            targetName = 'Unsorted';
            dbPlaylistId = await createPlaylist('Unsorted', 'Automatically created');
          }
        } else {
          dbPlaylistId = parseInt(selectedPlaylistId);
          const pl = availablePlaylists.find(p => p.id === dbPlaylistId);
          targetName = pl ? pl.name : 'Unknown';
        }
      }

      // 2. Gather all links
      const tasks = []; // { url, folderColor }

      // All/NoFolder
      const allLinks = parseLinks(playlistLinks.all);
      allLinks.forEach(url => tasks.push({ url, folderColor: null }));

      // Folders
      FOLDER_COLORS.forEach(color => {
        const links = parseLinks(playlistLinks[color.id]);
        links.forEach(url => tasks.push({ url, folderColor: color.id }));
      });

      if (tasks.length === 0) {
        if (targetMode === 'new') {
          setProgress({ current: 1, total: 1, message: `Complete! Created empty playlist "${targetName}".` });
          setTimeout(() => {
            if (onUploadComplete) onUploadComplete(dbPlaylistId);
          }, 1500);
          return;
        }
        throw new Error('No valid links found to import.');
      }

      // 3. Process Imports
      setProgress({ current: 0, total: tasks.length, message: 'Fetching videos...' });

      // Flatten into list of videos with folder assignments
      let allVideosToInsert = [];
      const taskErrors = [];

      for (let i = 0; i < tasks.length; i++) {
        const { url, folderColor } = tasks[i];
        setProgress({ current: i + 1, total: tasks.length, message: `Fetching from link ${i + 1}/${tasks.length}` });

        try {
          let result;
          const isLocalImage = (
            url.startsWith('local_') ||
            /^[a-zA-Z]:[\\/]/.test(url) ||
            url.startsWith('/') ||
            url.startsWith('\\\\')
          ) && /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(url);

          const isLocalVideo = !isLocalImage && (
            url.startsWith('local_') ||
            /^[a-zA-Z]:[\\/]/.test(url) ||
            url.startsWith('/') ||
            url.startsWith('\\\\') ||
            /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v|mpg|mpeg)$/i.test(url)
          );

          if (isLocalImage) {
            // Extract filename from path
            const pathParts = url.split(/[/\\]/);
            const fileName = pathParts[pathParts.length - 1];
            
            // Create unique video ID from file path
            const videoId = `local_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;

            // Extract metadata (thumbnail)
            setProgress({ 
              current: i + 1, 
              total: tasks.length, 
              message: `Extracting thumbnail for local image: ${fileName}...` 
            });

            let thumbnailUrl = null;
            try {
              const streamUrl = await invoke('get_video_stream_url', { filePath: url });
              if (streamUrl) {
                const streamUrlWithCacheBust = `${streamUrl}?t=${Date.now()}`;
                const meta = await extractImageMetadata(streamUrlWithCacheBust);
                thumbnailUrl = meta.thumbnailUrl;
              }
            } catch (thumbErr) {
              console.error('Failed to extract metadata for local image task:', fileName, thumbErr);
            }

            result = {
              videos: [{
                videoUrl: url,
                videoId: videoId,
                title: fileName,
                thumbnailUrl: thumbnailUrl,
                author: 'Local Image',
                viewCount: '0',
                publishedAt: new Date().toISOString(),
                isLocal: true,
                profileImageUrl: null,
                durationSeconds: null,
                description: null,
                tags: null
              }]
            };
          } else if (isLocalVideo) {
            // Extract filename from path
            const pathParts = url.split(/[/\\]/);
            const fileName = pathParts[pathParts.length - 1];
            
            // Create unique video ID from file path
            const videoId = `local_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;

            // Extract metadata (thumbnail and duration)
            setProgress({ 
              current: i + 1, 
              total: tasks.length, 
              message: `Extracting thumbnail for local video: ${fileName}...` 
            });

            let thumbnailUrl = null;
            let durationSeconds = null;
            try {
              const streamUrl = await invoke('get_video_stream_url', { filePath: url });
              if (streamUrl) {
                const streamUrlWithCacheBust = `${streamUrl}?t=${Date.now()}`;
                const meta = await extractVideoMetadata(streamUrlWithCacheBust);
                thumbnailUrl = meta.thumbnailUrl;
                durationSeconds = meta.duration ? Math.round(meta.duration) : null;
              }
            } catch (thumbErr) {
              console.error('Failed to extract metadata for local task:', fileName, thumbErr);
            }

            result = {
              videos: [{
                videoUrl: url,
                videoId: videoId,
                title: fileName,
                thumbnailUrl: thumbnailUrl,
                author: 'Local File',
                viewCount: '0',
                publishedAt: new Date().toISOString(),
                isLocal: true,
                profileImageUrl: null,
                durationSeconds: durationSeconds,
                description: null,
                tags: null
              }]
            };
          } else if (url.startsWith('local:device_folder:')) {
            const dirPath = url.replace('local:device_folder:', '');
            const videoPaths = await invoke('get_videos_in_directory', { dirPath });
            const folderVideos = [];
            
            // Get folder name from path
            const pathParts = dirPath.split(/[/\\]/);
            const folderName = pathParts[pathParts.length - 1] || dirPath;
            
            // Create Folder Tracker Card
            const folderRef = {
              videoUrl: `local:device_folder:${dirPath}`,
              videoId: `folder_${dirPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
              title: folderName,
              thumbnailUrl: null,
              author: 'Folder Tracker',
              viewCount: '0',
              publishedAt: new Date().toISOString(),
              durationSeconds: null,
              description: 'Folder Path Tracker',
              tags: null,
              isFolderTracker: true,
              isLocal: true
            };
            
            folderVideos.push(folderRef);

            if (videoPaths && videoPaths.length > 0) {
              for (let j = 0; j < videoPaths.length; j++) {
                const videoPath = videoPaths[j];
                const pathParts = videoPath.split(/[/\\]/);
                const fileName = pathParts[pathParts.length - 1];
                const videoId = `local_${videoPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
                
                const isImg = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(videoPath);

                setProgress({ 
                  current: i + 1, 
                  total: tasks.length, 
                  message: `Extracting thumbnail for folder item (${j + 1}/${videoPaths.length}): ${fileName}...` 
                });

                let thumbnailUrl = null;
                let durationSeconds = null;
                try {
                  const streamUrl = await invoke('get_video_stream_url', { filePath: videoPath });
                  if (streamUrl) {
                    const streamUrlWithCacheBust = `${streamUrl}?t=${Date.now()}`;
                    if (isImg) {
                      const meta = await extractImageMetadata(streamUrlWithCacheBust);
                      thumbnailUrl = meta.thumbnailUrl;
                    } else {
                      const meta = await extractVideoMetadata(streamUrlWithCacheBust);
                      thumbnailUrl = meta.thumbnailUrl;
                      durationSeconds = meta.duration ? Math.round(meta.duration) : null;
                    }
                  }
                } catch (thumbErr) {
                  console.error('Failed to extract metadata for folder item:', fileName, thumbErr);
                }

                folderVideos.push({
                  videoUrl: videoPath,
                  videoId: videoId,
                  title: fileName,
                  thumbnailUrl: thumbnailUrl,
                  author: isImg ? 'Local Image' : 'Local File',
                  viewCount: '0',
                  publishedAt: new Date().toISOString(),
                  isLocal: true,
                  profileImageUrl: null,
                  durationSeconds: durationSeconds,
                  description: null,
                  tags: null
                });
              }

              // Assign the first imported video's thumbnail to the folder tracker card
              const firstVideoWithThumb = folderVideos.find(v => v.thumbnailUrl && !v.isFolderTracker);
              if (firstVideoWithThumb) {
                folderRef.thumbnailUrl = firstVideoWithThumb.thumbnailUrl;
              }
            }
            result = { videos: folderVideos };
          } else if (url.startsWith('local:playlist:')) {
            result = await fetchLocalPlaylistVideos(url.replace('local:playlist:', ''));
          } else if (url.startsWith('local:folder:')) {
            const [pid, col] = url.replace('local:folder:', '').split(':');
            result = await fetchLocalFolderVideos(pid, col);
          } else {
            result = await fetchPlaylistVideos(url);
          }

          // Add to list, tagging with folder
          result.videos.forEach(v => {
            allVideosToInsert.push({ ...v, folderColor });
          });

        } catch (e) {
          console.error(`Failed to fetch ${url}`, e);
          taskErrors.push(e.message || String(e));
        }
      }

      if (allVideosToInsert.length === 0) {
        if (taskErrors.length > 0) {
          const keyErr = taskErrors.find(msg => msg.includes('API Key') || msg.includes('API key'));
          if (keyErr) {
            throw new Error(keyErr);
          }
          throw new Error(taskErrors[0]);
        }
        throw new Error('Could not fetch any videos from provided links.');
      }

      // --- NEW: Add Sources for Subscription ---
      if (subscribeToChannels && dbPlaylistId) {
        setProgress({ current: 0, total: 1, message: 'Saving subscription sources...' });
        // We need to identify the "source intent" from the provided links.
        // Since we flattened everything, we might need to look at the original tasks.

        for (const task of tasks) {
          const url = task.url;
          // Identify source type and value
          let sourceType = null;
          let sourceValue = null;

          const pid = extractPlaylistId(url);
          if (pid) {
            if (pid.startsWith('UU')) {
              // It's an uploads playlist, treat as channel source (convert back to UC?)
              // Or just store as channel source with UC ID?
              // The user pastes a channel link usually.
              // If they pasted a channel link, we want to store the CHANNEL ID.
              // If they pasted a playlist link, we want to store the PLAYLIST ID.

              // Our parser converts channel URL to ... we haven't converted it yet in "tasks", only in "fetch".
              // "parseLinks" returns the raw URL.

              // If raw URL has "channel/", extract ID.
              if (url.includes('channel/')) {
                const m = url.match(/channel\/(UC[\w\-]+)/);
                if (m) { sourceType = 'channel'; sourceValue = m[1]; }
              } else if (url.includes('@')) {
                // We resolved this during fetch, but we don't have the result here easily.
                // For now, let's just store the HANDLE if possible? 
                // No, backend expects ID.
                // We might need to re-resolve or cache the resolution.
                // Let's assume we re-resolve quickly or skip handles for V1 of subscription.
                // Actually, let's look at the fetch result.
                // 'fetchPlaylistVideos' returns 'sourcePlaylistName' but not the ID.

                // Optimization: Just add the resolved ID during the fetch phase to a "sourcesToAdd" list.
              } else {
                // Standard playlist
                const listId = extractPlaylistId(url);
                if (listId) { sourceType = 'playlist'; sourceValue = listId; }
              }
            } else {
              sourceType = 'playlist';
              sourceValue = pid;
            }
          }

          // Handle @handles specifically if we can
          if (!sourceType && url.includes('@')) {
            // We have to resolve it again? That's wasteful. 
            // Let's rely on the fact that we can call extractVideoId which returns null for channels.
          }

          if (sourceType && sourceValue) {
            console.log(`[PlaylistUploader] Adding subscription source: Type=${sourceType}, Value=${sourceValue}, Limit=${maxVideosPerSource}`);
            try {
              await addPlaylistSource(dbPlaylistId, sourceType, sourceValue, maxVideosPerSource);
            } catch (err) {
              console.error('[PlaylistUploader] Failed to add subscription source:', err);
              // Don't block video import, but log it
            }
          } else {
            console.warn(`[PlaylistUploader] Could not determine source type/value for URL: ${url}`);
          }
        }
      }

      // 4. Insert into DB
      setProgress({ current: 0, total: 1, message: 'Checking for duplicates...' });

      const existingItems = await getPlaylistItems(dbPlaylistId);
      const existingVideoIds = new Set(existingItems.map(item => item.video_id));

      const uniqueVideosToInsert = [];
      const seenVideoIds = new Set();

      for (const v of allVideosToInsert) {
        const isLocal = v.isLocal || false;
        if (isLocal) {
          const duplicate = existingItems.find(item => item.video_id === v.videoId);
          if (duplicate) {
            console.log(`Local file duplicate found: ${v.videoId}. Removing old entry to update metadata.`);
            try {
              await removeVideoFromPlaylist(dbPlaylistId, duplicate.id);
            } catch (err) {
              console.error('Failed to remove duplicate local video:', err);
            }
          }
          uniqueVideosToInsert.push(v);
        } else {
          if (!existingVideoIds.has(v.videoId) && !seenVideoIds.has(v.videoId)) {
            uniqueVideosToInsert.push(v);
            seenVideoIds.add(v.videoId);
          }
        }
      }

      const skippedCount = allVideosToInsert.length - uniqueVideosToInsert.length;
      allVideosToInsert = uniqueVideosToInsert;

      if (allVideosToInsert.length === 0) {
        let msg = skippedCount > 0
          ? `Complete! Skipped ${skippedCount} duplicate videos. No new videos added.`
          : `Complete! Created empty playlist "${targetName}".`;

        setProgress({ current: 1, total: 1, message: msg });
        setTimeout(() => {
          if (onUploadComplete) onUploadComplete(dbPlaylistId);
        }, 2000);
        return;
      }

      setProgress({ current: 0, total: allVideosToInsert.length, message: `Adding ${allVideosToInsert.length} videos to "${targetName}"...` });

      let addedCount = 0;
      for (let i = 0; i < allVideosToInsert.length; i++) {
        const v = allVideosToInsert[i];
        try {
          const itemId = await addVideoToPlaylist(dbPlaylistId, v.videoUrl, v.videoId, v.title, v.thumbnailUrl, v.author, v.viewCount, v.publishedAt, v.isLocal || false, v.profileImageUrl || null, v.durationSeconds ?? null, v.description ?? null, v.tags ?? null, null, null);
          addedCount++;

          if (v.folderColor) {
            await assignVideoToFolder(dbPlaylistId, itemId, v.folderColor);
          }

          if (i % 5 === 0) {
            setProgress({ current: i + 1, total: allVideosToInsert.length, message: `Adding videos... ${i + 1}/${allVideosToInsert.length}` });
          }
        } catch (e) {
          console.error('Insert failed', e);
        }
      }

      setProgress({ current: addedCount, total: addedCount, message: `Complete! Added ${addedCount} videos.` });

      setTimeout(() => {
        if (onUploadComplete) onUploadComplete(dbPlaylistId);
      }, 1500);

    } catch (e) {
      console.error('Import failed', e);
      setError(e.message);
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: JSON TAB
  // ==========================================

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { setError('Please select a JSON file'); return; }

    try {
      const text = await file.text();
      setJsonInput(text);
      // Auto-parse to see if it's a backup, maybe switch tab? 
      // For now just fill input.
    } catch (error) {
      setError('Failed to read file: ' + error.message);
    }
  };

  const handleJsonSubmit = async () => {
    // Reuse existing JSON logic, simplified for brevity but functional
    if (!jsonInput.trim()) { setError('Please input JSON'); return; }

    try {
      setLoading(true);
      const data = JSON.parse(jsonInput);

      setProgress({ current: 0, total: 0, message: 'Processing JSON...' });

      // Determine name
      const pName = data.playlist?.name || 'Imported JSON';
      const pDesc = data.playlist?.description || '';

      const dbId = await createPlaylist(pName, pDesc);

      const videos = data.videos || (data.playlist?.videos) || [];
      if (!Array.isArray(videos)) throw new Error('No videos array found');

      setProgress({ current: 0, total: videos.length, message: `Importing ${videos.length} videos...` });

      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        // Support various formats
        const u = v.url || v.video_url || v.videoUrl;
        const vid = v.videoId || v.video_id || extractVideoId(u);
        if (!vid) continue;

        const itemId = await addVideoToPlaylist(
          dbId, 
          u || `https://youtube.com/watch?v=${vid}`, 
          vid, 
          v.title, 
          v.thumbnailUrl || v.thumbnail_url, 
          v.author || v.channelTitle, 
          v.viewCount || v.view_count, 
          v.publishedAt || v.published_at || v.published_date || v.uploadDate || v.upload_date || null, 
          v.isLocal || v.is_local || false, 
          v.profileImageUrl || v.profile_image_url || v.channelAvatar || v.channel_avatar || v.avatar || null, 
          v.durationSeconds ?? v.duration_seconds ?? null, 
          v.description ?? null, 
          v.tags ?? null, 
          v.likeCount || v.like_count || null, 
          v.commentCount || v.comment_count || null
        );

        // Folder assignments
        const folders = v.folder_assignments || v.folderAssignments;
        if (folders && Array.isArray(folders)) {
          for (const c of folders) {
            await assignVideoToFolder(dbId, itemId, c);
          }
        }

        if (i % 10 === 0) setProgress({ current: i + 1, total: videos.length, message: `Importing... ${i + 1}` });
      }

      setTimeout(() => { if (onUploadComplete) onUploadComplete(dbId); }, 1000);

    } catch (e) {
      setError('JSON Import Failed: ' + e.message);
      setLoading(false);
    }
  };





  // ==========================================
  // HANDLERS: EXPORT TAB
  // ==========================================

  const handleExportSubmit = async () => {
    if (!exportPlaylistId) {
      setError('Please select a playlist to export');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress({ current: 0, total: 100, message: 'Fetching playlist data...' });

      const playlist = availablePlaylists.find(p => p.id === parseInt(exportPlaylistId));
      if (!playlist) throw new Error('Playlist not found');

      const items = await getPlaylistItems(parseInt(exportPlaylistId));
      
      setProgress({ current: 30, total: 100, message: 'Fetching folder assignments...' });
      
      const videosWithFolders = await Promise.all(
        items.map(async (video, index) => {
          if (index % 10 === 0) {
            setProgress({ 
              current: 30 + Math.floor((index / items.length) * 60), 
              total: 100, 
              message: `Processing videos... ${index + 1}/${items.length}` 
            });
          }
          
          let includeThis = true;
          const isChannel = video.video_url?.includes('youtube.com/channel/') || 
                            video.video_url?.includes('youtube.com/@') || 
                            video.video_url?.startsWith('@');
          const isPlaylistTracker = video.isPlaylist || video.video_url?.includes('youtube.com/playlist?list=');
          
          if (isChannel && !exportOptions.channelCards) includeThis = false;
          if (isPlaylistTracker && !exportOptions.idCards) includeThis = false;
          if (!isChannel && !isPlaylistTracker && !exportOptions.videos) includeThis = false;

          if (!includeThis) return null;

          const folderAssignments = exportOptions.folders 
            ? await getVideoFolderAssignments(parseInt(exportPlaylistId), video.id)
            : [];
          
          return {
            video_url: video.video_url || video.videoUrl,
            video_id: video.video_id || video.videoId,
            title: video.title,
            thumbnail_url: video.thumbnail_url || video.thumbnailUrl,
            author: video.author,
            view_count: video.view_count || video.viewCount,
            published_at: video.published_at || video.publishedAt || video.published_date || video.uploadDate || video.upload_date || null,
            is_local: video.is_local || video.isLocal || false,
            profile_image_url: video.profile_image_url || video.profileImageUrl || video.channelAvatar || video.channel_avatar || video.avatar || null,
            duration_seconds: video.duration_seconds,
            description: video.description,
            tags: video.tags,
            position: video.position,
            folder_assignments: Array.isArray(folderAssignments) ? folderAssignments : [],
          };
        })
      );

      const filteredVideos = videosWithFolders.filter(Boolean);

      const exportData = {
        version: '1.1',
        export_date: new Date().toISOString(),
        playlist: {
          name: playlist.name,
          description: playlist.description,
        },
        videos: filteredVideos,
      };

      setProgress({ current: 95, total: 100, message: 'Generating JSON file...' });

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${playlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress({ current: 100, total: 100, message: 'Export complete!' });
      setLoading(false);
      
      setTimeout(() => {
        if (onUploadComplete) onUploadComplete();
      }, 1500);

    } catch (e) {
      console.error('Export failed', e);
      setError('Export Failed: ' + e.message);
      setLoading(false);
    }
  };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {showSelector && (
        <PlaylistFolderSelector
          onSelect={handleSelectorSelect}
          onCancel={() => setShowSelector(false)}
        />
      )}

      <div className="w-full max-w-4xl mx-auto p-0 bg-white rounded-lg border border-slate-200 flex flex-col h-[80vh] max-h-[800px]">

        {/* HEADER & TABS */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-100/80 rounded-t-lg">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'add' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              Add
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'export' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              Export
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'json' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'subscriptions' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('source')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'source' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              Source
            </button>
          </div>

          <button onClick={onCancel} className="text-slate-500 hover:text-slate-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-600">



          {/* === ADD TAB === */}
          {activeTab === 'add' && (
            <div className="space-y-6">
              {/* 1. Target Playlist Bar */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center">
                <div className="flex-shrink-0 text-slate-700 font-medium">Add to:</div>

                {targetMode === 'existing' ? (
                  <div className="flex-1 flex gap-2">
                    <select
                      value={selectedPlaylistId}
                      onChange={(e) => setSelectedPlaylistId(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                      disabled={loading}
                    >
                      <option value="">Default (Unsorted)</option>
                      {availablePlaylists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setTargetMode('new')}
                      className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg transition-colors"
                      title="Create New Playlist"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      type="text"
                      placeholder="New Playlist Name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-green-500 focus:outline-none"
                      autoFocus
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Description (Optional)"
                        value={newPlaylistDescription}
                        onChange={(e) => setNewPlaylistDescription(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-green-500 focus:outline-none"
                        disabled={loading}
                      />
                      <button
                        onClick={() => setTargetMode('existing')}
                        className="bg-slate-200 hover:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. All Links Input */}
              {/* 2. Links Input with Folder Prism */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-700">Assign Links to Folder</label>
                  <button
                    onClick={() => handleAddSelectorClick(activeSegment)}
                    className="text-xs text-sky-500 hover:text-sky-600 flex items-center gap-1 font-medium"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Existing
                  </button>
                </div>

                <div className="flex items-center h-8 mb-2 border border-slate-300 rounded-lg overflow-hidden bg-slate-100/50">
                  <button
                    onClick={() => setActiveSegment('all')}
                    className={`h-full min-w-[3.5rem] flex-1 flex items-center justify-center transition-all tabular-nums text-[10px] font-bold leading-none ${activeSegment === 'all'
                      ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-black/10 bg-white text-black'
                      : 'opacity-60 hover:opacity-100 bg-white text-black'
                      }`}
                    title="No Folder Assignment"
                  >
                    {playlistLinks['all'] ? (
                      <span className="text-black drop-shadow-sm">
                        {playlistLinks['all'].split('\n').filter(Boolean).length} All
                      </span>
                    ) : 'All'}
                  </button>
                  {FOLDER_COLORS.map((color) => {
                    const isSelected = activeSegment === color.id;
                    const count = targetFolderCounts[color.id] || 0;
                    return (
                      <button
                        key={color.id}
                        onClick={() => setActiveSegment(color.id)}
                        className={`h-full flex-1 min-w-0 flex items-center justify-center transition-all tabular-nums ${isSelected
                          ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white/50'
                          : 'opacity-60 hover:opacity-100'
                          }`}
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name} Folder`}
                      >
                        {count > 0 && (
                          <span className="text-[10px] font-bold text-white/90 drop-shadow-md">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <LinkBubbleInput
                  value={playlistLinks[activeSegment]}
                  onChange={(val) => handleLinkChange(activeSegment, val)}
                  placeholder={activeSegment === 'all' ? "Paste links here (No folder assignment)... (Space or Enter to add)" : `Paste links to assign to ${FOLDER_COLORS.find(c => c.id === activeSegment)?.name} folder... (Space or Enter to add)`}
                  colorHex={activeSegment === 'all' ? null : FOLDER_COLORS.find(c => c.id === activeSegment)?.hex}
                  disabled={loading}
                  minHeight="10rem"
                />
                
                <div className="flex justify-start gap-2">
                  <button
                    type="button"
                    onClick={handleSelectLocalVideosForAdd}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload from Device
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectLocalFolderForAdd}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    </svg>
                    Upload Folder
                  </button>
                </div>
              </div>

              {/* Subscription Options */}
              <div className="flex items-center gap-4 bg-slate-100/80 p-3 rounded-lg border border-slate-200">
                <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscribeToChannels}
                    onChange={(e) => setSubscribeToChannels(e.target.checked)}
                    className="w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-500 bg-slate-200"
                  />
                  <span>Subscribe (Auto-update)</span>
                </label>

                {subscribeToChannels && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <span className="text-xs text-slate-500">Limit:</span>
                    <select
                      value={maxVideosPerSource}
                      onChange={(e) => setMaxVideosPerSource(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded p-1"
                    >
                      <option value={10}>10 videos</option>
                      <option value={20}>20 videos</option>
                      <option value={50}>50 videos</option>
                    </select>
                  </div>
                )}
              </div>



            </div>
          )}



          {/* === JSON TAB === */}
          {activeTab === 'json' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Paste Configuration or Upload File</label>
                <div>
                  <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileSelect} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-slate-200 hover:bg-slate-300 text-white px-3 py-1.5 rounded-md transition-colors"
                    disabled={loading}
                  >
                    Upload File
                  </button>
                </div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm text-slate-700 focus:border-sky-500 focus:outline-none resize-none"
                placeholder="{ 'playlist': ... }"
                disabled={loading}
              />
            </div>
          )}


          {/* === EXPORT TAB === */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <label className="text-sm font-medium text-slate-700 block mb-2">Playlist to Export:</label>
                <select
                  value={exportPlaylistId}
                  onChange={(e) => setExportPlaylistId(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                  disabled={loading}
                >
                  <option value="" disabled>Select a playlist</option>
                  {availablePlaylists.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Export Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.videos}
                      onChange={(e) => setExportOptions({ ...exportOptions, videos: e.target.checked })}
                      className="w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">Playlist Videos</span>
                      <span className="text-xs text-slate-500">Include all standard YouTube/Local videos</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.folders}
                      onChange={(e) => setExportOptions({ ...exportOptions, folders: e.target.checked })}
                      className="w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">Folder Configurations</span>
                      <span className="text-xs text-slate-500">Include colored folder assignments</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.idCards}
                      onChange={(e) => setExportOptions({ ...exportOptions, idCards: e.target.checked })}
                      className="w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">Playlist ID Cards</span>
                      <span className="text-xs text-slate-500">Include linked playlist tracker cards</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.channelCards}
                      onChange={(e) => setExportOptions({ ...exportOptions, channelCards: e.target.checked })}
                      className="w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">Channel Link Cards</span>
                      <span className="text-xs text-slate-500">Include linked channel cards</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-sky-50 rounded-lg border border-sky-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-xs text-sky-700 space-y-1">
                  <p className="font-bold">JSON Export Information</p>
                  <p>Exports are typically in the KB range, making them lightweight and easy to share.</p>
                  <p>Local file references (orb/banner presets) are currently excluded to keep transfers simple.</p>
                </div>
              </div>
            </div>
          )}

          {/* === SUBSCRIPTIONS TAB === */}
          {activeTab === 'subscriptions' && (
            <SubscriptionManagerModal
              isOpen={true}
              onClose={onCancel}
              playlistId={getEffectivePlaylistId()}
              isInline={true}
            />
          )}

          {/* === SOURCE TAB === */}
          {activeTab === 'source' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center bg-slate-50/80 p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Source Visibility Control</h3>
                  <p className="text-xs text-slate-500">Select which card types appear on the Videos page active grid.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setVisibleSourceTypes({
                        orb: true,
                        banner: true,
                        video: true,
                        image: true,
                        tracker: true,
                        channel: true,
                        tweet: true,
                      });
                    }}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg text-xs font-semibold transition-colors border border-sky-200"
                  >
                    Reset (Show All)
                  </button>
                  <button
                    onClick={() => {
                      setVisibleSourceTypes({
                        orb: false,
                        banner: false,
                        video: false,
                        image: false,
                        tracker: false,
                        channel: false,
                        tweet: false,
                      });
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                  >
                    Clear (Hide All)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'video', label: 'Video Cards', desc: 'Standard YouTube & local video players', icon: <Video className="w-5 h-5 text-sky-500" /> },
                  { key: 'image', label: 'Local Image Cards', desc: 'Ingested local image files', icon: <Image className="w-5 h-5 text-emerald-500" /> },
                  { key: 'tracker', label: 'Playlist Trackers', desc: 'YouTube Playlist subscription cards', icon: <ListVideo className="w-5 h-5 text-indigo-500" /> },
                  { key: 'channel', label: 'Channel Trackers', desc: 'YouTube Channel creator avatars', icon: <User className="w-5 h-5 text-purple-500" /> },
                  { key: 'tweet', label: 'Tweet Cards', desc: 'Social feeds and tweet bookmarks', icon: <MessageSquare className="w-5 h-5 text-blue-400" /> },
                  { key: 'orb', label: 'Orb Cards', desc: 'Central visualizer preset selectors', icon: <Radio className="w-5 h-5 text-rose-500" /> },
                  { key: 'banner', label: 'Banner Cards', desc: 'Page-level banner theme configs', icon: <Layout className="w-5 h-5 text-amber-500" /> },
                ].map(({ key, label, desc, icon }) => {
                  const isVisible = visibleSourceTypes[key] !== false;
                  return (
                    <div
                      key={key}
                      onClick={() => toggleSourceTypeVisibility(key)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                        isVisible
                          ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                          : 'bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isVisible ? 'bg-slate-100' : 'bg-slate-200/50'}`}>
                          {icon}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">{label}</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                              {counts[key] || 0}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{desc}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                          isVisible ? 'bg-sky-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${
                            isVisible ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER & STATUS */}
        <div className="p-4 border-t border-slate-200 bg-slate-100/80 rounded-b-lg space-y-4">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{progress.message}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${(progress.total ? (progress.current / progress.total * 100) : 0)}%` }}></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors"
              disabled={loading}
            >
              {(activeTab === 'subscriptions' || activeTab === 'source') ? 'Done' : 'Cancel'}
            </button>
            {activeTab !== 'subscriptions' && activeTab !== 'source' && (
              <button
                onClick={
                  activeTab === 'add' ? handleAddSubmit :
                    activeTab === 'export' ? handleExportSubmit :
                      activeTab === 'json' ? handleJsonSubmit :
                        () => { }
                }
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${loading ? 'bg-slate-300 cursor-not-allowed opacity-50' : 'bg-sky-500 hover:bg-sky-600'}`}
              >
                {loading ? 'Processing...' : (
                  activeTab === 'add' ? 'Import to Playlist' :
                    activeTab === 'export' ? 'Export to JSON' :
                      activeTab === 'json' ? 'Import JSON' :
                        'Save Changes'
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default PlaylistUploader;

