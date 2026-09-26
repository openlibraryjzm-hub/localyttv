import { useConfigStore } from '../store/configStore';

/**
 * Parses ISO 8601 duration (e.g. PT1H2M30S, PT15M51S) to total seconds.
 * Returns null if invalid or missing.
 */
export const parseYouTubeDuration = (isoDuration) => {
  if (!isoDuration || typeof isoDuration !== 'string') return null;
  const match = isoDuration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Extracts video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - VIDEO_ID (if already just an ID)
 */
export const extractVideoId = (url) => {
  if (!url) return null;

  // If it's already just an ID
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return url;
  }

  // Extract from watch URL
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Extract from youtu.be URL
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
};

/**
 * Gets YouTube thumbnail URL from video ID
 */
export const getThumbnailUrl = (videoId, quality = 'default') => {
  if (!videoId) return null;

  const qualities = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    max: 'maxresdefault',
  };

  const qualityKey = qualities[quality] || qualities.default;
  return `https://img.youtube.com/vi/${videoId}/${qualityKey}.jpg`;
};

/**
 * Extracts playlist ID from YouTube playlist URL
 * Supports formats:
 * - https://www.youtube.com/playlist?list=PLAYLIST_ID
 * - https://youtube.com/playlist?list=PLAYLIST_ID
 */
export const extractPlaylistId = (url) => {
  if (!url) return null;

  // Extract from playlist URL
  const playlistMatch = url.match(/[?&]list=([^&]+)/);
  if (playlistMatch) return playlistMatch[1];

  // If it's already just an ID
  if (!url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('?')) {
    return url;
  }

  return null;
};

/**
 * Fetches YouTube playlist metadata using oEmbed API
 * Note: This is a fallback - for full metadata, YouTube Data API v3 is recommended
 */
export const fetchPlaylistMetadata = async (playlistId) => {
  try {
    // YouTube oEmbed doesn't support playlists directly, so we'll use a workaround
    // For now, we'll return basic info that can be extracted from the URL
    // In production, you'd want to use YouTube Data API v3 with an API key

    // Alternative: Fetch the playlist page and parse metadata
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

    // Since we can't easily scrape in browser due to CORS, we'll return minimal metadata
    // The actual implementation would need a backend proxy or YouTube Data API
    return {
      playlistId,
      url: playlistUrl,
      // These would be fetched via API in production
      title: null,
      description: null,
      thumbnailUrl: null,
      videoCount: null,
    };
  } catch (error) {
    console.error('Failed to fetch playlist metadata:', error);
    return null;
  }
};

const getApiKey = () => {
  const key = useConfigStore.getState().youtubeApiKey;
  if (!key) {
    throw new Error('YouTube API Key is missing. Click the Info button in the top menu to set one.');
  }
  return key;
};

/**
 * Fetches video metadata from YouTube Data API v3
 * This works for individual videos
 */
export const fetchVideoMetadata = async (videoId) => {
  try {
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${getApiKey()}`;

    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const snippet = data.items[0].snippet;
      const statistics = data.items[0].statistics;
      const contentDetails = data.items[0].contentDetails;

      let durationSeconds = null;
      if (contentDetails?.duration) {
        durationSeconds = parseYouTubeDuration(contentDetails.duration);
      }

      return {
        videoId,
        title: snippet.title,
        thumbnailUrl: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        author: snippet.channelTitle,
        viewCount: statistics?.viewCount || '0',
        publishedAt: snippet.publishedAt,
        durationSeconds,
        description: snippet.description || null,
        tags: Array.isArray(snippet.tags) ? JSON.stringify(snippet.tags) : null,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch video metadata:', error);
    return null;
  }
};

export const resolveHandleToChannelId = async (handle) => {
  const cleanHandle = handle.replace('@', '');
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${cleanHandle}&type=channel&maxResults=1&key=${getApiKey()}`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) throw new Error('Failed to resolve handle');
    const data = await response.json();
    return data.items?.[0]?.snippet?.channelId || null;
  } catch (error) {
    console.error('Error resolving handle:', error);
    return null;
  }
};

export const extractChannelInfo = (url) => {
  if (!url) return null;
  if (url.includes('youtube.com/channel/')) {
    const match = url.match(/channel\/(UC[\w-]+)/);
    if (match) return { type: 'id', value: match[1] };
  } else if (url.includes('youtube.com/@')) {
    const match = url.match(/@([\w.-]+)/);
    if (match) return { type: 'handle', value: match[1] };
  } else if (url.match(/^@[\w.-]+$/)) {
    return { type: 'handle', value: url.replace('@', '') };
  }
  return null;
};

