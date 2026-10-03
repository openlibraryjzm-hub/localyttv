import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, RefreshCw, ExternalLink, PlaySquare, Youtube, Folder } from 'lucide-react';
import { getPlaylistItems, addVideoToPlaylist, assignVideoToFolder } from '../api/playlistApi';
import { fetchChannelUploads, extractPlaylistId, fetchPlaylistVideos, extractChannelInfo } from '../utils/youtubeUtils';
import { FOLDER_COLORS } from '../utils/folderColors';
import { invoke } from '../api/platformBridge';
import { extractVideoMetadata, extractImageMetadata } from '../utils/localFileUtils';

const SubscriptionManagerModal = ({ isOpen, onClose, playlistId, isInline = false }) => {
    const [channels, setChannels] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingState, setFetchingState] = useState({}); // Stores fetching state per item ID
    const [folderTargets, setFolderTargets] = useState({}); // Stores folder target per item ID
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Load available source items when modal opens
    useEffect(() => {
        if ((isOpen || isInline) && playlistId) {
            loadSources();
            setError(null);
            setSuccessMsg(null);
        } else if ((isOpen || isInline) && !playlistId) {
            setError('No playlist ID provided');
        }
    }, [isOpen, isInline, playlistId]);

    const loadSources = async () => {
        setLoading(true);
        setError(null);
        try {
            const id = parseInt(playlistId, 10);
            if (isNaN(id)) throw new Error(`Invalid playlist ID: ${playlistId}`);

            const items = await getPlaylistItems(id);

            const discoveredChannels = [];
            const discoveredPlaylists = [];
            const discoveredFolders = [];

            items.forEach(item => {
                const url = item.video_url || '';

                const isFolderTracker = item.isFolderTracker || url.startsWith('local:device_folder:');
                if (isFolderTracker) {
                    discoveredFolders.push(item);
                    return;
                }

                // Skip standalone local items
                if (item.is_local) {
                    return;
                }

                // Identify channels
                const channelInfo = extractChannelInfo(url);
                const isChannel = channelInfo || item.isChannel || url.includes('youtube.com/channel/') || url.includes('youtube.com/@') || url.startsWith('@');

                // Identify playlists
                const extractedPlId = extractPlaylistId(url);
                const isPlaylist = extractedPlId && !isChannel;

                if (isChannel) {
                    discoveredChannels.push(item);
                } else if (isPlaylist) {
                    discoveredPlaylists.push({ ...item, extractedListId: extractedPlId });
                }
            });

            setChannels(discoveredChannels);
            setPlaylists(discoveredPlaylists);
            setFolders(discoveredFolders);
        } catch (err) {
            console.error('Failed to load sources:', err);
            setError('Failed to load subscriptions: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const displayMsg = (msg, type = 'success') => {
        if (type === 'error') setError(msg);
        else setSuccessMsg(msg);
        setTimeout(() => {
            setError(null);
            setSuccessMsg(null);
        }, 4000);
    };

    const handleFetchChannel = async (item, limit) => {
        if (!window.confirm(`Fetch latest ${limit === Infinity ? 'ALL' : limit} videos for ${item.title}?`)) return;

        setFetchingState(prev => ({ ...prev, [item.id]: true }));
        try {
            const pid = parseInt(playlistId, 10);
            const existingItems = await getPlaylistItems(pid);
            const existingVideoIds = new Set(existingItems.map(i => i.video_id));

            // Determine Channel ID
            const channelInfo = extractChannelInfo(item.video_url);

            // Get target folder color
            const targetColor = folderTargets[item.id] || 'all';

            let targetId = null;
            if (channelInfo && channelInfo.type === 'id') {
                targetId = channelInfo.value;
            } else {
                // If it's a handle or we couldn't parse it well, we might need a backup
                // Assume the actual ID was saved as `video_id` when the channel card was created!
                if (item.video_id && item.video_id.startsWith('UC')) {
                    targetId = item.video_id;
                } else {
                    throw new Error("Could not definitively extract Channel ID. Make sure it's a direct channel link.");
                }
            }

            const fetchLimit = limit === Infinity ? 500 : limit; // Capping Infinity to 500 to prevent API exhaustion, but it "goes crazy" relative to 10
            const newVideos = await fetchChannelUploads(targetId, fetchLimit);

            let addedCount = 0;
            for (const v of newVideos) {
                if (!existingVideoIds.has(v.video_id)) {
                    const addedItemId = await addVideoToPlaylist(
                        pid,
                        v.video_url || v.videoUrl,
                        v.video_id || v.videoId,
                        v.title,
                        v.thumbnail_url || v.thumbnailUrl || null,
                        v.author || null,
                        v.view_count ?? v.viewCount ?? null,
                        v.published_at || v.publishedAt || null,
                        false,
                        v.profile_image_url || v.profileImageUrl || null,
                        v.durationSeconds ?? v.duration_seconds ?? null,
                        v.description || null,
                        v.tags || null
                    );
                    existingVideoIds.add(v.video_id);
                    if (targetColor !== 'all') {
                        await assignVideoToFolder(pid, addedItemId, targetColor);
                    }
                    addedCount++;
                }
            }
            displayMsg(`Fetched ${addedCount} new videos from ${item.title}`);
        } catch (err) {
            console.error('Fetch error:', err);
            displayMsg(err.message || 'Error fetching channel videos', 'error');
        } finally {
            setFetchingState(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const handleRefreshPlaylist = async (item) => {
        setFetchingState(prev => ({ ...prev, [item.id]: true }));
        try {
            const pid = parseInt(playlistId, 10);
            const existingItems = await getPlaylistItems(pid);
            const existingVideoIds = new Set(existingItems.map(i => i.video_id));

            // Get target folder color
            const targetColor = folderTargets[item.id] || 'all';

            // Fetch up to 100 recent videos to see if there's anything new
            const newVideos = await fetchPlaylistVideos(item.extractedListId, 100);

            let addedCount = 0;
            for (const v of newVideos) {
                if (!existingVideoIds.has(v.video_id)) {
                    const addedItemId = await addVideoToPlaylist(
                        pid,
                        v.video_url || v.videoUrl,
                        v.video_id || v.videoId,
                        v.title,
                        v.thumbnail_url || v.thumbnailUrl || null,
                        v.author || null,
                        v.view_count ?? v.viewCount ?? null,
                        v.published_at || v.publishedAt || null,
                        false,
                        v.profile_image_url || v.profileImageUrl || null,
                        v.durationSeconds ?? v.duration_seconds ?? null,
                        v.description || null,
                        v.tags || null
                    );
                    existingVideoIds.add(v.video_id);
                    if (targetColor !== 'all') {
                        await assignVideoToFolder(pid, addedItemId, targetColor);
                    }
                    addedCount++;
                }
            }
            displayMsg(`Refreshed ${addedCount} new videos from ${item.title}`);
        } catch (err) {
            console.error('Refresh error:', err);
            displayMsg(err.message || 'Error refreshing playlist', 'error');
        } finally {
            setFetchingState(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const handleRefreshFolder = async (item) => {
        setFetchingState(prev => ({ ...prev, [item.id]: true }));
        try {
            const pid = parseInt(playlistId, 10);
            const existingItems = await getPlaylistItems(pid);
            const existingVideoUrls = new Set(existingItems.map(i => i.video_url));

            // Get target folder color
            const targetColor = folderTargets[item.id] || 'all';
            const dirPath = item.video_url.replace('local:device_folder:', '');
            const videoPaths = await invoke('get_videos_in_directory', { dirPath });

            let addedCount = 0;
            if (videoPaths && videoPaths.length > 0) {
                for (let j = 0; j < videoPaths.length; j++) {
                    const videoPath = videoPaths[j];
                    if (!existingVideoUrls.has(videoPath)) {
                        const pathParts = videoPath.split(/[/\\]/);
                        const fileName = pathParts[pathParts.length - 1];
                        const videoId = `local_${videoPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
                        
                        const isImg = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(videoPath);

                        displayMsg(`Extracting thumbnail for new file: ${fileName}...`);

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
                            console.error('Failed to extract metadata for new item:', fileName, thumbErr);
                        }

                        const addedItemId = await addVideoToPlaylist(
                            pid, 
                            videoPath, 
                            videoId, 
                            fileName, 
                            thumbnailUrl, 
                            isImg ? 'Local Image' : 'Local File', 
                            '0', 
                            new Date().toISOString(), 
                            true, 
                            null, 
                            durationSeconds
                        );
                        if (targetColor !== 'all') {
                            await assignVideoToFolder(pid, addedItemId, targetColor);
                        }
                        existingVideoUrls.add(videoPath);
                        addedCount++;
                    }
                }
            }

            displayMsg(`Refreshed ${addedCount} new local files from ${item.title}`);
        } catch (err) {
            console.error('Refresh folder error:', err);
            displayMsg(err.message || 'Error refreshing folder', 'error');
        } finally {
            setFetchingState(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const handleRefreshAll = async (limit) => {
        if (!window.confirm(`Fetch latest ${limit === Infinity ? 'ALL' : limit} videos for ALL channels and refresh ALL playlists?`)) return;

        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        const refreshErrors = [];

        try {
            // Refresh Channels
            for (const item of channels) {
                try {
                    setFetchingState(prev => ({ ...prev, [item.id]: true }));
                    const pid = parseInt(playlistId, 10);
                    const existingItems = await getPlaylistItems(pid);
                    const existingVideoIds = new Set(existingItems.map(i => i.video_id));

                    const channelInfo = extractChannelInfo(item.video_url);
                    const targetColor = folderTargets[item.id] || 'all';

                    let targetId = null;
                    if (channelInfo && channelInfo.type === 'id') {
                        targetId = channelInfo.value;
                    } else if (item.video_id && item.video_id.startsWith('UC')) {
                        targetId = item.video_id;
                    } else {
                        throw new Error(`Could not definitively extract Channel ID for ${item.title}.`);
                    }

                    const fetchLimit = limit === Infinity ? 500 : limit;
                    const newVideos = await fetchChannelUploads(targetId, fetchLimit);

                    for (const v of newVideos) {
                        if (!existingVideoIds.has(v.video_id)) {
                            const addedItemId = await addVideoToPlaylist(
                                pid, v.video_url, v.video_id, v.title, null, v.author, null, v.published_at, false, v.profile_image_url || null
                            );
                            existingVideoIds.add(v.video_id);
                            if (targetColor !== 'all') {
                                await assignVideoToFolder(pid, addedItemId, targetColor);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error refreshing channel ${item.title}:`, err);
                    refreshErrors.push(err.message || String(err));
                } finally {
                    setFetchingState(prev => ({ ...prev, [item.id]: false }));
                }
            }

            // Refresh Playlists
            for (const item of playlists) {
                try {
                    setFetchingState(prev => ({ ...prev, [item.id]: true }));
                    const pid = parseInt(playlistId, 10);
                    const existingItems = await getPlaylistItems(pid);
                    const existingVideoIds = new Set(existingItems.map(i => i.video_id));

                    const targetColor = folderTargets[item.id] || 'all';
                    const newVideos = await fetchPlaylistVideos(item.extractedListId, 100);

                    for (const v of newVideos) {
                        if (!existingVideoIds.has(v.video_id)) {
                            const addedItemId = await addVideoToPlaylist(
                                pid, v.video_url, v.video_id, v.title, null, v.author, null, v.published_at, false, v.profile_image_url || null
                            );
                            existingVideoIds.add(v.video_id);
                            if (targetColor !== 'all') {
                                    await assignVideoToFolder(pid, addedItemId, targetColor);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error refreshing playlist ${item.title}:`, err);
                    refreshErrors.push(err.message || String(err));
                } finally {
                    setFetchingState(prev => ({ ...prev, [item.id]: false }));
                }
            }

            // Refresh Folders
            for (const item of folders) {
                try {
                    setFetchingState(prev => ({ ...prev, [item.id]: true }));
                    const pid = parseInt(playlistId, 10);
                    const existingItems = await getPlaylistItems(pid);
                    const existingVideoUrls = new Set(existingItems.map(i => i.video_url));

                    const targetColor = folderTargets[item.id] || 'all';
                    const dirPath = item.video_url.replace('local:device_folder:', '');
                    const videoPaths = await invoke('get_videos_in_directory', { dirPath });

                    if (videoPaths && videoPaths.length > 0) {
                        for (let j = 0; j < videoPaths.length; j++) {
                            const videoPath = videoPaths[j];
                            if (!existingVideoUrls.has(videoPath)) {
                                const pathParts = videoPath.split(/[/\\]/);
                                const fileName = pathParts[pathParts.length - 1];
                                const videoId = `local_${videoPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
                                
                                const isImg = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(videoPath);

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
                                    console.error('Failed to extract metadata for new item:', fileName, thumbErr);
                                }

                                const addedItemId = await addVideoToPlaylist(
                                    pid, 
                                    videoPath, 
                                    videoId, 
                                    fileName, 
                                    thumbnailUrl, 
                                    isImg ? 'Local Image' : 'Local File', 
                                    '0', 
                                    new Date().toISOString(), 
                                    true, 
                                    null, 
                                    durationSeconds
                                );
                                if (targetColor !== 'all') {
                                    await assignVideoToFolder(pid, addedItemId, targetColor);
                                }
                                existingVideoUrls.add(videoPath);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error refreshing folder ${item.title}:`, err);
                    refreshErrors.push(err.message || String(err));
                } finally {
                    setFetchingState(prev => ({ ...prev, [item.id]: false }));
                }
            }

            if (refreshErrors.length > 0) {
                const keyErr = refreshErrors.find(e => e.includes('API Key') || e.includes('API key'));
                displayMsg(keyErr || refreshErrors[0], 'error');
            } else {
                displayMsg('Successfully refreshed all channels, playlists, and folders!');
            }
        } catch (err) {
            console.error('Refresh all error:', err);
            displayMsg(err.message || 'Error refreshing all', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen && !isInline) return null;

    const renderFolderBar = (itemId) => {
        const targetFolder = folderTargets[itemId] || 'all';
        return (
            <div className="flex items-center h-5 border border-slate-300 rounded-md overflow-hidden bg-slate-100/50">
                <button
                    onClick={() => setFolderTargets(prev => ({ ...prev, [itemId]: 'all' }))}
                    className={`h-full min-w-[2.5rem] flex-1 flex items-center justify-center transition-all tabular-nums text-[9px] font-bold leading-none ${targetFolder === 'all'
                        ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-black/10 bg-white text-black drop-shadow-sm'
                        : 'opacity-60 hover:opacity-100 bg-white text-black'
                        }`}
                    title="No Folder Assignment"
                >
                    All
                </button>
                {FOLDER_COLORS.map((color) => {
                    const isSelected = targetFolder === color.id;
                    return (
                        <button
                            key={color.id}
                            onClick={() => setFolderTargets(prev => ({ ...prev, [itemId]: color.id }))}
                            className={`h-full flex-1 min-w-0 flex items-center justify-center transition-all tabular-nums ${isSelected
                                ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white/50'
                                : 'opacity-60 hover:opacity-100'
                                }`}
                            style={{ backgroundColor: color.hex }}
                            title={`${color.name} Folder`}
                        />
                    );
                })}
            </div>
        );
    };

    if (isInline) {
        return (
            <div className="w-full h-full flex flex-col bg-slate-50">
                {/* Feedback Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium shadow-sm sticky top-0 z-10 mb-4">
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium shadow-sm sticky top-0 z-10 mb-4">
                        {successMsg}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : channels.length === 0 && playlists.length === 0 && folders.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 bg-white shadow-sm rounded-2xl border border-slate-200 border-dashed">
                        No channels, playlists, or folders found in this view.<br />
                        <span className="text-xs mt-2 block opacity-70">Add a channel, playlist, or local folder link via the '+' menu first!</span>
                    </div>
                ) : (
                    <div className="space-y-8 pb-8">
                        {/* Channels Section */}
                        {channels.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <Youtube className="text-red-500" size={16} /> Channel Subscriptions ({channels.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {channels.map(item => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-sky-200 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                                                    {item.thumbnail_url ? (
                                                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{item.title?.charAt(0)}</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                    <a href={item.video_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline flex items-center gap-1 mt-0.5">
                                                        View Channel <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                            </div>

                                            {renderFolderBar(item.id)}

                                            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 border border-slate-100 rounded-lg">
                                                <span className="text-xs font-semibold text-slate-500 mr-0.5">Fetch:</span>
                                                {[1, 5, 10, 25, 50, 100].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => handleFetchChannel(item, num)}
                                                        disabled={fetchingState[item.id]}
                                                        className="min-w-[1.75rem] flex-1 text-[10px] font-bold py-1 px-1 bg-white border border-slate-200 rounded text-slate-600 hover:border-sky-300 hover:text-sky-600 disabled:opacity-50 transition-all text-center"
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => handleFetchChannel(item, Infinity)}
                                                    disabled={fetchingState[item.id]}
                                                    className="min-w-[2.25rem] flex-1 text-[10px] font-bold py-1 px-1 bg-sky-500 border border-sky-600 rounded text-white hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                                                >
                                                    {fetchingState[item.id] ? <RefreshCw size={10} className="animate-spin" /> : 'ALL'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Playlists Section */}
                        {playlists.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <PlaySquare className="text-sky-500" size={16} /> Tracked Playlists ({playlists.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {playlists.map(item => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-8 rounded shrink-0 bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                    {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <PlaySquare className="text-white/80" size={12} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                    <a href={item.video_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 mt-0.5">
                                                        View Playlist <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                            </div>

                                            {renderFolderBar(item.id)}

                                            <button
                                                onClick={() => handleRefreshPlaylist(item)}
                                                disabled={fetchingState[item.id]}
                                                className="w-full mt-auto flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 disabled:opacity-50 transition-all"
                                            >
                                                <RefreshCw size={14} className={fetchingState[item.id] ? "animate-spin" : ""} />
                                                {fetchingState[item.id] ? 'Refreshing...' : 'Refresh Latest'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Folders Section */}
                        {folders.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <Folder className="text-teal-500" size={16} /> Tracked Folders ({folders.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {folders.map(item => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-teal-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-8 rounded shrink-0 bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                    {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <Folder className="text-white/80" size={12} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                    <div className="text-[10px] text-teal-600 font-mono truncate mt-0.5" title={item.video_url.replace('local:device_folder:', '')}>
                                                        {item.video_url.replace('local:device_folder:', '')}
                                                    </div>
                                                </div>
                                            </div>

                                            {renderFolderBar(item.id)}

                                            <button
                                                onClick={() => handleRefreshFolder(item)}
                                                disabled={fetchingState[item.id]}
                                                className="w-full mt-auto flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 bg-teal-50 border border-teal-100 rounded-lg text-teal-600 hover:bg-teal-100 hover:border-teal-300 disabled:opacity-50 transition-all"
                                            >
                                                <RefreshCw size={14} className={fetchingState[item.id] ? "animate-spin" : ""} />
                                                {fetchingState[item.id] ? 'Refreshing...' : 'Refresh Latest'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Refresh All Section */}
                        <div className="bg-white border text-center border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 flex-1 text-left">
                                <h4 className="text-sm font-bold text-slate-800">Refresh All Subscriptions</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Fetch latest videos for all channels and tracked playlists above.</p>
                            </div>
                            <div className="relative z-10 flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 border border-slate-100 rounded-lg w-full sm:w-auto">
                                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-0.5">Fetch per channel:</span>
                                {[1, 5, 10, 25, 50, 100].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handleRefreshAll(num)}
                                        disabled={loading}
                                        className="min-w-[1.75rem] text-[10px] font-bold py-1 px-1 bg-white border border-slate-200 rounded text-slate-600 hover:border-sky-300 hover:text-sky-600 disabled:opacity-50 transition-all text-center flex-1 sm:flex-initial"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handleRefreshAll(Infinity)}
                                    disabled={loading}
                                    className="min-w-[3.25rem] text-[10px] font-bold py-1 px-1 bg-sky-500 border border-sky-600 rounded text-white hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                                >
                                    {loading ? <RefreshCw size={10} className="animate-spin" /> : 'ALL'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">

                {/* Header (Light Theme) */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                            <RefreshCw className="text-sky-500" size={22} />
                            Subscription Manager
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Manage channels and playlists currently residing in this folder view.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors bg-slate-50 border border-slate-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative bg-slate-50/50">

                    {/* Feedback Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium shadow-sm sticky top-0 z-10">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium shadow-sm sticky top-0 z-10">
                            {successMsg}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : channels.length === 0 && playlists.length === 0 && folders.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 bg-white shadow-sm rounded-2xl border border-slate-200 border-dashed">
                            No channels, playlists, or folders found in this view.<br />
                            <span className="text-xs mt-2 block opacity-70">Add a channel, playlist, or local folder link via the '+' menu first!</span>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* Channels Section */}
                            {channels.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                        <Youtube className="text-red-500" size={16} /> Channel Subscriptions ({channels.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {channels.map(item => (
                                            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-sky-200 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                                                        {item.thumbnail_url ? (
                                                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{item.title?.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                        <a href={item.video_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline flex items-center gap-1 mt-0.5">
                                                            View Channel <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                </div>

                                                {renderFolderBar(item.id)}

                                                <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 border border-slate-100 rounded-lg">
                                                    <span className="text-xs font-semibold text-slate-500 mr-0.5">Fetch:</span>
                                                    {[1, 5, 10, 25, 50, 100].map(num => (
                                                        <button
                                                            key={num}
                                                            onClick={() => handleFetchChannel(item, num)}
                                                            disabled={fetchingState[item.id]}
                                                            className="min-w-[1.75rem] flex-1 text-[10px] font-bold py-1 px-1 bg-white border border-slate-200 rounded text-slate-600 hover:border-sky-300 hover:text-sky-600 disabled:opacity-50 transition-all text-center"
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => handleFetchChannel(item, Infinity)}
                                                        disabled={fetchingState[item.id]}
                                                        className="min-w-[2.25rem] flex-1 text-[10px] font-bold py-1 px-1 bg-sky-500 border border-sky-600 rounded text-white hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        {fetchingState[item.id] ? <RefreshCw size={10} className="animate-spin" /> : 'ALL'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Playlists Section */}
                            {playlists.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                        <PlaySquare className="text-sky-500" size={16} /> Tracked Playlists ({playlists.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {playlists.map(item => (
                                            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-8 rounded shrink-0 bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                        {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                            <PlaySquare className="text-white/80" size={12} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                        <a href={item.video_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 mt-0.5">
                                                            View Playlist <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                </div>

                                                {renderFolderBar(item.id)}

                                                <button
                                                    onClick={() => handleRefreshPlaylist(item)}
                                                    disabled={fetchingState[item.id]}
                                                    className="w-full mt-auto flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 disabled:opacity-50 transition-all"
                                                >
                                                    <RefreshCw size={14} className={fetchingState[item.id] ? "animate-spin" : ""} />
                                                    {fetchingState[item.id] ? 'Refreshing...' : 'Refresh Latest'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Folders Section */}
                            {folders.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                        <Folder className="text-teal-500" size={16} /> Tracked Folders ({folders.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {folders.map(item => (
                                            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-teal-200 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-8 rounded shrink-0 bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                        {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                            <Folder className="text-white/80" size={12} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                        <div className="text-[10px] text-teal-600 font-mono truncate mt-0.5" title={item.video_url.replace('local:device_folder:', '')}>
                                                            {item.video_url.replace('local:device_folder:', '')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {renderFolderBar(item.id)}

                                                <button
                                                    onClick={() => handleRefreshFolder(item)}
                                                    disabled={fetchingState[item.id]}
                                                    className="w-full mt-auto flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 bg-teal-50 border border-teal-100 rounded-lg text-teal-600 hover:bg-teal-100 hover:border-teal-300 disabled:opacity-50 transition-all"
                                                >
                                                    <RefreshCw size={14} className={fetchingState[item.id] ? "animate-spin" : ""} />
                                                    {fetchingState[item.id] ? 'Refreshing...' : 'Refresh Latest'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Refresh All Section */}
                            <div className="bg-white border text-center border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10 flex-1 text-left">
                                    <h4 className="text-sm font-bold text-slate-800">Refresh All Subscriptions</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Fetch latest videos for all channels and tracked playlists above.</p>
                                </div>
                                <div className="relative z-10 flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 border border-slate-100 rounded-lg w-full sm:w-auto">
                                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-0.5">Fetch per channel:</span>
                                    {[1, 5, 10, 25, 50, 100].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handleRefreshAll(num)}
                                            disabled={loading}
                                            className="min-w-[1.75rem] text-[10px] font-bold py-1 px-1 bg-white border border-slate-200 rounded text-slate-600 hover:border-sky-300 hover:text-sky-600 disabled:opacity-50 transition-all text-center flex-1 sm:flex-initial"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleRefreshAll(Infinity)}
                                        disabled={loading}
                                        className="min-w-[3.25rem] text-[10px] font-bold py-1 px-1 bg-sky-500 border border-sky-600 rounded text-white hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                                    >
                                        {loading ? <RefreshCw size={10} className="animate-spin" /> : 'ALL'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SubscriptionManagerModal;
