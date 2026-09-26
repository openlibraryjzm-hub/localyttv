import React, { useState, useRef, useEffect } from 'react';
import { FOLDER_COLORS } from '../utils/folderColors';
import { usePlaylistStore } from '../store/playlistStore';
import { Pen, Play, ChevronRight, ChevronLeft, RotateCcw, Clock, Pin, Sparkles, Info, Star, Search, Settings, Layers, Upload, Grid } from 'lucide-react';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import AudioVisualizer from './AudioVisualizer';
import useLongPress from '../hooks/useLongPress';

const DEFAULT_ORB_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23ffffff'/%3E%3Cpath d='M0 20 L20 0 L40 20 L20 40 Z' fill='none' stroke='rgba(0,0,0,0.12)' stroke-width='1'/%3E%3C/svg%3E";

// Sub-component for individual badge buttons to handle long-press correctly
const BadgeButton = ({ 
  onClick, 
  onLongPress, 
  onMouseEnter, 
  onMouseLeave, 
  className, 
  style, 
  title, 
  children 
}) => {
  const longPress = useLongPress(onLongPress, onClick);
  return (
    <button
      {...longPress}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onLongPress}
      className={className}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
};


import UnifiedBannerBackground from './UnifiedBannerBackground';
import { useConfigStore } from '../store/configStore';
import { usePaginationStore } from '../store/paginationStore';
import { useNavigationStore } from '../store/navigationStore';
import { useTabPresetStore } from '../store/tabPresetStore';

// Seeded random function for consistent random selection per page
const seededRandom = (seed) => {
    // Simple seeded random using a hash of the seed string
    let hash = 0;
    if (seed) {
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
    }
    // Convert to 0-1 range
    return (Math.abs(hash) % 10000) / 10000;
};

// Helper function to determine current page type from title
const getPageType = (title) => {
    if (!title) return null;
    const titleLower = title.toLowerCase();
    if (titleLower.includes('liked')) return 'likes';
    if (titleLower === 'history') return 'history';
    if (titleLower.includes('pinned')) return 'pins';
    if (titleLower === 'all' || titleLower.includes('all -')) return 'playlists';
    // Videos page or folder view
    return 'videos';
};

// Helper function to check if image matches current destination
const imageMatchesDestination = (image, pageType, folderColor) => {
    // If image has no destinations, it's available everywhere
    if (!image.destinations) return true;

    const { pages, folderColors } = image.destinations;

    // Check page match
    if (pages && pages.length > 0) {
        if (!pages.includes(pageType)) return false;
    }

    // Check folder color match
    if (folderColor) {
        if (folderColors && folderColors.length > 0) {
            if (!folderColors.includes(folderColor)) return false;
        }
    } else {
        // No folder color - if image requires specific folder colors, exclude it
        if (folderColors && folderColors.length > 0) return false;
    }

    return true;
};

// Helper function to select an image from a folder based on folder condition and destinations
const selectImageFromFolder = (folder, pageKey, pageType, folderColor) => {
    if (!folder || !folder.images || folder.images.length === 0) {
        return null;
    }

    // Filter images by destinations first
    const availableImages = folder.images.filter(img =>
        imageMatchesDestination(img, pageType, folderColor)
    );

    if (availableImages.length === 0) {
        // No images match destinations, return null
        return null;
    }

    // Default: use seeded random based on pageKey for consistency
    // Unless explicitly set to sequential (which we might support later)
    if (folder.condition !== 'sequential') {
        const seed = pageKey || `${Date.now()}-${Math.random()}`;
        const randomValue = seededRandom(seed);
        const randomIndex = Math.floor(randomValue * availableImages.length);
        return availableImages[randomIndex];
    }

    // Fallback: use first available image
    return availableImages[0];
};