export const fetchChannelMetadata = async (url) => {
  const info = extractChannelInfo(url);
  if (!info) return null;

  try {
    let actualChannelId = null;
    let snippet = null;

    if (info.type === 'handle') {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=@${info.value}&type=channel&maxResults=1&key=${getApiKey()}`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      if (!data.items?.length) return null;
      actualChannelId = data.items[0].snippet.channelId;
    } else {
      actualChannelId = info.value;
    }

    // Now get the full channel snippet and statistics (for high res avatar)
    const detailUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${actualChannelId}&key=${getApiKey()}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    if (detailData.items?.length) {
      snippet = detailData.items[0].snippet;
      const stats = detailData.items[0].statistics;

      return {
        sourcePlaylistName: 'Channel Link',
        videos: [{
          videoId: actualChannelId,
          videoUrl: `https://www.youtube.com/channel/${actualChannelId}`,
          title: snippet.title,
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
          profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
          author: snippet.title,
          viewCount: stats?.subscriberCount || '0',
          publishedAt: snippet.publishedAt,
          durationSeconds: null,
          description: snippet.description || null,
          tags: null,
          isChannel: true
        }]
      };
    }

    return null;
  } catch (error) {
    console.error('fetchChannelMetadata Error:', error);
    return null;
  }
};

export const fetchChannelUploads = async (channelId, limit = 50) => {
  if (!channelId || !channelId.startsWith('UC')) return [];

  let profileImageUrl = null;
  try {
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${getApiKey()}`;
    const channelRes = await fetch(channelUrl);
    if (channelRes.ok) {
      const channelData = await channelRes.json();
      if (channelData.items && channelData.items.length > 0) {
        profileImageUrl = channelData.items[0].snippet.thumbnails?.high?.url || channelData.items[0].snippet.thumbnails?.medium?.url || channelData.items[0].snippet.thumbnails?.default?.url || null;
      }
    }
  } catch (err) {}

  const uploadPlaylistId = 'UU' + channelId.substring(2);
  let allVideos = [];
  let nextPageToken = null;

  try {
    do {
      const remaining = limit - allVideos.length;
      if (remaining <= 0) break;
      const fetchSize = Math.min(50, remaining);

      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadPlaylistId}&maxResults=${fetchSize}&key=${getApiKey()}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) break;

      const data = await response.json();
      if (!data.items) break;

      const formattedVideos = data.items.map(item => ({
        video_id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        author: item.snippet.videoOwnerChannelTitle,
        published_at: item.snippet.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        is_local: false,
        view_count: null, // API doesn't return view count in playlistItems
        profile_image_url: profileImageUrl
      }));

      allVideos = allVideos.concat(formattedVideos);
      nextPageToken = data.nextPageToken;

    } while (nextPageToken && allVideos.length < limit);

    return allVideos;
  } catch (error) {
    console.error('Error fetching channel uploads:', error);
    return [];
  }
};

export const fetchPlaylistVideos = async (playlistId, limit = 50) => {
  if (!playlistId) return [];

  let allVideos = [];
  let nextPageToken = null;

  try {
    do {
      const remaining = limit - allVideos.length;
      if (remaining <= 0) break;
      const fetchSize = Math.min(50, remaining);

      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${fetchSize}&key=${getApiKey()}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) break;

      const data = await response.json();
      if (!data.items) break;

      const formattedVideos = data.items.filter(item => item.snippet?.resourceId?.kind === 'youtube#video').map(item => ({
        video_id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        author: item.snippet.videoOwnerChannelTitle,
        published_at: item.snippet.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        is_local: false,
        view_count: null,
        profile_image_url: null
      }));

      allVideos = allVideos.concat(formattedVideos);
      nextPageToken = data.nextPageToken;

    } while (nextPageToken && allVideos.length < limit);

    return allVideos;
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    return [];
  }
};

/**
 * Fetches "related" videos by searching for the current video's title.
 * Since the official relatedToVideoId was deprecated by Google, 
 * a keyword search is the most reliable way to find similar content.
 */
export const fetchRelatedVideos = async (videoId, title, author, limit = 24) => {
  if (!videoId || !title) return [];
  
  // Clean up title and author for better search results
  const cleanTitle = title.replace(/[^\w\s]/gi, '').substring(0, 100);
  const cleanAuthor = author ? author.replace(/[^\w\s]/gi, '').substring(0, 50) : '';
  const query = `${cleanTitle} ${cleanAuthor}`.trim();
  
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${limit}&key=${getApiKey()}`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.items) return [];

    return data.items
      .filter(item => item.id && item.id.videoId && item.id.videoId !== videoId)
      .map(item => ({
        video_id: item.id.videoId,
        title: item.snippet.title,
        thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        author: item.snippet.channelTitle,
        published_at: item.snippet.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        is_local: false,
        view_count: null,
        profile_image_url: null
      }));
  } catch (error) {
    console.error('Error fetching related videos:', error);
    return [];
  }
};

