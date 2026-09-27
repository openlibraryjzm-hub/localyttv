import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPlaylist, getAllPlaylists, getPlaylistItems, deletePlaylist, deletePlaylistByName, getAllFoldersWithVideos, exportPlaylist, getFoldersForPlaylist, toggleStuckFolder, getAllStuckFolders, getVideosInFolder, getAllVideoProgress, getAllPlaylistMetadata, addVideoToPlaylist, getFolderMetadata, getPlaylistItemsPreview, getAllPlaylistItemsPreviews, updatePlaylist, reorderPlaylistItem } from '../api/playlistApi';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import { usePlaylistStore } from '../store/playlistStore';
import { useConfigStore } from '../store/configStore';
import { Play, Shuffle, Grid3x3, RotateCcw, Info, ChevronUp, List, Layers, Folder, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import PlaylistFolderColumn from './PlaylistFolderColumn';
import PlaylistGroupColumn from './PlaylistGroupColumn';
import { useFolderStore } from '../store/folderStore';
import { useLayoutStore } from '../store/layoutStore';
import { useNavigationStore } from '../store/navigationStore';
import { getFolderColorById, FOLDER_COLORS } from '../utils/folderColors';
import { useInspectLabel } from '../utils/inspectLabels';
import PlaylistUploader from './PlaylistUploader';
import BulkPlaylistImporter from './BulkPlaylistImporter';
import LocalVideoUploader from './LocalVideoUploader';
import PlaylistCard from './PlaylistCard';
import LongPlaylistCard from './LongPlaylistCard';
import GroupPlaylistCarousel from './GroupPlaylistCarousel';
import CardMenu from './NewCardMenu'; // Using NewCardMenu as CardMenu
import CardThumbnail from './CardThumbnail';
import { usePinStore } from '../store/pinStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import UnifiedBannerBackground from './UnifiedBannerBackground';
import PlaylistCardSkeleton from './skeletons/PlaylistCardSkeleton';
import ImageHoverPreview from './ImageHoverPreview';
import PlaylistBar from './PlaylistBar';

const PlaylistsPage = ({ onVideoSelect }) => {
  const [playlists, setPlaylists] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [playlistSortBy, setPlaylistSortBy] = useState('shuffle');
  const [playlistSortDirection, setPlaylistSortDirection] = useState('desc');
  const [showHiddenPlaylists, setShowHiddenPlaylists] = useState(false);
  const [playlistContentFilter, setPlaylistContentFilter] = useState('all');
  const [centeredPlaylistName, setCenteredPlaylistName] = useState('');
  const [playlistThumbnails, setPlaylistThumbnails] = useState({});
  const [playlistRecentVideos, setPlaylistRecentVideos] = useState({});
  const [playlistItemCounts, setPlaylistItemCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [uploaderInitialPlaylistId, setUploaderInitialPlaylistId] = useState(null);
  const [showBulkImporter, setShowBulkImporter] = useState(false);
  const [showLocalVideoUploader, setShowLocalVideoUploader] = useState(false);
  const [selectedPlaylistForLocalUpload, setSelectedPlaylistForLocalUpload] = useState(null);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [expandedPlaylists, setExpandedPlaylists] = useState(new Set()); // Track which playlists are expanded
  const [playlistFolders, setPlaylistFolders] = useState({}); // Store folders for each playlist: { playlistId: [folders] }
  const [stuckFolders, setStuckFolders] = useState(new Set()); // Track stuck folders: Set of "playlistId:folderColor" strings
  const [folderMetadata, setFolderMetadata] = useState({}); // Store folder custom names: { "playlistId:folderColor": { name, description } }
  const [openFolderMenuIds, setOpenFolderMenuIds] = useState(new Set()); // Track which playlists have folder selector menu open
  const [openFolderListIds, setOpenFolderListIds] = useState(new Set()); // Track which playlists have folder list view open
  const [assignToGroupPlaylistId, setAssignToGroupPlaylistId] = useState(null); // Playlist id when "Assign to group" column is open
  const [hoveredPieSegment, setHoveredPieSegment] = useState({}); // Track hovered pie segment per playlist: { playlistId: folderColorId }
  const [folderCarouselMode, setFolderCarouselMode] = useState({}); // Track folder view mode for group carousels: { groupId: playlistId }
  const pieChartRefs = useRef({}); // Refs for pie chart containers to handle wheel events
  const pieDataRef = useRef({ hoveredPieSegment: {}, playlistFolders: {} }); // Ref to hold latest state for wheel handler

  // Preview thumbnails - tracks shuffled thumbnail previews (presence indicates shuffle was used, for showing refresh button)
  const [previewThumbnails, setPreviewThumbnails] = useState({}); // { key: { videoId, url, videoUrl, title } } - temporary preview thumbnails
  const [playlistPreviewVideos, setPlaylistPreviewVideos] = useState({}); // { playlistId: [videos] } - for the 4 little thumbnails
  const [showThumbnailInfo, setShowThumbnailInfo] = useState(new Set()); // Set of card keys with info overlay visible

  // Global info toggle - shows video titles on all cards (persisted to localStorage)
  const [activeFolderFilters, setActiveFolderFilters] = useState({}); // { playlistId: folderColor }

  // Global info toggle: driven by layoutStore (synced from localStorage on mount, persisted on change)
  const { playlistsPageShowTitles, setPlaylistsPageShowTitles, showPlaylistUploader, setShowPlaylistUploader } = useLayoutStore();
  const globalInfoToggle = playlistsPageShowTitles;

  // Prism folder selection: null = All carousels, color id = single carousel by index (one group per color)
  const [selectedPrismFolder, setSelectedPrismFolder] = useState(null);

  // Store Hooks (Moved up to prevent 'cannot access before initialization' errors)
  const { showColoredFolders, setShowColoredFolders, setHoveredFolder } = useFolderStore();
  const { groups: playlistGroups, getGroupIdsForPlaylist, getGroupByColorId, getNextAvailableColorId, addGroup, renameGroup, removeGroup, setActiveGroupId, totalPages: globalTotalPages, setTotalPages: setGlobalTotalPages, activePage: globalActivePage, setActivePage: setGlobalActivePage } = usePlaylistGroupStore();
  
  // Using global state for PrismPage to sync with ExplorerPage Hub
  const prismPage = globalActivePage;
  const setPrismPage = setGlobalActivePage;
  const storeTotalPages = globalTotalPages;
  const { setViewMode, viewMode, inspectMode, setFullscreenInfoBlanked } = useLayoutStore();
  const { 
    customPageBannerImage, 
    bannerHeight, 
    bannerBgSize,
    fullscreenBanner,
    bannerNavBannerId,
    bannerPresets,
    bannerPreviewMode,
  } = useConfigStore();

  let effectiveBanner = fullscreenBanner;
  if (bannerNavBannerId && !bannerPreviewMode && bannerPresets?.length) {
    const preset = bannerPresets.find((p) => p.id === bannerNavBannerId);
    if (preset?.fullscreenBanner) effectiveBanner = preset.fullscreenBanner;
  }

  const bannerImage = effectiveBanner?.image || '/banner.PNG';
  const bannerScale = effectiveBanner?.scale ?? 100;
  const bannerVertical = effectiveBanner?.verticalPosition ?? 0;
  const bannerHorizontal = effectiveBanner?.horizontalOffset ?? 0;
  const { setCurrentPage: setCurrentNavPage } = useNavigationStore();

  // Reset page when switching folders
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPrismFolder]);

  // Keep ref in sync with state
  pieDataRef.current.hoveredPieSegment = hoveredPieSegment;
  pieDataRef.current.playlistFolders = playlistFolders;
  const { setPlaylistItems, currentPlaylistItems, currentPlaylistId, currentVideoIndex, setCurrentFolder, setPreviewPlaylist, setAllPlaylists } = usePlaylistStore();
  const { pinnedVideos: allPinnedVideos, priorityPinIds } = usePinStore();
  const { orbFavorites, hiddenPlaylists } = useConfigStore();

  // Combined preview items per playlist: strictly YouTube video items (no Orbs, Banners, or Playlist/Folder Trackers)
  const combinedPreviewItems = useMemo(() => {
    const out = {};
    if (!playlists?.length) return out;
    playlists.forEach((p) => {
      const videos = playlistPreviewVideos[p.id] || playlistPreviewVideos[String(p.id)] || [];
      out[p.id] = videos.filter(
        (v) =>
          v &&
          !v.isOrb &&
          !v.isBannerPreset &&
          !v.isPlaylist &&
          !v.isFolderTracker &&
          !v.video_url?.startsWith('local:device_folder:')
      );
    });
    return out;
  }, [playlists, playlistPreviewVideos]);

  // Derived filtered lists for pagination (moved here to use combinedPreviewItems)
  const sortedPlaylists = useMemo(() => {
    let sorted = [...playlists];

    if (playlistSortBy?.startsWith('scramble_')) {
      // Deterministic-enough shuffle triggered newly on each click of Scramble
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;
    }

    if (playlistSortBy !== 'shuffle') {
      sorted.sort((a, b) => {
        let valA, valB;
        if (playlistSortBy === 'amount') {
          const countA = playlistItemCounts[a.id] || 0;
          const countB = playlistItemCounts[b.id] || 0;
          const comboA = combinedPreviewItems[a.id] || [];
          const comboB = combinedPreviewItems[b.id] || [];
          const orbCountA = comboA.filter((i) => i.isOrb).length;
          const bannerCountA = comboA.filter((i) => i.isBannerPreset).length;
          const orbCountB = comboB.filter((i) => i.isOrb).length;
          const bannerCountB = comboB.filter((i) => i.isBannerPreset).length;
          valA = countA + orbCountA + bannerCountA;
          valB = countB + orbCountB + bannerCountB;
        } else if (playlistSortBy === 'date') {
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
        } else if (playlistSortBy === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        }

        if (valA < valB) return playlistSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return playlistSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [playlists, playlistSortBy, playlistSortDirection, playlistItemCounts, combinedPreviewItems]);

  const getPopulatedStatus = (playlistId) => {
    const videoCount = playlistItemCounts[playlistId] || 0;
    const combined = combinedPreviewItems[playlistId] || [];
    const orbCount = combined.filter((i) => i.isOrb).length;
    const bannerCount = combined.filter((i) => i.isBannerPreset).length;
    return (videoCount + orbCount + bannerCount) > 0;
  };

  const passesContentFilter = (playlistId) => {
    if (playlistContentFilter === 'all') return true;
    const isPopulated = getPopulatedStatus(playlistId);
    if (playlistContentFilter === 'populated') return isPopulated;
    if (playlistContentFilter === 'empty') return !isPopulated;
    return true;
  };

  const allPlaylistsFiltered = useMemo(() =>
    sortedPlaylists.filter(p => {
      const isVisibilityOk = showHiddenPlaylists ? true : !(hiddenPlaylists || []).includes(p.id);
      return isVisibilityOk && passesContentFilter(p.id);
    }),
    [sortedPlaylists, hiddenPlaylists, showHiddenPlaylists, playlistContentFilter, combinedPreviewItems, playlistItemCounts]
  );

  const unsortedPlaylistsFiltered = useMemo(() => {
    if (prismPage === 1) {
      // Page 1: Standard global Unsorted (no groups at all)
      return sortedPlaylists.filter((p) => {
        if (getGroupIdsForPlaylist(p.id).length > 0) return false;
        const isVisibilityOk = showHiddenPlaylists ? true : !(hiddenPlaylists || []).includes(p.id);
        return isVisibilityOk && passesContentFilter(p.id);
      });
    } else {
      // Page 2+: Playlists in the "Inbox" group for this page (groups with no color)
      return sortedPlaylists.filter((p) => {
        const gIds = getGroupIdsForPlaylist(p.id);
        return gIds.some(gid => {
          const group = playlistGroups.find(g => g.id === gid);
          return group && (group.page || 1) === prismPage && group.folderColorId === null;
        });
      });
    }
  }, [sortedPlaylists, getGroupIdsForPlaylist, hiddenPlaylists, showHiddenPlaylists, playlistContentFilter, prismPage, playlistGroups]);

  const currentPlaylistsToRender = useMemo(() => {
    if (selectedPrismFolder === null) {
      if (prismPage === 1) {
        // Page 1 isolation: Show playlists in Page 1 groups + Unsorted playlists
        return allPlaylistsFiltered.filter(p => {
          const groupIds = getGroupIdsForPlaylist(p.id);
          if (groupIds.length === 0) return true; // Unsorted
          return groupIds.some(gid => {
            const group = playlistGroups.find(g => g.id === gid);
            return group && (group.page || 1) === 1;
          });
        });
      } else {
        // Return only playlists that are in a group on the current prismPage
        return allPlaylistsFiltered.filter(p => {
          const groupIds = getGroupIdsForPlaylist(p.id);
          return groupIds.some(gid => {
            const group = playlistGroups.find(g => g.id === gid);
            return group && (group.page || 1) === prismPage;
          });
        });
      }
    }
    // 'Unsorted' is only available/populated on Page 1
    if (selectedPrismFolder === 'unsorted') {
      return prismPage === 1 ? unsortedPlaylistsFiltered : [];
    }
    // Folder Color Selected: return playlists assigned to that group on current page
    const group = getGroupByColorId(selectedPrismFolder, prismPage);
    if (!group) return [];
    const groupPlaylistIdSet = new Set((group.playlistIds || []).map(Number));
    return allPlaylistsFiltered.filter(p => groupPlaylistIdSet.has(Number(p.id)));
  }, [selectedPrismFolder, allPlaylistsFiltered, unsortedPlaylistsFiltered, prismPage, getGroupIdsForPlaylist, playlistGroups, getGroupByColorId]);

  // Scoped counts for the PlaylistBar prism segments
  const effectiveAllCount = useMemo(() => {
    return playlists.filter(p => {
      const groupIds = getGroupIdsForPlaylist(p.id);
      if (prismPage === 1) {
        // Page 1: groups on p1 + unsorted
        if (groupIds.length === 0) return true;
        return groupIds.some(gid => {
          const group = playlistGroups.find(g => g.id === gid);
          return group && (group.page || 1) === 1;
        });
      } else {
        // Page 2+: groups on this page only
        return groupIds.some(gid => {
          const group = playlistGroups.find(g => g.id === gid);
          return group && (group.page || 1) === prismPage;
        });
      }
    }).length;
  }, [playlists, prismPage, getGroupIdsForPlaylist, playlistGroups]);

  const effectiveUnsortedCount = useMemo(() => {
    if (prismPage === 1) {
      return playlists.filter((p) => getGroupIdsForPlaylist(p.id).length === 0).length;
    } else {
      // Count playlists in the "Inbox" (colorless) group for this page
      return playlists.filter((p) => {
        const gIds = getGroupIdsForPlaylist(p.id);
        return gIds.some(gid => {
          const group = playlistGroups.find(g => g.id === gid);
          return group && (group.page || 1) === prismPage && group.folderColorId === null;
        });
      }).length;
    }
  }, [playlists, prismPage, getGroupIdsForPlaylist, playlistGroups]);

  const totalPages = Math.max(1, Math.ceil(currentPlaylistsToRender.length / itemsPerPage));
  
  const derivedTotalPages = playlistGroups.length > 0 ? Math.max(1, ...playlistGroups.map(g => g.page || 1)) : 1;
  const totalPrismPages = Math.max(storeTotalPages, derivedTotalPages);

  const displayPlaylists = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return currentPlaylistsToRender.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPlaylistsToRender, currentPage, itemsPerPage]);

  const priorityVideo = React.useMemo(() => {
    return allPinnedVideos.find(v => priorityPinIds.includes(v.id));
  }, [allPinnedVideos, priorityPinIds]);

  const activeRecentVideo = React.useMemo(() => {
    if (!currentPlaylistId) return null;

    // Try to find playlist cover first
    const currentPlaylist = playlists.find(p => String(p.id) === String(currentPlaylistId));
    if (currentPlaylist) {
      const thumbData = playlistThumbnails[currentPlaylist.id];
      const thumbUrl = thumbData ? (thumbData.max || thumbData.standard) : null;

      if (thumbUrl) {
        return {
          id: `playlist-cover-${currentPlaylist.id}`,
          video_id: 'dummy', // Placeholder
          title: currentPlaylist.name,
          thumbnailUrl: thumbUrl
        };
      }
    }

    // Fallback to current video if no playlist cover found
    if (!currentPlaylistItems || currentPlaylistItems.length === 0) return null;
    return currentPlaylistItems[currentVideoIndex] || currentPlaylistItems[0];
  }, [currentPlaylistId, playlists, playlistThumbnails, currentPlaylistItems, currentVideoIndex]);
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set());



  // Helper to get inspect label
  const getInspectTitle = (label) => inspectMode ? label : undefined;
  const hasDeletedTestPlaylist = useRef(false);

  const scrollContainerRef = useRef(null);
  const horizontalScrollRef = useRef(null);
  const arrowButtonRef = useRef(null);

  const scrollToTop = () => {
    if (horizontalScrollRef.current) {
      const target = parseFloat(horizontalScrollRef.current.dataset.startOffset || 0);
      horizontalScrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
    }
  };





  useEffect(() => {
    loadPlaylists();
    loadStuckFolders();
  }, []);

  // Sync playlistsPageShowTitles from localStorage on mount (store default is false)
  useEffect(() => {
    const saved = localStorage.getItem('playlistsPage_globalInfoToggle');
    if (saved === 'true') setPlaylistsPageShowTitles(true);
  }, []);

  // Persist global info toggle to localStorage when store value changes
  useEffect(() => {
    localStorage.setItem('playlistsPage_globalInfoToggle', globalInfoToggle.toString());
  }, [globalInfoToggle]);

  // When TopNavigation "Add" sets showPlaylistUploader, open uploader and clear flag
  useEffect(() => {
    if (showPlaylistUploader) {
      setShowUploader(true);
      setShowPlaylistUploader(false);
    }
  }, [showPlaylistUploader, setShowPlaylistUploader]);

  // Fetch titles for all playlists when global info toggle is on and playlists have loaded
  useEffect(() => {
    const fetchTitlesForGlobalToggle = async () => {
      if (!globalInfoToggle || playlists.length === 0) return;

      for (const playlist of playlists) {
        const playlistKey = `playlist-${playlist.id}`;
        if (!previewThumbnails[playlistKey]?.title) {
          try {
            const items = await getPlaylistItems(playlist.id);
            if (items.length > 0) {
              const thumbData = playlistThumbnails[playlist.id];
              const activeThumbnailUrl = thumbData?.max || thumbData?.standard;
              let targetVideo = items[0];
              if (activeThumbnailUrl) {
                const coverMatch = items.find(item => {
                  const maxThumb = (item.thumbnail_url?.replace(/name=[a-z]+/, 'name=large') || getThumbnailUrl(item.video_id, 'max'));
                  const stdThumb = (item.thumbnail_url?.replace(/name=[a-z]+/, 'name=medium') || getThumbnailUrl(item.video_id, 'standard'));
                  return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                });
                if (coverMatch) targetVideo = coverMatch;
              }
              setPreviewThumbnails(prev => ({
                ...prev,
                [playlistKey]: {
                  ...prev[playlistKey],
                  title: targetVideo.title,
                  videoId: targetVideo.video_id,
                  videoUrl: targetVideo.video_url,
                  url: prev[playlistKey]?.url || activeThumbnailUrl,
                  isShuffled: prev[playlistKey]?.isShuffled || false // Preserve shuffled state
                }
              }));
            }
          } catch (error) {
            console.error('Failed to fetch video title for playlist:', playlist.id, error);
          }
        }
      }
    };

    fetchTitlesForGlobalToggle();
  }, [globalInfoToggle, playlists.length, playlistThumbnails]);

  const loadStuckFolders = async () => {
    try {
      const stuck = await getAllStuckFolders();
      const stuckSet = new Set(stuck.map(([playlistId, folderColor]) => `${playlistId}:${folderColor}`));
      setStuckFolders(stuckSet);
    } catch (error) {
      console.error('Failed to load stuck folders:', error);
    }
  };



  useEffect(() => {
    if (showColoredFolders) {
      loadFolders();
    } else {
      // Even when toggled off, we need folder data for stuck folders
      loadFolders();
    }
    // Reload stuck folders when toggling to ensure we have folder data
    loadStuckFolders();
  }, [showColoredFolders]);

  const loadFolders = async () => {
    try {
      console.log('Loading specific folders via optimized batch fetch...');

      // Use the batch command to get all folders at once
      const bulk = await getAllFoldersWithVideos();

      if (Array.isArray(bulk)) {
        console.log('Loaded folders (batch):', bulk.length);
        setFolders(bulk);

        // Load metadata for each folder to get custom names
        const metadataMap = {};
        await Promise.all(
          bulk.map(async (folder) => {
            try {
              const metadata = await getFolderMetadata(folder.playlist_id, folder.folder_color);
              if (metadata) {
                const key = `${folder.playlist_id}:${folder.folder_color}`;
                metadataMap[key] = { name: metadata[0], description: metadata[1] };
              }
            } catch (e) {
              // Ignore errors for individual folder metadata
            }
          })
        );
        setFolderMetadata(metadataMap);
      } else {
        setFolders([]);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
      setFolders([]);
    }
  };

  // One-time cleanup: Delete "Test Playlist" if it exists
  useEffect(() => {
    const cleanupTestPlaylist = async () => {
      if (hasDeletedTestPlaylist.current) return;
      hasDeletedTestPlaylist.current = true;

      try {
        const result = await deletePlaylistByName('Test Playlist');
        if (result) {
          console.log('Successfully deleted "Test Playlist"');
          // Reload playlists after deletion
          await loadPlaylists();
        }
      } catch (error) {
        console.error('Error deleting Test Playlist:', error);
        // Don't show error to user, just log it
      }
    };

    cleanupTestPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (playlists.length > 0) {
      loadPreviews(playlists);
    }
  }, [playlists]);

  const loadPreviews = async () => {
    try {
      const batchedPreviews = await getAllPlaylistItemsPreviews(4);
      if (batchedPreviews && Object.keys(batchedPreviews).length > 0) {
        setPlaylistPreviewVideos(batchedPreviews);
      }
    } catch (e) {
      console.error("Failed to load batched previews", e);
    }
  };

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading playlists from database...');

      // Load playlists, metadata, and video progress in parallel
      const [data, metadataList, allProgress] = await Promise.all([
        getAllPlaylists(),
        getAllPlaylistMetadata().catch(e => {
          console.error("Failed to load metadata", e);
          return [];
        }),
        getAllVideoProgress().catch(e => {
          console.error("Failed to load video progress", e);
          return [];
        })
      ]);

      console.log('Loaded playlists:', data);

      // Create a map for quick progress lookup: video_id -> last_updated
      const progressMap = new Map();
      if (Array.isArray(allProgress)) {
        allProgress.forEach(p => {
          if (p.video_id && p.last_updated) {
            progressMap.set(p.video_id, p.last_updated);
          }
        });
      }

      // Ensure data is an array
      if (Array.isArray(data)) {
        setPlaylists(data);
        setAllPlaylists(data);
        usePlaylistGroupStore.getState().cleanStalePlaylistIds(data.map(p => p.id));

        // Process metadata
        const thumbnailMap = {};
        const recentVideoMap = {};
        const itemCountMap = {};

        // Metadata list is an array of objects
        const metadataMap = new Map();
        if (Array.isArray(metadataList)) {
          metadataList.forEach(m => metadataMap.set(m.playlist_id, m));
        }

        for (const playlist of data) {
          const meta = metadataMap.get(playlist.id);

          // Item Count
          itemCountMap[playlist.id] = meta ? meta.count : 0;

          // Thumbnail
          if (playlist.custom_thumbnail_url) {
            thumbnailMap[playlist.id] = {
              max: playlist.custom_thumbnail_url,
              standard: playlist.custom_thumbnail_url
            };
          } else if (meta && meta.first_video) {
            const vid = meta.first_video;
            thumbnailMap[playlist.id] = {
              max: vid.thumbnail_url?.replace(/name=[a-z]+/, 'name=large') || getThumbnailUrl(vid.video_id, 'max'),
              standard: vid.thumbnail_url?.replace(/name=[a-z]+/, 'name=medium') || getThumbnailUrl(vid.video_id, 'standard')
            };
          }

          // Recent Video
          // The backend now provides 'recent_video' based on DB query
          if (meta && meta.recent_video) {
            recentVideoMap[playlist.id] = meta.recent_video;
          }
        }

        setPlaylistThumbnails(thumbnailMap);
        setPlaylistRecentVideos(recentVideoMap);
        setPlaylistItemCounts(itemCountMap);
      } else {
        console.warn('getAllPlaylists returned non-array data:', data);
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
      setError(error.message || 'Failed to load playlists from database');
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="px-8 pt-8">
          {/* Skeleton Banner */}
          <div className="w-full h-64 bg-slate-800/30 rounded-xl animate-pulse mb-8" />
        </div>
        <div className="grid grid-cols-2 gap-4 px-8 pb-8 items-start">
          {[...Array(6)].map((_, i) => (
            <PlaylistCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <p className="text-red-400 text-lg">Error loading playlists</p>
        <p className="text-slate-400 text-sm">{error}</p>
        <button
          onClick={loadPlaylists}
          className="px-4 py-2 bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
          style={{ color: '#052F4A' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-lg" style={{ color: '#052F4A' }}>No playlists found. Create one to get started!</p>
      </div>
    );
  }

  const handleUploadComplete = async () => {
    try {
      setShowUploader(false);
      setUploaderInitialPlaylistId(null);
      await loadPlaylists(); // Reload playlists after upload
    } catch (error) {
      console.error('Error reloading playlists after upload:', error);
      // Still close the uploader even if reload fails
      setShowUploader(false);
    }
  };

  const handleBulkImportComplete = async () => {
    try {
      setShowBulkImporter(false);
      await loadPlaylists(); // Reload playlists after bulk import
      if (showColoredFolders) {
        await loadFolders();
      }
    } catch (error) {
      console.error('Error reloading playlists after bulk import:', error);
      // Still close the bulk importer even if reload fails
      setShowBulkImporter(false);
    }
  };

  const handleLocalVideoUploadComplete = async () => {
    try {
      setShowLocalVideoUploader(false);
      setSelectedPlaylistForLocalUpload(null);
      await loadPlaylists(); // Reload playlists after local video upload
    } catch (error) {
      console.error('Error reloading playlists after local video upload:', error);
      // Still close the uploader even if reload fails
      setShowLocalVideoUploader(false);
      setSelectedPlaylistForLocalUpload(null);
    }
  };

  const handleOpenLocalVideoUploader = () => {
    if (playlists.length === 0) {
      alert('Please create a playlist first before adding local videos.');
      return;
    }
    // If only one playlist, use it directly
    if (playlists.length === 1) {
      setSelectedPlaylistForLocalUpload(playlists[0].id);
      setShowLocalVideoUploader(true);
    } else {
      // Show playlist selector modal
      setShowPlaylistSelector(true);
    }
  };

  const handlePlaylistSelected = (playlistId) => {
    setSelectedPlaylistForLocalUpload(playlistId);
    setShowPlaylistSelector(false);
    setShowLocalVideoUploader(true);
  };

  const handleDeletePlaylist = async (playlistId, playlistName, e) => {
    e.stopPropagation(); // Prevent triggering the playlist click

    try {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${playlistName}"?\n\nThis will permanently delete the playlist and all its videos.`
      );

      if (!confirmed) return;

      setDeletingPlaylistId(playlistId);

      try {
        await deletePlaylist(playlistId);

        // If the deleted playlist was the current one, clear the playlist items
        if (currentPlaylistItems.length > 0) {
          setPlaylistItems([]);
        }

        // Reload playlists
        await loadPlaylists();
      } catch (deleteError) {
        console.error('Failed to delete playlist:', deleteError);
        const errorMessage = deleteError?.message || deleteError?.toString() || 'Unknown error';
        alert(`Failed to delete playlist: ${errorMessage}`);
      } finally {
        setDeletingPlaylistId(null);
      }
    } catch (error) {
      console.error('Error in delete handler:', error);
      setDeletingPlaylistId(null);
      // Don't show alert for user cancellation
      if (error.name !== 'AbortError' && !error.message?.includes('cancel')) {
        alert(`An error occurred: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleExportPlaylist = async (playlistId, playlistName) => {
    setUploaderInitialPlaylistId(playlistId);
    setShowUploader(true);
  };

  const togglePlaylistExpand = async (playlistId) => {
    const isExpanded = expandedPlaylists.has(playlistId);

    if (isExpanded) {
      // Collapse: remove from expanded set
      setExpandedPlaylists(prev => {
        const newSet = new Set(prev);
        newSet.delete(playlistId);
        return newSet;
      });
    } else {
      // Expand: add to expanded set and load folders
      setExpandedPlaylists(prev => new Set(prev).add(playlistId));

      // Load folders for this playlist if not already loaded
      if (!playlistFolders[playlistId] || playlistFolders[playlistId].length === 0) {
        try {
          const folders = await getFoldersForPlaylist(playlistId);
          const folderArray = folders || [];
          console.log(`Loaded ${folderArray.length} folders for playlist ${playlistId}`);

          setPlaylistFolders(prev => ({
            ...prev,
            [playlistId]: folderArray
          }));
        } catch (error) {
          console.error(`Failed to load folders for playlist ${playlistId}:`, error);
          setPlaylistFolders(prev => ({
            ...prev,
            [playlistId]: []
          }));
        }
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-950">
      {/* Blurred App Banner Background System */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bannerImage})`,
            backgroundPosition: `${bannerHorizontal}% ${bannerVertical}%`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: `${bannerScale}vw auto`,
            filter: 'blur(36px)',
            transform: 'scale(1.25)',
            opacity: 0.85,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* Main Page Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
      {showBulkImporter ? (
        <BulkPlaylistImporter
          onImportComplete={handleBulkImportComplete}
          onCancel={() => setShowBulkImporter(false)}
          prismPage={prismPage}
        />
      ) : showUploader ? (
        <div className="flex-1 overflow-y-auto p-4 bg-transparent">
          <PlaylistUploader
            onUploadComplete={handleUploadComplete}
            onCancel={() => {
              setShowUploader(false);
              setUploaderInitialPlaylistId(null);
            }}
            prismPage={prismPage}
            initialPlaylistId={uploaderInitialPlaylistId}
          />
        </div>
      ) : showPlaylistSelector ? (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#052F4A' }}>Select Playlist</h3>
              <button
                onClick={() => setShowPlaylistSelector(false)}
                className="text-slate-400 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#052F4A'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(148 163 184)'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-300 text-sm mb-4">Choose a playlist to add local videos to:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handlePlaylistSelected(playlist.id)}
                  className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-transparent hover:border-sky-500"
                >
                  <div className="font-medium" style={{ color: '#052F4A' }}>{playlist.name}</div>
                  {playlist.description && (
                    <div className="text-slate-400 text-xs mt-1 line-clamp-1">{playlist.description}</div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPlaylistSelector(false)}
              className="w-full px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              style={{ color: '#052F4A' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : showLocalVideoUploader ? (
        <div className="flex-1 overflow-y-auto p-4 bg-transparent">
          <LocalVideoUploader
            playlistId={selectedPlaylistForLocalUpload}
            onUploadComplete={handleLocalVideoUploadComplete}
            onCancel={() => {
              setShowLocalVideoUploader(false);
              setSelectedPlaylistForLocalUpload(null);
            }}
          />
        </div>
      ) : (
        <>


          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pt-0 overflow-x-hidden bg-transparent relative">
            <PlaylistBar
              playlists={playlists}
              onAddClick={() => setShowPlaylistUploader(true)}
              groupColorIds={playlistGroups.filter((g) => (g.page || 1) === prismPage).map((g) => g.folderColorId).filter(Boolean)}
              allPlaylistCount={effectiveAllCount}
              unsortedCount={effectiveUnsortedCount}
              selectedFolder={selectedPrismFolder}
              onFolderSelect={setSelectedPrismFolder}
              currentPage={prismPage}
              totalPages={totalPrismPages}
              onPrevPage={() => setPrismPage(p => Math.max(1, p - 1))}
              onNextPage={() => setPrismPage(p => Math.min(totalPrismPages, p + 1))}
              onAddPage={() => { setGlobalTotalPages(totalPrismPages + 1); setPrismPage(totalPrismPages + 1); }}
              sortBy={playlistSortBy}
              setSortBy={setPlaylistSortBy}
              sortDirection={playlistSortDirection}
              setSortDirection={setPlaylistSortDirection}
              showHidden={showHiddenPlaylists}
              setShowHidden={setShowHiddenPlaylists}
              contentFilter={playlistContentFilter}
              setContentFilter={setPlaylistContentFilter}
            />

            <div className="px-4 pt-4 pb-8">
              {(() => {
                const activeGroup = (selectedPrismFolder !== null && selectedPrismFolder !== 'unsorted')
                  ? getGroupByColorId(selectedPrismFolder, prismPage)
                  : null;

                if (displayPlaylists.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <p className="text-lg font-medium">No playlists found in this folder</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-6">
                    {displayPlaylists.map((playlist) => {
                      const thumbData = playlistThumbnails[playlist.id];
                      const playlistImageKey = `playlist-${playlist.id}`;
                      const useFallback = imageLoadErrors.has(playlistImageKey);
                      const combined = combinedPreviewItems[playlist.id] || [];
                      const firstItem = combined[0];
                      let activeThumbnailUrl = thumbData ? (useFallback ? thumbData.standard : thumbData.max) : null;
                      if (!playlist.custom_thumbnail_url && firstItem) {
                        if (firstItem.isOrb && firstItem.customOrbImage) activeThumbnailUrl = firstItem.customOrbImage;
                        else if (firstItem.isBannerPreset) activeThumbnailUrl = firstItem.splitscreenBanner?.image || firstItem.customBannerImage || firstItem.fullscreenBanner?.image || firstItem.image || null;
                      }
                      const videoCount = playlistItemCounts[playlist.id] || 0;
                      const orbCount = combined.filter((i) => i.isOrb).length;
                      const bannerCount = combined.filter((i) => i.isBannerPreset).length;
                      const itemCount = videoCount + orbCount + bannerCount;
                      const folders = playlistFolders[playlist.id] || [];
                      const initialPreviewVideos = combined;
                      return (
                        <LongPlaylistCard
                          key={playlist.id}
                          playlist={playlist}
                          folders={folders}
                          activeThumbnailUrl={activeThumbnailUrl}
                          itemCount={itemCount}
                          videoCount={videoCount}
                          orbCount={orbCount}
                          bannerCount={bannerCount}
                          initialPreviewVideos={initialPreviewVideos}
                          globalInfoToggle={globalInfoToggle}
                          folderMetadata={folderMetadata}
                          deletingPlaylistId={deletingPlaylistId}
                          expandedPlaylists={expandedPlaylists}
                          onVideoSelect={onVideoSelect}
                          togglePlaylistExpand={togglePlaylistExpand}
                          handleExportPlaylist={handleExportPlaylist}
                          handleDeletePlaylist={handleDeletePlaylist}
                          loadPlaylists={loadPlaylists}
                          onAssignToGroupClick={() => setAssignToGroupPlaylistId(playlist.id)}
                          onEnterFromGroup={() => setActiveGroupId(activeGroup ? activeGroup.id : null)}
                          onFolderModeToggle={() => setOpenFolderListIds(new Set([playlist.id]))}
                        />
                      );
                    })}
                  </div>
                );
              })()}

              {/* New carousel button - below carousels on GROUPS view (hidden when viewing Unsorted grid) */}
              {selectedPrismFolder !== 'unsorted' && selectedPrismFolder !== null && (
                <div className="mt-4 mb-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const nextColorId = getNextAvailableColorId(prismPage);
                      if (nextColorId) {
                        const color = FOLDER_COLORS.find((c) => c.id === nextColorId);
                        addGroup(color?.name ?? 'New carousel', nextColorId, prismPage);
                      } else {
                        window.alert('All 16 colored folders on this page already hold an assigned carousel. Double click the page number in the playlist bar to create a new page.');
                      }
                    }}
                    className="rounded-xl border-2 border-dashed border-slate-400 text-slate-500 hover:border-sky-500 hover:text-sky-500 hover:bg-sky-500/5 px-6 py-4 font-medium text-sm uppercase tracking-wide transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New carousel
                  </button>
                </div>
              )}


            </div>

            {/* Pagination Controls & Up Arrow - Centered at bottom (hidden when viewing single colored folder carousel) */}
            {!(selectedPrismFolder !== 'unsorted' && selectedPrismFolder !== null) && (
              <div className="flex flex-col items-center justify-center py-8 gap-6">

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 bg-slate-900/60 rounded-full px-4 py-2 border border-white/10 backdrop-blur-md shadow-lg">
                    <button
                      onClick={() => {
                        setCurrentPage(Math.max(1, currentPage - 1));
                        if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                          if (currentPage > 3) {
                            pageNum = currentPage - 2 + i;
                          }
                          if (pageNum > totalPages) {
                            pageNum = totalPages - 4 + i;
                          }
                        }

                        if (pageNum < 1) pageNum = i + 1;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${currentPage === pageNum
                              ? 'bg-sky-500 text-white shadow-lg scale-110'
                              : 'text-slate-400 hover:bg-white/10 hover:text-white'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPage(Math.min(totalPages, currentPage + 1));
                        if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Up Arrow */}
                <div className="flex items-center gap-4">
                  <button
                    ref={arrowButtonRef}
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        scrollToTop();
                      }
                    }}
                    className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-all border border-white/10 hover:border-sky-500/50 shadow-lg hover:shadow-sky-500/25"
                    title="Scroll to top"
                  >
                    <ChevronUp size={24} />
                  </button>
                  <div className="text-slate-400 font-medium text-lg w-64 truncate">
                    {centeredPlaylistName || "Scroll to browse"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )
      }
      {/* Vertical Folder Column Overlay */}
      {
        (() => {
          const activeListId = Array.from(openFolderListIds)[0];
          if (!activeListId) return null;

          const playlist = playlists.find(p => p.id === activeListId);
          if (!playlist) return null;

          const folders = playlistFolders[playlist.id] || [];

          return (
            <PlaylistFolderColumn
              playlist={playlist}
              folders={folders}
              cardRect={true} // Force render since we're centering
              onClose={() => setOpenFolderListIds(new Set())}
              onFolderSelect={async (folder) => {
                try {
                  const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                  if (items.length === 0) return;

                  const playlistImageKey = `playlist-${folder.playlist_id}`;
                  const targetVideo = items[0];
                  const thumbUrl = targetVideo.thumbnail_url || getThumbnailUrl(targetVideo.video_id, 'max');

                  setPreviewThumbnails(prev => ({
                    ...prev,
                    [playlistImageKey]: {
                      videoId: targetVideo.video_id,
                      url: thumbUrl,
                      videoUrl: targetVideo.video_url,
                      title: targetVideo.title,
                      isShuffled: true
                    }
                  }));

                  setPlaylistPreviewVideos(prev => ({
                    ...prev,
                    [folder.playlist_id]: items.slice(0, 4)
                  }));

                  setActiveFolderFilters(prev => ({
                    ...prev,
                    [folder.playlist_id]: folder.folder_color
                  }));

                  setOpenFolderListIds(new Set());
                } catch (error) {
                  console.error('Failed to load folder items:', error);
                }
              }}
              onStickyToggle={async (playlistId, folderColor) => {
                try {
                  const newStuckStatus = await toggleStuckFolder(playlistId, folderColor);
                  const folderKey = `${playlistId}:${folderColor}`;
                  setStuckFolders((prev) => {
                    const next = new Set(prev);
                    if (newStuckStatus) {
                      next.add(folderKey);
                    } else {
                      next.delete(folderKey);
                    }
                    return next;
                  });
                } catch (error) {
                  console.error('Failed to toggle stick folder:', error);
                }
              }}
              stuckFolders={stuckFolders}
              folderMetadata={folderMetadata}
            />
          );
        })()
      }

      {/* Assign to Group Carousel column overlay */}
      {assignToGroupPlaylistId != null && (() => {
        const playlist = playlists.find(p => p.id === assignToGroupPlaylistId);
        if (!playlist) return null;
        return (
          <PlaylistGroupColumn
            playlist={playlist}
            onClose={() => setAssignToGroupPlaylistId(null)}
            playlists={playlists}
            playlistThumbnails={playlistThumbnails}
            prismPage={prismPage}
          />
        );
      })()}

      </div>
    </div>
  );
};

export default PlaylistsPage;