const PageBanner = ({ title, description, folderColor, onEdit, videoCount, countLabel = 'Video', creationYear, author, avatar, continueVideo, onContinue, pinnedVideos = [], onPinnedClick, children, childrenPosition = 'right', topRightContent, seamlessBottom = false, playlistBadges, onPlaylistBadgeLeftClick, onPlaylistBadgeRightClick, allPlaylists, filteredPlaylist, customDescription, onNavigateNext, onNavigatePrev, onReturn, showReturnButton, currentPlaylistId, showAscii = true, orbControls, customLeftContent, onFolderNavigatePrev, onFolderNavigateNext, selectedFolder, folderCounts }) => {
    // Pagination store for page navigator
    const {
        currentPage: paginationPage,
        totalPages,
        setCurrentPagePreserveScroll: setPaginationPage,
        nextPagePreserve: nextPage,
        prevPagePreserve: prevPage,
        nextQuarterPreserve: nextQuarter,
        prevQuarterPreserve: prevQuarter,
        firstPagePreserve: firstPage,
        lastPagePreserve: lastPage,
    } = usePaginationStore();

    const { currentPage: currentNavPage } = useNavigationStore();
    const { currentPlaylistItems, currentVideoIndex } = usePlaylistStore();

    // Local state for page editing
    const [isEditingPageLocal, setIsEditingPageLocal] = useState(false);
    const [pageInputValueLocal, setPageInputValueLocal] = useState('');
    const pageInputRef = useRef(null);

    // Banner view mode: 'avatar' (ASCII art) or 'tabs' (tab presets)
    const [bannerViewMode, setBannerViewMode] = useState(() => {
        const saved = localStorage.getItem('playlistsBanner_viewMode');
        return saved || 'avatar';
    });
    const {
        pageBannerBgColor, setBannerHeight,
        customPageBannerImage2, pageBannerImage2Scale, pageBannerImage2XOffset, pageBannerImage2YOffset,
        userAvatar,
        layer2Folders,
        playlistLayer2Overrides,
        themeFolderId,
        themeGroupLeaderId,
        themeGroupLeaderFolderId,
        orbFavorites,
        // Orb Config
        isVisualizerEnabled,
        orbSize,
        orbImageScale, orbImageScaleW, orbImageScaleH, orbImageXOffset, orbImageYOffset,
        isSpillEnabled, orbSpill, orbAdvancedMasks, orbMaskRects,
        customOrbImage
    } = useConfigStore();

    const { presets, activePresetId, setActivePreset } = useTabPresetStore();

    // Create a page key that changes when entering a new page or folder
    // This ensures random selection is consistent for the same page but different for different pages
    const pageKey = React.useMemo(() => {
        return `${currentPlaylistId || 'no-playlist'}-${folderColor || 'no-folder'}-${title || 'no-title'}`;
    }, [currentPlaylistId, folderColor, title]);

    // Orb State & Logic
    const fileInputRef = useRef(null);

    // Helper to calculate effective orb image (mirroring PlayerController logic)
    const getEffectiveOrb = () => {
        // 1. Identify Playlist
        let playlistName = null;
        if (currentPlaylistId) {
            if (allPlaylists) {
                const p = allPlaylists.find(p => String(p.id) === String(currentPlaylistId));
                if (p) playlistName = p.name;
            }
            if (!playlistName && title && title !== 'Playlist') {
                playlistName = title;
            }
        }

        if (!playlistName) return null;

        // 2. Check Orb Group Override
        const orbGroup = orbFavorites?.find(f =>
            f.playlistIds &&
            (f.playlistIds.includes(playlistName) || (currentPlaylistId && f.playlistIds.includes(String(currentPlaylistId))))
        );

        if (orbGroup) {
            // Collect group images
            let images = [orbGroup];
            if (orbGroup.groupMembers) {
                orbGroup.groupMembers.forEach(mid => {
                    const m = orbFavorites.find(x => x.id === mid);
                    if (m) images.push(m);
                });
            }
            // Filter by Folder Color
            if (folderColor && folderColor !== 'all' && folderColor !== 'unsorted') {
                images = images.filter(img => img.folderColors && img.folderColors.includes(folderColor));
            }
            if (images.length > 0) {
                const seed = pageKey || String(currentPlaylistId || 'default');
                const randomValue = seededRandom(seed);
                const idx = Math.floor(randomValue * images.length);
                const selected = images[idx];
                if (selected && selected.customOrbImage) {
                    return {
                        image: selected.customOrbImage,
                        scale: selected.orbImageScale || 1, // Store uses 1.0 based scale for orb
                        xOffset: selected.orbImageXOffset || 0,
                        yOffset: selected.orbImageYOffset || 0
                    };
                }
            }
        }
        return null; // Fallback to global
    };

    const effectiveOrbParams = React.useMemo(() => getEffectiveOrb(), [currentPlaylistId, allPlaylists, title, orbFavorites, folderColor, pageKey]);

    // Determine source
    const orbSrc = effectiveOrbParams?.image || customOrbImage;
    // Fallback to active video thumbnail if no orb image is set, to ensure something shows
    const finalOrbSrc = orbSrc || DEFAULT_ORB_IMAGE;

    // Determine config
    const displayScale = effectiveOrbParams ? effectiveOrbParams.scale : (orbImageScale || 1);
    const displayX = effectiveOrbParams ? effectiveOrbParams.xOffset : (orbImageXOffset || 0);
    const displayY = effectiveOrbParams ? effectiveOrbParams.yOffset : (orbImageYOffset || 0);

    const handleOrbImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && orbControls?.onImageUpload) {
            // Use passed prop if available (likely from parent page like OrbPage)
            // But for simple upload, we might need a store action or local state if not provided
            // If orbControls provides logic, use it.
            // Otherwise, PageBanner doesn't have setCustomOrbImage from store exposed directly?
            // Actually I imported setCustomOrbImage? No, I didn't add it to destructuring.
            // If orbControls is present, use it.
            orbControls.onImageUpload(e);
        }
    };

    const activePreset = presets.find(p => p.id === activePresetId) || presets[0];

    // Determine current page type for destination matching
    const pageType = React.useMemo(() => getPageType(title), [title]);

    // Per-Playlist Layer 2 Image Selection
    // Priority order:
    // 1. Settings page (no currentPlaylistId): Uses global customPageBannerImage2 with global scale/offset (highest priority for preview)
    // 2. Theme Group Leader: App-wide theme group leader (applies to all pages) - NEW
    // 3. Theme folder: App-wide theme folder (applies to all pages) - Legacy
    // 4. Playlist override: Per-playlist override (takes precedence over theme for that playlist)
    // 5. Default folder: First image from Default folder as fallback
    const getEffectiveLayer2Image = () => {
        // Settings page case: No playlist context, use global values for live preview (highest priority for preview)
        if (!currentPlaylistId) {
            if (customPageBannerImage2) {
                return {
                    image: customPageBannerImage2,
                    scale: pageBannerImage2Scale,
                    xOffset: pageBannerImage2XOffset,
                    yOffset: pageBannerImage2YOffset,
                    imageId: null, // Global, not from a saved image
                    folderId: null
                };
            }
            return null;
        }

        // Videos page case: Check for playlist-specific override (takes precedence over theme and folder assignments)

        console.log('[PageBanner] Checking overrides:', {
            folderColor,
            currentPlaylistId,
            compositeKey: folderColor ? `${currentPlaylistId}:${folderColor}` : null,
            overrideAvailable: folderColor ? !!playlistLayer2Overrides[`${currentPlaylistId}:${folderColor}`] : false,
            overrides: Object.keys(playlistLayer2Overrides)
        });

        // 1. Check for Specific Folder Override (if inside a folder)
        if (folderColor && playlistLayer2Overrides[`${currentPlaylistId}:${folderColor}`]) {
            const override = playlistLayer2Overrides[`${currentPlaylistId}:${folderColor}`];
            console.log('[PageBanner] Found Specific Override:', override);
            // Folder overrides are typically custom uploads, so we use stored values directly
            // But we can keep the library lookup logic if we eventually support picking from library for folders too
            return {
                image: override.image,
                scale: override.scale,
                xOffset: override.xOffset,
                yOffset: override.yOffset,
                imageId: override.imageId,
                folderId: override.folderId,
                bgColor: override.bgColor
            };
        }

        // 2. Check for General Playlist Override
        if (playlistLayer2Overrides[currentPlaylistId]) {
            const override = playlistLayer2Overrides[currentPlaylistId];
            // Look up the CURRENT image from the library to get latest values
            const folder = layer2Folders?.find(f => f.id === override.folderId);
            const libraryImage = folder?.images?.find(img => img.id === override.imageId);

            if (libraryImage) {
                // Use latest values from library (live updates from Settings)
                return {
                    image: libraryImage.image,
                    scale: libraryImage.scale,
                    xOffset: libraryImage.xOffset,
                    yOffset: libraryImage.yOffset,
                    imageId: libraryImage.id,
                    folderId: override.folderId,
                    bgColor: libraryImage.bgColor
                };
            }
            // Fallback to stored values if image was deleted from library or is a custom upload
            return {
                image: override.image,
                scale: override.scale,
                xOffset: override.xOffset,
                yOffset: override.yOffset,
                imageId: override.imageId,
                folderId: override.folderId,
                bgColor: override.bgColor
            };
        }

        // Check for Playlist Override (Orb Group or Layer 2 Folder)
        // Checks if the current playlist is assigned to a specific Orb Group or Layer 2 Folder.
        // This OVERRIDES the global theme logic.
        if (currentPlaylistId) {
            // Priority 1: Accurate Name Lookup via ID (if allPlaylists is available)
            let currentPlaylistName = null;
            if (allPlaylists && allPlaylists.length > 0) {
                const currentPlaylist = allPlaylists.find(p => p.id === currentPlaylistId);
                if (currentPlaylist) {
                    currentPlaylistName = currentPlaylist.name;
                }
            }

            // Priority 2: Fallback to title prop
            if (!currentPlaylistName && title && title !== 'Playlist') {
                currentPlaylistName = title;
            }

            if (currentPlaylistName) {
                // --- 1. ORB GROUP OVERRIDE (HIGHEST PRIORITY) ---
                const playlistOrbLeader = orbFavorites?.find(f =>
                    f.playlistIds &&
                    (f.playlistIds.includes(currentPlaylistName) || (currentPlaylistId && f.playlistIds.includes(currentPlaylistId)))
                );

                if (playlistOrbLeader) {
                    // 1. Collect all images in group (Leader + Members)
                    let groupImages = [playlistOrbLeader];
                    if (playlistOrbLeader.groupMembers) {
                        playlistOrbLeader.groupMembers.forEach(memberId => {
                            const member = orbFavorites.find(m => m.id === memberId);
                            if (member) groupImages.push(member);
                        });
                    }

                    // 2. Filter by Folder Color (if active)
                    if (folderColor && folderColor !== 'all' && folderColor !== 'unsorted') {
                        groupImages = groupImages.filter(img => img.folderColors && img.folderColors.includes(folderColor));
                    }

                    // 3. Select Image
                    if (groupImages.length > 0) {
                        // Random selection using pageKey
                        const seed = pageKey || `${Date.now()}`;
                        const randomValue = seededRandom(seed);
                        const randomIndex = Math.floor(randomValue * groupImages.length);
                        const selected = groupImages[randomIndex];

                        if (selected.customOrbImage) {
                            return {
                                image: selected.customOrbImage,
                                scale: selected.orbImageScale || 100,
                                xOffset: selected.orbImageXOffset || 0,
                                yOffset: selected.orbImageYOffset || 0,
                                imageId: selected.id,
                                folderId: `orb-group-${playlistOrbLeader.id}`,
                                bgColor: null
                            };
                        }
                    }
                }

                // --- 2. LAYER 2 FOLDER OVERRIDE (STANDARD FOLDERS) ---
                const playlistFolder = layer2Folders?.find(f => f.playlistIds && f.playlistIds.includes(currentPlaylistName));

                if (playlistFolder && playlistFolder.images?.length > 0) {
                    // Check for color assignment within this playlist folder first
                    let assignedImageId = null;
                    if (folderColor && playlistFolder.colorAssignments?.[folderColor]) {
                        assignedImageId = playlistFolder.colorAssignments[folderColor];
                    } else if (!folderColor) {
                        // Check for Unsorted or All assignments
                        if (title === 'Unsorted Videos' && playlistFolder.colorAssignments?.['unsorted']) {
                            assignedImageId = playlistFolder.colorAssignments['unsorted'];
                        } else if (title !== 'Unsorted Videos' && playlistFolder.colorAssignments?.['all']) {
                            assignedImageId = playlistFolder.colorAssignments['all'];
                        }
                    }

                    if (assignedImageId) {
                        const assignedImage = playlistFolder.images.find(i => i.id === assignedImageId);
                        if (assignedImage) {
                            return {
                                image: assignedImage.image,
                                scale: assignedImage.scale,
                                xOffset: assignedImage.xOffset,
                                yOffset: assignedImage.yOffset,
                                imageId: assignedImage.id,
                                folderId: playlistFolder.id,
                                bgColor: assignedImage.bgColor
                            };
                        }
                    }

                    // Select random/first image from this playlist folder
                    const overrideImage = selectImageFromFolder(playlistFolder, pageKey, pageType, folderColor);
                    if (overrideImage) {
                        return {
                            image: overrideImage.image,
                            scale: overrideImage.scale,
                            xOffset: overrideImage.xOffset,
                            yOffset: overrideImage.yOffset,
                            imageId: overrideImage.id,
                            folderId: playlistFolder.id,
                            bgColor: overrideImage.bgColor
                        };
                    }
                }
            }
        }



        // Check for specific Color Assignment in the Active Theme
        // This takes priority when a colored folder is selected
        // BUT ONLY if there isn't a playlist-specific override that has already handled it.
        // Since the block above returns if an override is found, we don't need explicit skipping logic here.
        if (themeGroupLeaderFolderId || themeFolderId) {
            // Determine active theme folder
            let activeThemeFolder = null;
            if (themeGroupLeaderFolderId) {
                activeThemeFolder = layer2Folders?.find(f => f.id === themeGroupLeaderFolderId);
            } else if (themeFolderId) {
                activeThemeFolder = layer2Folders?.find(f => f.id === themeFolderId);
            }

            if (activeThemeFolder) {
                // Check for assignment (Color, Unsorted, or All)
                let assignedImageId = null;
                if (folderColor && activeThemeFolder.colorAssignments?.[folderColor]) {
                    assignedImageId = activeThemeFolder.colorAssignments[folderColor];
                } else if (!folderColor) {
                    if (title === 'Unsorted Videos' && activeThemeFolder.colorAssignments?.['unsorted']) {
                        assignedImageId = activeThemeFolder.colorAssignments['unsorted'];
                    } else if (title !== 'Unsorted Videos' && activeThemeFolder.colorAssignments?.['all']) {
                        assignedImageId = activeThemeFolder.colorAssignments['all'];
                    }
                }

                if (assignedImageId) {
                    const assignedImage = activeThemeFolder.images?.find(i => i.id === assignedImageId);

                    if (assignedImage) {
                        return {
                            image: assignedImage.image,
                            scale: assignedImage.scale,
                            xOffset: assignedImage.xOffset,
                            yOffset: assignedImage.yOffset,
                            imageId: assignedImage.id,
                            folderId: activeThemeFolder.id,
                            bgColor: assignedImage.bgColor
                        };
                    }
                }
            }
        }

        // Check for theme group leader (app-wide theme) - NEW
        if (themeGroupLeaderId && themeGroupLeaderFolderId) {
            // Find the group leader image
            const groupLeaderFolder = layer2Folders?.find(f => f.id === themeGroupLeaderFolderId);
            const groupLeaderImage = groupLeaderFolder?.images?.find(img => img.id === themeGroupLeaderId);

            if (groupLeaderImage) {
                // Build array of all images in the group (leader + members)
                const groupImages = [];

                // Include the group leader itself if it matches destination
                if (imageMatchesDestination(groupLeaderImage, pageType, folderColor)) {
                    groupImages.push(groupLeaderImage);
                }

                // Add all group member images that match destination
                if (groupLeaderImage.groupMembers && groupLeaderImage.groupMembers.length > 0) {
                    groupLeaderImage.groupMembers.forEach((memberKey) => {
                        // Parse member key: "folderId:imageId"
                        const [memberFolderId, memberImageId] = memberKey.split(':');
                        const memberFolder = layer2Folders?.find(f => f.id === memberFolderId);
                        const memberImage = memberFolder?.images?.find(img => img.id === memberImageId);
                        if (memberImage) {
                            // Check if image matches destination
                            if (imageMatchesDestination(memberImage, pageType, folderColor)) {
                                groupImages.push(memberImage);
                            }
                        }
                    });
                }

                // If no images match destination, use all images in the group (ignore destination filtering for theme)
                if (groupImages.length === 0) {
                    // Include the group leader itself
                    groupImages.push(groupLeaderImage);

                    // Add all group member images
                    if (groupLeaderImage.groupMembers && groupLeaderImage.groupMembers.length > 0) {
                        groupLeaderImage.groupMembers.forEach((memberKey) => {
                            // Parse member key: "folderId:imageId"
                            const [memberFolderId, memberImageId] = memberKey.split(':');
                            const memberFolder = layer2Folders?.find(f => f.id === memberFolderId);
                            const memberImage = memberFolder?.images?.find(img => img.id === memberImageId);
                            if (memberImage) {
                                groupImages.push(memberImage);
                            }
                        });
                    }
                }

                if (groupImages.length > 0) {
                    // Select from group images (randomly based on pageKey for consistency)
                    const seed = pageKey || `${Date.now()}-${Math.random()}`;
                    const randomValue = seededRandom(seed);
                    const randomIndex = Math.floor(randomValue * groupImages.length);
                    const selectedImage = groupImages[randomIndex];

                    // Find the folder for the selected image
                    const selectedImageFolder = layer2Folders?.find(f =>
                        f.images?.some(img => img.id === selectedImage.id)
                    );

                    return {
                        image: selectedImage.image,
                        scale: selectedImage.scale,
                        xOffset: selectedImage.xOffset,
                        yOffset: selectedImage.yOffset,
                        imageId: selectedImage.id,
                        folderId: selectedImageFolder?.id || null,
                        bgColor: selectedImage.bgColor
                    };
                }
            }
        }

        // Check for theme folder (app-wide theme) - Legacy
        if (themeFolderId) {
            const themeFolder = layer2Folders?.find(f => f.id === themeFolderId && f.isThemeFolder);
            if (themeFolder && themeFolder.images?.length > 0) {
                // Select image based on folder condition and destinations (random, first, etc.)
                // pageKey ensures random selection is consistent for same page but different for different pages
                const themeImage = selectImageFromFolder(themeFolder, pageKey, pageType, folderColor);
                if (themeImage) {
                    return {
                        image: themeImage.image,
                        scale: themeImage.scale,
                        xOffset: themeImage.xOffset,
                        yOffset: themeImage.yOffset,
                        imageId: themeImage.id,
                        folderId: themeFolderId,
                        bgColor: themeImage.bgColor
                    };
                }
            }
        }



        // No override - use Default folder as fallback
        const defaultFolder = layer2Folders?.find(f => f.id === 'default');
        if (defaultFolder && defaultFolder.images?.length > 0) {
            // Select image based on folder condition and destinations (random, first, etc.)
            // pageKey ensures random selection is consistent for same page but different for different pages
            const defaultImage = selectImageFromFolder(defaultFolder, pageKey, pageType, folderColor);
            if (defaultImage) {
                return {
                    image: defaultImage.image,
                    scale: defaultImage.scale,
                    xOffset: defaultImage.xOffset,
                    yOffset: defaultImage.yOffset,
                    imageId: defaultImage.id,
                    folderId: 'default',
                    bgColor: defaultImage.bgColor // Include the image's paired background color
                };
            }
        }

        // No default images available
        return null;
    };

    // Memoize effective layer 2 image - pageKey ensures consistent random selection per page
    const effectiveLayer2 = React.useMemo(() => getEffectiveLayer2Image(), [pageKey, pageType, folderColor, themeFolderId, themeGroupLeaderId, themeGroupLeaderFolderId, currentPlaylistId, layer2Folders, playlistLayer2Overrides, customPageBannerImage2, pageBannerImage2Scale, pageBannerImage2XOffset, pageBannerImage2YOffset, allPlaylists, title, orbFavorites]);

    // Track image changes for smooth transitions
    const prevImageIdRef = useRef(null);
    const [imageOpacity, setImageOpacity] = useState(1);
    const [displayImage, setDisplayImage] = useState(null);
    const [displayImageConfig, setDisplayImageConfig] = useState(null);


    // Handle smooth image transitions with fade effect
    useEffect(() => {
        const currentImageId = effectiveLayer2?.imageId || effectiveLayer2?.image;

        if (currentImageId !== prevImageIdRef.current) {
            // Image is changing - fade out old, then fade in new
            if (prevImageIdRef.current !== null && displayImage) {
                // Fade out current image
                setImageOpacity(0);
                // After fade out completes, switch to new image and fade in
                const fadeTimer = setTimeout(() => {
                    setDisplayImage(effectiveLayer2?.image || null);
                    setDisplayImageConfig(effectiveLayer2);
                    // Small delay before fade in to ensure image is loaded
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setImageOpacity(1);
                        });
                    });
                    prevImageIdRef.current = currentImageId;
                }, 250); // Slightly more than half transition for smoother switch

                return () => clearTimeout(fadeTimer);
            } else {
                // First image or no previous image - set immediately with fade in
                setDisplayImage(effectiveLayer2?.image || null);
                setDisplayImageConfig(effectiveLayer2);
                setImageOpacity(0);
                requestAnimationFrame(() => {
                    setImageOpacity(1);
                });
                prevImageIdRef.current = currentImageId;
            }
        } else {
            // Same image - just update config in case settings changed
            if (displayImage !== effectiveLayer2?.image) {
                setDisplayImage(effectiveLayer2?.image || null);
            }
            setDisplayImageConfig(effectiveLayer2);
        }
    }, [effectiveLayer2, displayImage]);

    // Use displayed image with smooth opacity transition
    const effectiveLayer2Image = displayImage;
    const effectiveLayer2Scale = displayImageConfig?.scale ?? 100;
    const effectiveLayer2XOffset = displayImageConfig?.xOffset ?? 50;
    const effectiveLayer2YOffset = displayImageConfig?.yOffset ?? 50;
    const effectiveLayer2ImageId = displayImageConfig?.imageId || null;
    // Use per-playlist bgColor if available, otherwise fall back to global pageBannerBgColor
    const effectiveBgColor = displayImageConfig?.bgColor || effectiveLayer2?.bgColor || pageBannerBgColor;
    const [badgesExpanded, setBadgesExpanded] = useState(false);
    const badgesContainerRef = useRef(null);

    // Info display state - shows author/year/count in thumbnail area
    const [showInfo, setShowInfo] = useState(false);

    // Thumbnail carousel state (0 = continue, 1 = pinned, 2 = ascii)
    const [activeThumbnail, setActiveThumbnail] = useState(0);
    // Track which pinned video is selected (when viewing pinned)
    const [activePinnedIndex, setActivePinnedIndex] = useState(0);

    // Reset active thumbnail to default (Recent) when context changes (playlist/folder)
    useEffect(() => {
        setActiveThumbnail(0);
    }, [pageKey]);

    // Determine which options are available
    const hasContinue = !!continueVideo;
    const hasPinned = pinnedVideos && pinnedVideos.length > 0;
    const hasMultiplePins = pinnedVideos && pinnedVideos.length > 1;
    const hasAscii = showAscii && !!(avatar || userAvatar); // Use avatar prop first, then userAvatar from store, unless showAscii is false
    const displayAvatar = avatar || userAvatar; // The actual avatar to display - prioritize prop over store

    // Count available options for dot navigation
    const availableOptions = [];
    if (hasContinue) availableOptions.push('continue');
    if (hasPinned) availableOptions.push('pinned');
    if (hasAscii) availableOptions.push('ascii');
    const hasMultipleOptions = availableOptions.length > 1;
    const hasAnyOption = availableOptions.length > 0;

    // Get the active pinned video
    const activePinnedVideo = hasPinned ? pinnedVideos[activePinnedIndex] || pinnedVideos[0] : null;

    // Map activeThumbnail index to actual option type
    const getOptionAtIndex = (index) => availableOptions[index] || null;
    const currentOption = getOptionAtIndex(activeThumbnail);

    // Get the active video based on selection (null for ascii)
    const activeVideo = currentOption === 'continue' ? continueVideo : currentOption === 'pinned' ? activePinnedVideo : null;
    const activeLabel = currentOption === 'continue' ? 'CONTINUE?' : currentOption === 'pinned' ? 'PINNED' : 'SIGNATURE';
    const activeCallback = currentOption === 'continue' ? onContinue : currentOption === 'pinned' ? () => onPinnedClick && onPinnedClick(activePinnedVideo) : null;

    // Measure height for banner
    const bannerRef = React.useRef(null);

    React.useEffect(() => {
        if (!bannerRef.current) return;

        const updateDimensions = () => {
            const banner = bannerRef.current;
            if (!banner) return;
            setBannerHeight(banner.offsetHeight);
        };

        const observer = new ResizeObserver(updateDimensions);
        observer.observe(bannerRef.current);
        window.addEventListener('resize', updateDimensions);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateDimensions);
        };
    }, [setBannerHeight]);

    // Persist banner view mode to localStorage
    React.useEffect(() => {
        localStorage.setItem('playlistsBanner_viewMode', bannerViewMode);
    }, [bannerViewMode]);

    // Simple approach: show all badges, but limit height with CSS when collapsed
    const hasMoreBadges = playlistBadges && playlistBadges.length > 0;

    // Dynamic banner height based on expansion
    const bannerHeightClass = badgesExpanded && playlistBadges && playlistBadges.length > 0
        ? 'min-h-[220px]'
        : 'h-[220px]';

    return (
        <div className={`w-full flex items-start gap-0 ${seamlessBottom ? 'mb-0' : 'mb-8'}`}>
            {/* Banner Container - Shrunk to 332px (content only, no background/border) */}
            <div ref={bannerRef} className={`w-[332px] relative animate-fade-in group ${bannerHeightClass}`}>
                {/* Top Right Content */}
                {topRightContent && (
                    <div className="absolute top-4 right-4 z-30">
                        {topRightContent}
                    </div>
                )}

                {/* Content Container - Allow overflow for dropdowns */}
                <div className="relative z-10 flex items-start h-full gap-8 w-full px-8 pt-4">
                    <div className="flex flex-col justify-start min-w-0">

                        {showInfo && (customDescription ? (
                            <div className="mt-[7px] ml-[170px] max-h-[100px] overflow-y-auto">
                                {customDescription}
                            </div>
                        ) : description && (
                            <p className="text-sm md:text-base text-white/90 font-medium max-w-4xl leading-relaxed drop-shadow-sm opacity-90 line-clamp-6 mt-[7px] ml-[170px]" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8)' }}>
                                {description}
                            </p>
                        ))}

                        {/* Custom Left Content (e.g. Spill Editor for OrbPage) */}
                        {customLeftContent ? (
                            <div className="mt-1">
                                {customLeftContent}
                            </div>
                        ) : orbControls && (
                            <div className="mt-3 flex items-center gap-3">
                                {/* Orb Image Preview/Upload */}
                                <label className="relative w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden flex items-center justify-center bg-black/20 backdrop-blur-sm cursor-pointer group hover:border-white/50 transition-all">
                                    {orbControls.customOrbImage ? (
                                        <img src={orbControls.customOrbImage} alt="Orb" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-white/40 text-[10px] text-center p-1">No Image</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <span className="text-[9px] font-bold">Change</span>
                                    </div>
                                    <input
                                        type="file"
                                        onChange={orbControls.onImageUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </label>

                                {/* Spill Toggle */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        orbControls.onToggleSpill(e);
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border backdrop-blur-sm ${orbControls.isSpillEnabled
                                        ? 'bg-sky-500/90 border-sky-400 text-white shadow-md'
                                        : 'bg-white/10 border-white/20 text-white/70 hover:border-white/30 hover:text-white'
                                        }`}
                                >
                                    {orbControls.isSpillEnabled ? 'Spill On' : 'Spill Off'}
                                </button>

                                {/* Remove Image Button */}
                                {orbControls.customOrbImage && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            orbControls.onRemoveImage();
                                        }}
                                        className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition-all border border-rose-400/30 backdrop-blur-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Playlist Badges */}
                        {playlistBadges && playlistBadges.length > 0 && (
                            <div
                                ref={badgesContainerRef}
                                className={`flex flex-wrap items-center gap-2 mt-3 relative ${!badgesExpanded ? 'max-h-[72px] overflow-hidden' : ''}`}
                            >
                                {playlistBadges.map((playlistName, idx) => {
                                    // Check if this playlist is currently filtered
                                    const isFiltered = filteredPlaylist === playlistName;

                                    // Default sky color for badges, brighter when filtered
                                    const badgeBg = isFiltered
                                        ? 'rgba(14, 165, 233, 0.25)' // sky-500/25 when filtered
                                        : 'rgba(14, 165, 233, 0.1)'; // sky-500/10
                                    const badgeBorder = isFiltered
                                        ? 'rgba(14, 165, 233, 0.6)' // sky-500/60 when filtered
                                        : 'rgba(14, 165, 233, 0.3)'; // sky-500/30
                                    const badgeTextColor = '#38bdf8'; // sky-400
                                    const badgeHoverBg = 'rgba(14, 165, 233, 0.2)'; // sky-500/20
                                    const badgeHoverBorder = 'rgba(14, 165, 233, 0.5)'; // sky-500/50

                                    return (
                                        <BadgeButton
                                            key={idx}
                                            onClick={(e) => {
                                                if (e && e.stopPropagation) e.stopPropagation();
                                                if (onPlaylistBadgeLeftClick) {
                                                    onPlaylistBadgeLeftClick(e, playlistName);
                                                }
                                            }}
                                            onLongPress={(e) => {
                                                if (e && e.stopPropagation) e.stopPropagation();
                                                if (e && e.preventDefault) e.preventDefault();
                                                if (onPlaylistBadgeRightClick) {
                                                    onPlaylistBadgeRightClick(e, playlistName);
                                                }
                                            }}
                                            className="flex items-center gap-0.5 px-2 py-1 rounded-md border font-medium transition-all cursor-pointer"
                                            style={{
                                                backgroundColor: badgeBg,
                                                borderColor: badgeBorder,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = badgeHoverBg;
                                                e.currentTarget.style.borderColor = badgeHoverBorder;
                                                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = badgeBg;
                                                e.currentTarget.style.borderColor = badgeBorder;
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                            title={`Tap to filter | Long-press to navigate: ${playlistName}`}
                                        >
                                            <span className="line-clamp-1 text-sm md:text-base font-medium text-white/80" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.9)' }}>
                                                {playlistName}
                                            </span>
                                        </BadgeButton>
                                    );
                                })}

                                {/* Expand Button - Appears at end of second row when collapsed */}
                                {hasMoreBadges && !badgesExpanded && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setBadgesExpanded(true);
                                        }}
                                        className="absolute bottom-0 right-0 flex items-center gap-1 px-2 py-1 rounded-md border font-medium transition-all cursor-pointer z-10"
                                        style={{
                                            backgroundColor: 'rgba(14, 165, 233, 0.1)',
                                            borderColor: 'rgba(14, 165, 233, 0.3)',
                                            color: '#38bdf8',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)';
                                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        title={`Show all ${playlistBadges.length} playlists`}
                                    >
                                        <span className="text-sm" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.8)' }}>
                                            &gt;&gt;&gt;
                                        </span>
                                    </button>
                                )}
                                {/* Collapse Button - Shows when expanded */}
                                {hasMoreBadges && badgesExpanded && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setBadgesExpanded(false);
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 rounded-md border font-medium transition-all cursor-pointer"
                                        style={{
                                            backgroundColor: 'rgba(14, 165, 233, 0.1)',
                                            borderColor: 'rgba(14, 165, 233, 0.3)',
                                            color: '#38bdf8',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)';
                                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        title="Show less"
                                    >
                                        <span className="text-sm" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.8)' }}>
                                            Show less
                                        </span>
                                        <ChevronRight
                                            size={14}
                                            className="rotate-90 transition-transform"
                                            style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.8)' }}
                                        />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Bottom Content (e.g. Tabs) */}
                        {children && childrenPosition === 'bottom' && (
                            <div className="mt-4">
                                {children}
                            </div>
                        )}
                    </div>

                    {/* Right Content */}
                    {children && childrenPosition === 'right' && (
                        <div className="ml-auto pl-8">
                            {children}
                        </div>
                    )}
                </div>

                {/* Thumbnail/ASCII Section with Header - Continue/Pinned/ASCII with arrow navigation */}
                {hasAnyOption && (
                    <div className="absolute bottom-[25px] flex flex-col items-center z-20 group" style={{ left: '166px', transform: 'translateX(-50%)', height: '100%', justifyContent: 'flex-end' }}>

                        {/* Header - Playlist/Folder Name - Top aligned with banner */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 group/header" style={{ marginTop: '-1px' }}>
                            {(() => {
                                // Determine Header Styles
                                let bgStyle = { backgroundColor: '#ffffff' };
                                let textColor = 'text-black';
                                let chevronColor = 'text-black';
                                let gradientL = 'from-gray-200/80';
                                let gradientR = 'from-gray-200/80';

                                if (selectedFolder === 'unsorted') {
                                    bgStyle = { backgroundColor: '#000000' };
                                    textColor = 'text-white';
                                    chevronColor = 'text-white';
                                    gradientL = 'from-white/20';
                                    gradientR = 'from-white/20';
                                } else {
                                    const activeId = selectedFolder || folderColor;
                                    const colorInfo = activeId ? FOLDER_COLORS.find(c => c.id === activeId) : null;
                                    if (colorInfo) {
                                        bgStyle = { backgroundColor: colorInfo.hex };
                                        textColor = 'text-white';
                                        chevronColor = 'text-white';
                                        gradientL = 'from-black/20';
                                        gradientR = 'from-black/20';
                                    }
                                }

                                return (
                                    <div
                                        className="backdrop-blur-md rounded-lg px-4 pt-2 pb-[4px] border-2 border-black w-[320px] relative shadow-lg transition-colors duration-300"
                                        style={bgStyle}
                                    >
                                        <h2 className={`text-base font-black ${textColor} tracking-tight drop-shadow-sm whitespace-nowrap text-center`}>
                                            {currentNavPage === 'playlists' && currentOption === 'ascii' ? (activePreset?.name || 'All') : title}
                                        </h2>

                                        {/* Left navigation strip - Previous Playlist */}
                                        {onNavigatePrev && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigatePrev();
                                                }}
                                                className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r ${gradientL} to-transparent opacity-0 group-hover/header:opacity-100 hover:from-opacity-40 transition-all flex items-center justify-center rounded-l-lg`}
                                                title="Previous playlist"
                                            >
                                                <ChevronLeft size={20} className={chevronColor} strokeWidth={2.5} />
                                            </button>
                                        )}

                                        {/* Right navigation strip - Next Playlist */}
                                        {onNavigateNext && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigateNext();
                                                }}
                                                className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l ${gradientR} to-transparent opacity-0 group-hover/header:opacity-100 hover:from-opacity-40 transition-all flex items-center justify-center rounded-r-lg`}
                                                title="Next playlist"
                                            >
                                                <ChevronRight size={20} className={chevronColor} strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Fixed-width container for content - now 320px to match video cards */}
                        <div className="flex flex-col items-center relative">
                            {/* Content row with optional pin bar and preview stack */}
                            <div className="flex items-stretch gap-[2px] relative">
                                {/* Clickable content area */}
                                <div
                                    className={`flex flex-col items-center gap-2 flex-shrink-0 relative group/preview ${activeCallback && !showInfo ? 'cursor-pointer' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!showInfo && activeCallback) activeCallback();
                                    }}
                                >
                                    {/* Show thumbnail with info overlays when info button is clicked */}
                                    {showInfo && activeVideo ? (
                                        <div className="relative h-[180px] w-[320px] rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
                                            <img
                                                src={getThumbnailUrl(activeVideo.video_id, 'medium')}
                                                alt={activeVideo.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Info overlays - vertically aligned on right side */}
                                            {author && (
                                                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white font-semibold text-xs truncate max-w-[90%]" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                                                    {author}
                                                </span>
                                            )}
                                            {creationYear && (
                                                <span className="absolute top-1/2 right-1 -translate-y-1/2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white/90 font-medium text-xs">
                                                    {creationYear}
                                                </span>
                                            )}
                                            {videoCount !== undefined && (
                                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white/90 font-medium text-xs">
                                                    {videoCount} {videoCount === 1 ? countLabel : `${countLabel}s`}
                                                </span>
                                            )}
                                        </div>
                                    ) : showInfo && !activeVideo ? (
                                        <div className="h-[180px] w-[320px] flex flex-col items-center justify-center gap-1 rounded-lg bg-black/50 backdrop-blur-sm border-2 border-white/20 overflow-hidden px-2">
                                            {author && (
                                                <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white font-semibold text-sm truncate max-w-full" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                                                    {author}
                                                </span>
                                            )}
                                            {creationYear && (
                                                <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white/90 font-medium text-xs">
                                                    {creationYear}
                                                </span>
                                            )}
                                            {videoCount !== undefined && (
                                                <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white/90 font-medium text-xs">
                                                    {videoCount} {videoCount === 1 ? countLabel : `${countLabel}s`}
                                                </span>
                                            )}
                                        </div>
                                    ) : currentOption === 'ascii' ? (
                                        <div className="h-[180px] w-[320px] flex items-center justify-center relative group/orb z-0 overflow-visible">
                                            {/* SVG ClipPath Generator for Partial Spillover */}
                                            <svg width="0" height="0" className="absolute pointer-events-none">
                                                <defs>
                                                    <clipPath id="bannerOrbClipPath" clipPathUnits="objectBoundingBox">
                                                        <circle cx="0.5" cy="0.5" r="0.5" />
                                                        {isSpillEnabled && orbSpill.tl && (
                                                            orbAdvancedMasks?.tl
                                                                ? <rect x={orbMaskRects?.tl.x / 100} y={orbMaskRects?.tl.y / 100} width={orbMaskRects?.tl.w / 100} height={orbMaskRects?.tl.h / 100} />
                                                                : <rect x="-50" y="-50" width="50.5" height="50.5" />
                                                        )}
                                                        {isSpillEnabled && orbSpill.tr && (
                                                            orbAdvancedMasks?.tr
                                                                ? <rect x={orbMaskRects?.tr.x / 100} y={orbMaskRects?.tr.y / 100} width={orbMaskRects?.tr.w / 100} height={orbMaskRects?.tr.h / 100} />
                                                                : <rect x="0.5" y="-50" width="50.5" height="50.5" />
                                                        )}
                                                        {isSpillEnabled && orbSpill.bl && (
                                                            orbAdvancedMasks?.bl
                                                                ? <rect x={orbMaskRects?.bl.x / 100} y={orbMaskRects?.bl.y / 100} width={orbMaskRects?.bl.w / 100} height={orbMaskRects?.bl.h / 100} />
                                                                : <rect x="-50" y="0.5" width="50.5" height="50.5" />
                                                        )}
                                                        {isSpillEnabled && orbSpill.br && (
                                                            orbAdvancedMasks?.br
                                                                ? <rect x={orbMaskRects?.br.x / 100} y={orbMaskRects?.br.y / 100} width={orbMaskRects?.br.w / 100} height={orbMaskRects?.br.h / 100} />
                                                                : <rect x="0.5" y="0.5" width="50.5" height="50.5" />
                                                        )}
                                                    </clipPath>
                                                </defs>
                                            </svg>

                                            {/* Visualizer and Orb Wrapper - Scaled down slightly to fit better if needed, but trying 1.0 first */}
                                            <div className="flex items-center justify-center relative">
                                                <AudioVisualizer
                                                    enabled={isVisualizerEnabled}
                                                    isActive={false} // Static mode
                                                    orbSize={orbSize}
                                                    barCount={113}
                                                    barWidth={4}
                                                    radius={76}
                                                    radiusY={76}
                                                    maxBarLength={76}
                                                    minBarLength={7}
                                                    colors={[255, 255, 255, 255]}
                                                    updateRate={16}
                                                />
                                                <div
                                                    className={`rounded-full bg-sky-50 backdrop-blur-3xl shadow-2xl flex items-center justify-center transition-all relative overflow-visible z-20`}
                                                    style={{ width: `${orbSize}px`, height: `${orbSize}px` }}
                                                >
                                                    {/* IMAGE LAYER */}
                                                    <div className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center z-40" style={{ clipPath: 'url(#bannerOrbClipPath)', overflow: 'visible' }}>
                                                        <img
                                                            src={finalOrbSrc || DEFAULT_ORB_IMAGE}
                                                            alt="Orb"
                                                            className="max-w-none transition-all duration-500 bg-black/20"
                                                            style={{
                                                                width: isSpillEnabled ? `${orbSize * displayScale * orbImageScaleW}px` : '100%',
                                                                height: isSpillEnabled ? `${orbSize * displayScale * orbImageScaleH}px` : '100%',
                                                                transform: isSpillEnabled ? `translate(${displayX}px, ${displayY}px)` : 'none',
                                                                objectFit: isSpillEnabled ? 'contain' : 'cover'
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Glass Overlays */}
                                                    <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none"><div className="absolute inset-0 bg-sky-200/10" /></div>
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-60 z-10 pointer-events-none rounded-full" />

                                                    {/* Controls (visible on hover) */}
                                                    <input type="file" ref={fileInputRef} onChange={handleOrbImageUpload} accept="image/*" className="hidden" />

                                                    {/* Center Upload Button */}
                                                    <button
                                                        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-sky-100 opacity-0 group-hover/orb:opacity-100 transition-all duration-300"
                                                        style={{ width: `28px`, height: `28px` }}
                                                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                        title="Upload orb image"
                                                    >
                                                        <Upload size={16} className="text-sky-500" strokeWidth={3} />
                                                    </button>

                                                    {/* Top Right: Spill */}
                                                    <button
                                                        className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-sky-50 opacity-0 group-hover/orb:opacity-100 transition-all duration-300"
                                                        style={{ top: '15%', right: '15%', width: `28px`, height: `28px` }}
                                                        onClick={(e) => { e.stopPropagation(); if (orbControls && orbControls.onToggleSpill) orbControls.onToggleSpill(e); }}
                                                        title="Toggle Spill"
                                                    >
                                                        <Pen size={14} className="text-slate-800" strokeWidth={2.5} />
                                                    </button>

                                                    {/* Bottom Right: Settings */}
                                                    <button
                                                        className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-sky-50 opacity-0 group-hover/orb:opacity-100 transition-all duration-300"
                                                        style={{ bottom: '15%', right: '15%', width: `28px`, height: `28px` }}
                                                        onClick={(e) => { e.stopPropagation(); if (onEdit) onEdit(); }}
                                                        title="Settings"
                                                    >
                                                        <Settings size={14} className="text-slate-800" strokeWidth={2.5} />
                                                    </button>

                                                    {/* Bottom Left: Layers (Placeholder) */}
                                                    <button
                                                        className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-sky-50 opacity-0 group-hover/orb:opacity-100 transition-all duration-300"
                                                        style={{ bottom: '15%', left: '15%', width: `28px`, height: `28px` }}
                                                        onClick={(e) => { e.stopPropagation(); /* No action */ }}
                                                        title="Layers"
                                                    >
                                                        <Layers size={14} className="text-slate-800" strokeWidth={2.5} />
                                                    </button>

                                                    {/* Top Left: Menu (Placeholder) */}
                                                    <button
                                                        className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-sky-50 opacity-0 group-hover/orb:opacity-100 transition-all duration-300"
                                                        style={{ top: '15%', left: '15%', width: `28px`, height: `28px` }}
                                                        onClick={(e) => { e.stopPropagation(); /* No action */ }}
                                                        title="Menu"
                                                    >
                                                        <Grid size={14} className="text-slate-800" strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : activeVideo && (
                                        <div className="relative h-[180px] w-[320px] rounded-lg overflow-hidden shadow-lg border-2 border-black">
                                            <img
                                                src={activeVideo.thumbnailUrl || getThumbnailUrl(activeVideo.video_id, 'medium')}
                                                alt={activeVideo.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Continue Label */}
                                            {currentOption === 'continue' && (
                                                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white/90 uppercase shadow-sm border border-white/10">
                                                    {(() => {
                                                        const currentPlaying = currentPlaylistItems && currentPlaylistItems[currentVideoIndex];
                                                        const isPlaying = activeVideo && currentPlaying &&
                                                            (activeVideo.id === currentPlaying.id || activeVideo.video_id === currentPlaying.video_id);
                                                        return isPlaying ? 'CURRENTLY PLAYING' : 'CONTINUE';
                                                    })()}
                                                </div>
                                            )}

                                            {/* Pin type icon - only show when viewing pinned video */}
                                            {currentOption === 'pinned' && activePinnedVideo && (
                                                <div
                                                    className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10"
                                                    title={
                                                        activePinnedVideo.isPriority && activePinnedVideo.isFollower ? 'Priority Follower Pin' :
                                                            activePinnedVideo.isPriority ? 'Priority Pin' :
                                                                activePinnedVideo.isFollower ? 'Follower Pin' : 'Pin'
                                                    }
                                                >
                                                    <span className="text-[10px] font-bold text-white/90 uppercase mr-1">PINNED</span>
                                                    {/* Crown for priority */}
                                                    {activePinnedVideo.isPriority && (
                                                        <span className="text-[10px]" style={{ color: '#FFD700' }}>👑</span>
                                                    )}
                                                    {/* Pin icon */}
                                                    <Pin
                                                        size={12}
                                                        className={activePinnedVideo.isPriority ? 'text-yellow-400' : 'text-white'}
                                                        fill={activePinnedVideo.isPriority ? '#FFD700' : 'white'}
                                                    />
                                                    {/* Arrow for follower */}
                                                    {activePinnedVideo.isFollower && (
                                                        <span className="text-[10px] text-sky-400">→</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}



                                    {/* Left navigation strip - Previous Pin */}
                                    {currentOption === 'pinned' && hasMultiplePins && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newIndex = activePinnedIndex > 0 ? activePinnedIndex - 1 : pinnedVideos.length - 1;
                                                setActivePinnedIndex(newIndex);
                                            }}
                                            className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/60 to-transparent opacity-0 group-hover/preview:opacity-100 hover:from-black/80 transition-all flex items-center justify-center rounded-l-lg"
                                            title="Previous pin"
                                        >
                                            <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
                                        </button>
                                    )}

                                    {/* Right navigation strip - Next Pin */}
                                    {currentOption === 'pinned' && hasMultiplePins && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newIndex = activePinnedIndex < pinnedVideos.length - 1 ? activePinnedIndex + 1 : 0;
                                                setActivePinnedIndex(newIndex);
                                            }}
                                            className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/60 to-transparent opacity-0 group-hover/preview:opacity-100 hover:from-black/80 transition-all flex items-center justify-center rounded-r-lg"
                                            title="Next pin"
                                        >
                                            <ChevronRight size={20} className="text-white" strokeWidth={2.5} />
                                        </button>
                                    )}

                                    {/* Bottom hover menu for media carousel labels */}
                                    {hasMultipleOptions && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 pointer-events-auto opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300">
                                            {availableOptions.map((option, index) => {
                                                const isActive = activeThumbnail === index;
                                                const label = option === 'continue' ? 'Recent' : option === 'pinned' ? 'Pins' : (currentNavPage === 'playlists' ? 'Presets' : 'Ascii');

                                                return (
                                                    <button
                                                        key={option}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveThumbnail(index);
                                                        }}
                                                        className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all whitespace-nowrap ${isActive
                                                            ? 'bg-white/30 border-white/50 text-white backdrop-blur-md'
                                                            : 'bg-black/50 border-white/20 text-white/70 hover:text-white hover:bg-black/70 backdrop-blur-md'
                                                            }`}
                                                        style={{
                                                            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8)'
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Horizontal pin bar with selection dot - only show when viewing pinned and multiple pins exist (max 10 segments) */}
                            {/* Positioned absolutely at the top of thumbnail */}
                            {currentOption === 'pinned' && hasMultiplePins && (
                                <div className="absolute flex flex-col items-stretch gap-[2px]" style={{ left: '50%', transform: 'translateX(-50%)', top: '0px' }}>
                                    <div className="flex flex-row w-[320px] h-3 rounded-md overflow-hidden border border-white/20 bg-black/20 backdrop-blur-sm">
                                        {pinnedVideos.slice(0, 10).map((pin, index) => {
                                            // Get folder color for this pinned video
                                            const pinFolderColor = pin.folder_color || pin.folderColor;
                                            const folderColorConfig = pinFolderColor ? FOLDER_COLORS.find(c => c.id === pinFolderColor) : null;
                                            const isPriority = pin.isPriority;
                                            // Priority pins get golden color, otherwise use folder color
                                            const segmentColor = isPriority ? '#FFD700' : (folderColorConfig?.hex || null);

                                            return (
                                                <button
                                                    key={pin.id || index}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActivePinnedIndex(index);
                                                    }}
                                                    className={`flex-1 transition-all hover:opacity-100 ${!segmentColor ? 'bg-white/50 hover:bg-white/70' : ''
                                                        }`}
                                                    style={{
                                                        borderRight: index < Math.min(pinnedVideos.length, 10) - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                                                        ...(segmentColor ? {
                                                            backgroundColor: segmentColor,
                                                            opacity: isPriority ? 1 : 0.85
                                                        } : {}),
                                                        // Crown-like clip-path for priority pin (leftmost segment with pointy left edge)
                                                        ...(isPriority && index === 0 ? {
                                                            clipPath: 'polygon(30% 0%, 0% 25%, 20% 50%, 0% 75%, 30% 100%, 100% 100%, 100% 0%)',
                                                            marginLeft: '-2px',
                                                            paddingLeft: '2px'
                                                        } : {})
                                                    }}
                                                    title={isPriority ? `👑 ${pin.title || 'Priority Pin'}` : (pin.title || `Pin ${index + 1}`)}
                                                />
                                            );
                                        })}
                                    </div>
                                    {/* Selection indicator dot */}
                                    <div className="relative w-[320px] h-2 flex flex-row">
                                        {pinnedVideos.slice(0, 10).map((pin, index) => (
                                            <div key={index} className="flex-1 flex items-center justify-center">
                                                {activePinnedIndex === index && (
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full shadow-md"
                                                        style={{ backgroundColor: pin.isPriority ? '#FFD700' : 'white' }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}



            </div>
            {/* End of Banner Container */}

            {/* Layer 2 - Positioned to the right of banner, no Layer 1 background */}
            {effectiveLayer2Image && (
                <div
                    className={`group relative overflow-hidden transition-opacity duration-[400ms] ease-in-out ${bannerHeightClass} -mt-[25px]`}
                    style={{
                        width: `calc(100% - 332px)`,
                        opacity: imageOpacity,
                        border: '4px solid rgba(0,0,0,0.8)',
                        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2), 0 0 15px rgba(0,0,0,0.5)'
                    }}
                >
                    <UnifiedBannerBackground
                        image={null}
                        image2={effectiveLayer2Image}
                        image2Scale={effectiveLayer2Scale}
                        image2XOffset={effectiveLayer2XOffset}
                        image2YOffset={effectiveLayer2YOffset}
                    />

                    {/* Search Bar - Top Center - Only visible on hover */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-96 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
                            <Search size={18} className="text-white/60" />
                            <input
                                type="text"
                                placeholder="Search videos..."
                                className="flex-1 bg-transparent text-white placeholder-white/40 text-sm focus:outline-none"
                                style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                            />
                        </div>
                    </div>

                    {/* Settings Cog - Bottom Right - Only visible on hover */}
                    <div className="absolute bottom-4 right-4 z-30 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onEdit) onEdit();
                            }}
                            className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/60 transition-all"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                    </div>

                    {/* Bottom Left Navigation - Page Navigator only (Folder Navigator moved to Sticky Bar) */}
                    <div className="absolute bottom-2 left-2 z-30 pointer-events-auto flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {/* Page Navigator */}
                        {currentNavPage === 'videos' && totalPages > 1 && (
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prevPage();
                                    }}
                                    disabled={paginationPage === 1}
                                    className="flex items-center justify-center w-6 h-6 rounded text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <ChevronLeft size={16} strokeWidth={2.5} />
                                </button>
                                {/* Page indicator - clickable */}
                                {isEditingPageLocal ? (
                                    <input
                                        ref={pageInputRef}
                                        type="text"
                                        value={pageInputValueLocal}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setPageInputValueLocal(val);
                                        }}
                                        onBlur={() => {
                                            const page = parseInt(pageInputValueLocal);
                                            if (page >= 1 && page <= totalPages) {
                                                setPaginationPage(page);
                                            }
                                            setIsEditingPageLocal(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const page = parseInt(pageInputValueLocal);
                                                if (page >= 1 && page <= totalPages) {
                                                    setPaginationPage(page);
                                                }
                                                setIsEditingPageLocal(false);
                                            } else if (e.key === 'Escape') {
                                                setIsEditingPageLocal(false);
                                            }
                                        }}
                                        className="w-10 h-6 px-1 bg-white border-2 border-sky-500 rounded text-center text-sky-600 font-bold text-xs focus:outline-none"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPageInputValueLocal(String(paginationPage));
                                            setIsEditingPageLocal(true);
                                            setTimeout(() => pageInputRef.current?.select(), 0);
                                        }}
                                        className="px-1.5 h-6 bg-white border-2 border-slate-300 text-slate-700 rounded-full hover:border-sky-400 hover:text-sky-600 transition-all text-xs font-bold"
                                        title="Click to jump to page"
                                    >
                                        {paginationPage}/{totalPages}
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        nextPage();
                                    }}
                                    disabled={paginationPage >= totalPages}
                                    className="flex items-center justify-center w-6 h-6 rounded text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <ChevronRight size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


export default PageBanner;
