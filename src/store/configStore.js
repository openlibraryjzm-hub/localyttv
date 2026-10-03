import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import idbStorage from './indexedDBStorage';

export const useConfigStore = create(
    persist(
        (set, get) => ({
            // Pin Track & Header
            pinAnchorX: 50,
            setPinAnchorX: (val) => set({ pinAnchorX: val }),
            pinAnchorY: 0,
            setPinAnchorY: (val) => set({ pinAnchorY: val }),
            plusButtonX: 100,
            setPlusButtonX: (val) => set({ plusButtonX: val }),
            plusButtonY: 0,
            setPlusButtonY: (val) => set({ plusButtonY: val }),
            pinToggleY: 0,
            setPinToggleY: (val) => set({ pinToggleY: val }),

            // Playlist Header
            playlistToggleX: 20,
            setPlaylistToggleX: (val) => set({ playlistToggleX: val }),
            playlistTabsX: 0,
            setPlaylistTabsX: (val) => set({ playlistTabsX: val }),
            playlistInfoX: 0,
            setPlaylistInfoX: (val) => set({ playlistInfoX: val }),
            playlistInfoWidth: 200,
            setPlaylistInfoWidth: (val) => set({ playlistInfoWidth: val }),

            // Playlist Capsule
            playlistCapsuleX: 0,
            setPlaylistCapsuleX: (val) => set({ playlistCapsuleX: val }),
            playlistCapsuleY: 0,
            setPlaylistCapsuleY: (val) => set({ playlistCapsuleY: val }),
            playlistCapsuleWidth: 74,
            setPlaylistCapsuleWidth: (val) => set({ playlistCapsuleWidth: val }),
            playlistCapsuleHeight: 32,
            setPlaylistCapsuleHeight: (val) => set({ playlistCapsuleHeight: val }),
            playlistChevronLeftX: 0,
            setPlaylistChevronLeftX: (val) => set({ playlistChevronLeftX: val }),
            playlistPlayCircleX: 0,
            setPlaylistPlayCircleX: (val) => set({ playlistPlayCircleX: val }),
            playlistChevronRightX: 0,
            setPlaylistChevronRightX: (val) => set({ playlistChevronRightX: val }),

            // Orb Image Tuning
            orbImageScale: 1.0,
            setOrbImageScale: (val) => set({ orbImageScale: val }),
            orbImageScaleW: 1.0,
            setOrbImageScaleW: (val) => set({ orbImageScaleW: val }),
            orbImageScaleH: 1.0,
            setOrbImageScaleH: (val) => set({ orbImageScaleH: val }),
            orbImageXOffset: 0,
            setOrbImageXOffset: (val) => set({ orbImageXOffset: val }),
            orbImageYOffset: 0,
            setOrbImageYOffset: (val) => set({ orbImageYOffset: val }),
            orbSize: 150,
            setOrbSize: (val) => set({ orbSize: val }),
            orbMenuGap: 30, // Gap between orb and menus
            setOrbMenuGap: (val) => set({ orbMenuGap: val }),

            // Global Layout
            menuWidth: 340,
            setMenuWidth: (val) => set({ menuWidth: val }),
            menuHeight: 102,
            setMenuHeight: (val) => set({ menuHeight: val }),
            controllerCompactMode: false,
            setControllerCompactMode: (val) => set({ controllerCompactMode: val }),

            // Playlist Pin Slot Mode ('pin' | 'carousel')
            playlistPinSlotMode: 'pin',
            setPlaylistPinSlotMode: (val) => set({ playlistPinSlotMode: val }),

            // Video Menu Toolbar
            modeHandleSize: 20,
            setModeHandleSize: (val) => set({ modeHandleSize: val }),
            modeHandleInternalSize: 14,
            setModeHandleInternalSize: (val) => set({ modeHandleInternalSize: val }),

            // Center Cluster
            modeSwitcherX: -128, // Grid moved to between chevrons
            setModeSwitcherX: (val) => set({ modeSwitcherX: val }),
            videoChevronLeftX: -150, // Leftmost
            setVideoChevronLeftX: (val) => set({ videoChevronLeftX: val }),
            videoChevronRightX: -100, // Right of Play
            setVideoChevronRightX: (val) => set({ videoChevronRightX: val }),
            videoPlayButtonX: -65, // Nudged right (swapped with grid)
            setVideoPlayButtonX: (val) => set({ videoPlayButtonX: val }),

            // Right Side Group (Shifted for equal spacing)
            starButtonX: -19,
            setStarButtonX: (val) => set({ starButtonX: val }),
            shuffleButtonX: 22,
            setShuffleButtonX: (val) => set({ shuffleButtonX: val }),

            // Right Flank
            pinFirstButtonX: 63,
            setPinFirstButtonX: (val) => set({ pinFirstButtonX: val }),
            likeButtonX: 104,
            setLikeButtonX: (val) => set({ likeButtonX: val }),
            menuButtonX: 280, // Moved 100px right
            setMenuButtonX: (val) => set({ menuButtonX: val }),
            tooltipButtonX: 145,
            setTooltipButtonX: (val) => set({ tooltipButtonX: val }),
            discoveryButtonX: 185, // New Discovery button position
            setDiscoveryButtonX: (val) => set({ discoveryButtonX: val }),

            // Dual Banner System (Fullscreen & Splitscreen)
            fullscreenBanner: {
                image: null,
                verticalPosition: 0,
                scale: 100,
                spillHeight: 0,
                maskPath: [],
                scrollEnabled: true,
                clipLeft: 0,
                clipBottom: 0,
                clipRight: 0,
                horizontalOffset: 0,
                flipped: false,
                playerControllerXOffset: 0
            },
            updateFullscreenBanner: (updates) => set((state) => ({
                fullscreenBanner: { ...state.fullscreenBanner, ...updates }
            })),

            splitscreenBanner: {
                image: null,
                verticalPosition: 0,
                scale: 100,
                spillHeight: 0,
                maskPath: [],
                scrollEnabled: true,
                clipLeft: 0,
                clipBottom: 0,
                clipRight: 0,
                horizontalOffset: 0,
                flipped: false,
                playerControllerXOffset: 0
            },
            updateSplitscreenBanner: (updates) => set((state) => ({
                splitscreenBanner: { ...state.splitscreenBanner, ...updates }
            })),

            // Stashing logic for temporary live editing
            stashedBanners: null,
            stashBanners: () => set((state) => ({
                stashedBanners: {
                    fullscreenBanner: JSON.parse(JSON.stringify(state.fullscreenBanner)),
                    splitscreenBanner: JSON.parse(JSON.stringify(state.splitscreenBanner))
                }
            })),
            restoreBanners: () => set((state) => {
                if (!state.stashedBanners) return {};
                return {
                    fullscreenBanner: state.stashedBanners.fullscreenBanner,
                    splitscreenBanner: state.stashedBanners.splitscreenBanner,
                    stashedBanners: null
                };
            }),
            clearStash: () => set({ stashedBanners: null }),

            // Shared UI State
            bannerCropModeActive: false,
            setBannerCropModeActive: (val) => set({ bannerCropModeActive: val }),
            bannerCropLivePreview: true,
            setBannerCropLivePreview: (val) => set({ bannerCropLivePreview: val }),

            // Ephemeral Banner Preview State (override current viewMode for editing)
            bannerPreviewMode: null, // 'fullscreen' | 'splitscreen' | null
            setBannerPreviewMode: (val) => set({ bannerPreviewMode: val }),

            // Banner Presets - saved configurations
            bannerPresets: [],
            addBannerPreset: (preset) => set((state) => ({
                bannerPresets: [...state.bannerPresets, {
                    ...preset,
                    id: preset.id || Date.now().toString(),
                    name: preset.name || `Banner ${state.bannerPresets.length + 1}`,
                    createdAt: Date.now(),
                    playlistIds: preset.playlistIds || [],
                    // Ensure we save both configs if present, or fallback to flat inputs if coming from legacy
                    fullscreenBanner: preset.fullscreenBanner || state.fullscreenBanner,
                    splitscreenBanner: preset.splitscreenBanner || state.splitscreenBanner
                }]
            })),
            removeBannerPreset: (id) => set((state) => ({
                bannerPresets: state.bannerPresets.filter(p => p.id !== id)
            })),
            updateBannerPresetPlaylists: (id, playlistIds) => set((state) => ({
                bannerPresets: state.bannerPresets.map(p =>
                    p.id === id ? { ...p, playlistIds } : p
                )
            })),
            applyBannerPreset: (preset) => set((state) => {
                // Determine if this is a V2 preset (has specific keys) or V1 (legacy flat)
                const hasFullscreen = !!preset.fullscreenBanner;
                const hasSplitscreen = !!preset.splitscreenBanner;
                const isLegacy = !hasFullscreen && !hasSplitscreen;

                // Helper to construct legacy fallback object
                const legacyFallback = {
                    image: preset.customBannerImage ?? null,
                    verticalPosition: preset.bannerVerticalPosition ?? 0,
                    scale: preset.bannerScale ?? 100,
                    spillHeight: preset.bannerSpillHeight ?? 0,
                    maskPath: preset.bannerMaskPath || [],
                    scrollEnabled: preset.bannerScrollEnabled ?? true,
                    clipLeft: preset.bannerClipLeft ?? 0,
                    clipBottom: preset.bannerClipBottom ?? 0,
                    clipRight: preset.bannerClipRight ?? 0,
                    horizontalOffset: preset.bannerHorizontalOffset ?? 0,
                    playerControllerXOffset: preset.playerControllerXOffset ?? 0,
                };

                return {
                    // Apply Fullscreen: if present, OR if legacy (apply to both)
                    fullscreenBanner: hasFullscreen
                        ? preset.fullscreenBanner
                        : (isLegacy ? legacyFallback : state.fullscreenBanner),

                    // Apply Splitscreen: if present, OR if legacy (apply to both)
                    splitscreenBanner: hasSplitscreen
                        ? preset.splitscreenBanner
                        : (isLegacy ? legacyFallback : state.splitscreenBanner),
                    
                    activeNavigationMode: 'banner'
                };
            }),

            // Player Controller Positioning
            playerControllerXOffset: 0,
            setPlayerControllerXOffset: (val) => set({ playerControllerXOffset: val }),

            // Custom Orb Image & Spill
            customOrbImage: null,
            setCustomOrbImage: (val) => set({ customOrbImage: val }),
            isSpillEnabled: false,
            setIsSpillEnabled: (val) => set({ isSpillEnabled: val }),
            orbSpill: { tl: true, tr: true, bl: true, br: true },
            setOrbSpill: (val) => set({ orbSpill: val }),

            // Advanced Orb Masking (Custom Crops)
            orbAdvancedMasks: { tl: false, tr: false, bl: false, br: false },
            setOrbAdvancedMasks: (val) => set({ orbAdvancedMasks: val }),
            orbMaskRects: {
                tl: { x: 0, y: 0, w: 50, h: 50 },
                tr: { x: 50, y: 0, w: 50, h: 50 },
                bl: { x: 0, y: 50, w: 50, h: 50 },
                br: { x: 50, y: 50, w: 50, h: 50 }
            },
            setOrbMaskRects: (val) => set({ orbMaskRects: val }),
            orbMaskPaths: {
                tl: [],
                tr: [],
                bl: [],
                br: []
            },
            setOrbMaskPaths: (val) => set({ orbMaskPaths: val }),
            orbMaskModes: { tl: 'rect', tr: 'rect', bl: 'rect', br: 'rect' },
            setOrbMaskModes: (val) => set({ orbMaskModes: val }),

            // Orb Preview Mode (Overrides everything for configuration)
            isOrbPreviewMode: false,
            setIsOrbPreviewMode: (val) => set({ isOrbPreviewMode: val }),

            // Shared Orb Navigation State
            activeNavigationMode: 'orb', // 'orb' | 'banner'
            setActiveNavigationMode: (val) => set({ activeNavigationMode: val }),

            orbNavPlaylistId: null,
            setOrbNavPlaylistId: (val) => set({ orbNavPlaylistId: val }),
            orbNavOrbId: null,
            setOrbNavOrbId: (val) => set({ orbNavOrbId: val }),

            // Shared Banner Navigation State
            bannerNavPlaylistId: null,
            setBannerNavPlaylistId: (val) => set({ bannerNavPlaylistId: val }),
            bannerNavBannerId: null,
            setBannerNavBannerId: (val) => set({ bannerNavBannerId: val }),

            // Orb Favorites - saved configurations
            orbFavorites: [],
            addOrbFavorite: (favorite) => set((state) => ({
                orbFavorites: [...state.orbFavorites, {
                    id: favorite.id || Date.now().toString(),
                    name: favorite.name || `Favorite ${state.orbFavorites.length + 1}`,
                    createdAt: Date.now(),
                    customOrbImage: favorite.customOrbImage,
                    isSpillEnabled: favorite.isSpillEnabled,
                    orbSpill: favorite.orbSpill,
                    orbImageScale: favorite.orbImageScale,
                    orbImageXOffset: favorite.orbImageXOffset ?? 0,
                    orbImageYOffset: favorite.orbImageYOffset ?? 0,
                    // Save advanced masks
                    orbAdvancedMasks: favorite.orbAdvancedMasks || { tl: false, tr: false, bl: false, br: false },
                    orbMaskRects: favorite.orbMaskRects || {
                        tl: { x: 0, y: 0, w: 50, h: 50 },
                        tr: { x: 50, y: 0, w: 50, h: 50 },
                        bl: { x: 0, y: 50, w: 50, h: 50 },
                        br: { x: 50, y: 50, w: 50, h: 50 }
                    },
                    orbMaskPaths: favorite.orbMaskPaths || {
                        tl: [], tr: [], bl: [], br: []
                    },
                    orbMaskModes: favorite.orbMaskModes || { tl: 'rect', tr: 'rect', bl: 'rect', br: 'rect' },
                    folderColors: favorite.folderColors || [], // Array of folder color IDs
                    playlistIds: favorite.playlistIds || [], // Array of playlist IDs for theme overrides
                    visualizerColor: favorite.visualizerColor || '#ffffff',
                    fullscreenBanner: favorite.fullscreenBanner || null,
                    splitscreenBanner: favorite.splitscreenBanner || null,
                }]
            })),
            removeOrbFavorite: (id) => set((state) => ({
                orbFavorites: state.orbFavorites.filter(f => f.id !== id)
            })),
            applyOrbFavorite: (favorite) => set((state) => {
                const newState = {
                    customOrbImage: favorite.customOrbImage,
                    isSpillEnabled: favorite.isSpillEnabled,
                    orbSpill: favorite.orbSpill,
                    orbImageScale: favorite.orbImageScale,
                    orbImageXOffset: favorite.orbImageXOffset ?? 0,
                    orbImageYOffset: favorite.orbImageYOffset ?? 0,
                    // Restore advanced masks
                    orbAdvancedMasks: favorite.orbAdvancedMasks || { tl: false, tr: false, bl: false, br: false },
                    orbMaskRects: favorite.orbMaskRects || {
                        tl: { x: 0, y: 0, w: 50, h: 50 },
                        tr: { x: 50, y: 0, w: 50, h: 50 },
                        bl: { x: 0, y: 50, w: 50, h: 50 },
                        br: { x: 50, y: 50, w: 50, h: 50 }
                    },
                    orbMaskPaths: favorite.orbMaskPaths || {
                        tl: [], tr: [], bl: [], br: []
                    },
                    orbMaskModes: favorite.orbMaskModes || { tl: 'rect', tr: 'rect', bl: 'rect', br: 'rect' },
                    visualizerColor: favorite.visualizerColor || '#ffffff',
                    bannerNavBannerId: null,
                    activeNavigationMode: 'orb',
                };
                if (favorite.fullscreenBanner) {
                    newState.fullscreenBanner = favorite.fullscreenBanner;
                }
                if (favorite.splitscreenBanner) {
                    newState.splitscreenBanner = favorite.splitscreenBanner;
                }
                return newState;
            }),

            renameOrbFavorite: (id, newName) => set((state) => ({
                orbFavorites: state.orbFavorites.map(f =>
                    f.id === id ? { ...f, name: newName } : f
                )
            })),
            updateOrbFavoriteFolders: (id, folderColors) => set((state) => ({
                orbFavorites: state.orbFavorites.map(f =>
                    f.id === id ? { ...f, folderColors: folderColors || [] } : f
                )
            })),
            updateOrbFavoritePlaylists: (id, playlistIds) => set((state) => ({
                orbFavorites: state.orbFavorites.map(f =>
                    f.id === id ? { ...f, playlistIds: playlistIds || [] } : f
                )
            })),
            updateOrbFavorite: (id, updates) => set((state) => ({
                orbFavorites: state.orbFavorites.map(f =>
                    f.id === id ? { ...f, ...updates } : f
                )
            })),
            clearOrbFavorites: () => set({ orbFavorites: [] }),
            // Group management for orb presets
            // groupLeaderId: ID of the orb preset that is the group leader
            // groupMembers: Array of orb preset IDs that belong to this group
            setOrbGroupLeader: (leaderId, memberIds) => set((state) => ({
                orbFavorites: state.orbFavorites.map(f =>
                    f.id === leaderId
                        ? { ...f, groupMembers: memberIds || [] }
                        : memberIds && memberIds.includes(f.id)
                            ? { ...f, groupLeaderId: leaderId }
                            : f.groupLeaderId === leaderId
                                ? { ...f, groupLeaderId: null }
                                : f
                )
            })),
            assignOrbToGroup: (presetId, groupLeaderId) => set((state) => {
                const leader = state.orbFavorites.find(f => f.id === groupLeaderId);
                const currentMembers = leader?.groupMembers || [];
                const isAlreadyMember = currentMembers.includes(presetId);

                return {
                    orbFavorites: state.orbFavorites.map(f => {
                        if (f.id === groupLeaderId) {
                            // Update leader's member list
                            return {
                                ...f,
                                groupMembers: isAlreadyMember
                                    ? currentMembers.filter(id => id !== presetId)
                                    : [...currentMembers, presetId]
                            };
                        } else if (f.id === presetId) {
                            // Update preset's group leader
                            return {
                                ...f,
                                groupLeaderId: isAlreadyMember ? null : groupLeaderId
                            };
                        }
                        return f;
                    })
                };
            }),

            // Restored Missing Keys (Defaults)
            pinFirstButtonSize: 34,
            setPinFirstButtonSize: (val) => set({ pinFirstButtonSize: val }),


            dotMenuWidth: 240,
            setDotMenuWidth: (val) => set({ dotMenuWidth: val }),
            dotMenuHeight: 100,
            setDotMenuHeight: (val) => set({ dotMenuHeight: val }),
            dotMenuY: -80,
            setDotMenuY: (val) => set({ dotMenuY: val }),
            dotSize: 32,
            setDotSize: (val) => set({ dotSize: val }),

            playlistHandleSize: 26,
            setPlaylistHandleSize: (val) => set({ playlistHandleSize: val }),
            playlistPlayIconSize: 14,
            setPlaylistPlayIconSize: (val) => set({ playlistPlayIconSize: val }),
            playlistChevronIconSize: 14,
            setPlaylistChevronIconSize: (val) => set({ playlistChevronIconSize: val }),

            bottomBarHeight: 40,
            setBottomBarHeight: (val) => set({ bottomBarHeight: val }),

            titleFontSize: 16,
            setTitleFontSize: (val) => set({ titleFontSize: val }),
            metadataFontSize: 11,
            setMetadataFontSize: (val) => set({ metadataFontSize: val }),

            pinSize: 20,
            setPinSize: (val) => set({ pinSize: val }),
            pinWidth: 40,
            setPinWidth: (val) => set({ pinWidth: val }),
            pinHeight: 30,
            setPinHeight: (val) => set({ pinHeight: val }),

            bottomIconSize: 34,
            setBottomIconSize: (val) => set({ bottomIconSize: val }),
            navChevronSize: 20,
            setNavChevronSize: (val) => set({ navChevronSize: val }),

            orbButtonSpread: 35,
            setOrbButtonSpread: (val) => set({ orbButtonSpread: val }),

            // Quick Assign/Shuffle Colors
            quickAssignColor: null,
            setQuickAssignColor: (val) => set({ quickAssignColor: val }),
            quickShuffleColor: 'all',
            setQuickShuffleColor: (val) => set({ quickShuffleColor: val }),

            // User Profile
            userName: 'Boss',
            setUserName: (val) => set({ userName: val }),
            userAvatar: '( ͡° ͜ʖ ͡°)',
            setUserAvatar: (val) => set({ userAvatar: val }),

            // Visual Flair
            bannerPattern: 'diagonal',
            setBannerPattern: (val) => set({ bannerPattern: val }),
            // Layer 1 - Background Color (solid color behind Layer 2 overlay)
            pageBannerBgColor: '#1e293b', // Default slate-800
            setPageBannerBgColor: (val) => set({ pageBannerBgColor: val }),
            // Second Page Banner Image (Layer 2)
            customPageBannerImage2: null,
            setCustomPageBannerImage2: (val) => set({ customPageBannerImage2: val }),
            pageBannerImage2Scale: 100,
            setPageBannerImage2Scale: (val) => set({ pageBannerImage2Scale: val }),
            pageBannerImage2XOffset: 50,
            setPageBannerImage2XOffset: (val) => set({ pageBannerImage2XOffset: val }),
            pageBannerImage2YOffset: 50,
            setPageBannerImage2YOffset: (val) => set({ pageBannerImage2YOffset: val }),

            // Hidden Playlists
            hiddenPlaylists: [],
            hidePlaylist: (id) => set((state) => {
                if (!state.hiddenPlaylists.includes(id)) {
                    return { hiddenPlaylists: [...state.hiddenPlaylists, id] };
                }
                return state;
            }),
            unhidePlaylist: (id) => set((state) => ({
                hiddenPlaylists: state.hiddenPlaylists.filter(pid => pid !== id)
            })),

            // Playlist Video Filters (per-playlist sort, direction, ratings)
            playlistVideoFilters: {},
            setPlaylistVideoFilter: (id, updates) => set((state) => {
                const existing = state.playlistVideoFilters[id] || { sortBy: 'shuffle', sortDirection: 'desc', selectedRatings: [] };
                return {
                    playlistVideoFilters: {
                        ...state.playlistVideoFilters,
                        [id]: { ...existing, ...updates }
                    }
                };
            }),

            // Layer 2 Image Folders System
            // playlistIds: [] means show on ALL playlists, specific IDs means show only on those playlists
            // isThemeFolder: true means this folder's images apply app-wide as the theme
            // condition: 'random' means randomly select from folder images on each page entry, null means use first image
            layer2Folders: [
                { id: 'default', name: 'Default', images: [], playlistIds: [], isThemeFolder: false, condition: null, folderColors: [] }
            ],
            selectedLayer2FolderId: 'default',
            setSelectedLayer2FolderId: (val) => set({ selectedLayer2FolderId: val }),
            // Theme folder ID - the folder that applies app-wide (legacy, being replaced by group leader theme)
            themeFolderId: null,
            setThemeFolder: (folderId) => set((state) => {
                // Clear theme flag from all folders, then set it on the selected folder
                const updatedFolders = state.layer2Folders.map(f => ({
                    ...f,
                    isThemeFolder: f.id === folderId ? true : false
                }));
                return {
                    layer2Folders: updatedFolders,
                    themeFolderId: folderId || null,
                    // Clear group leader theme when setting folder theme
                    themeGroupLeaderId: null,
                    themeGroupLeaderFolderId: null
                };
            }),
            clearThemeFolder: () => set((state) => {
                // Clear theme flag from all folders
                const updatedFolders = state.layer2Folders.map(f => ({
                    ...f,
                    isThemeFolder: false
                }));
                return {
                    layer2Folders: updatedFolders,
                    themeFolderId: null,
                    // Also clear group leader theme
                    themeGroupLeaderId: null,
                    themeGroupLeaderFolderId: null
                };
            }),
            // Theme group leader - replaces legacy folder theme system
            themeGroupLeaderId: null,
            themeGroupLeaderFolderId: null,
            setThemeGroupLeader: (imageId, folderId) => set((state) => {
                return {
                    themeGroupLeaderId: imageId || null,
                    themeGroupLeaderFolderId: folderId || null,
                    // Clear legacy folder theme when setting group leader theme
                    themeFolderId: null,
                    layer2Folders: state.layer2Folders.map(f => ({
                        ...f,
                        isThemeFolder: false
                    }))
                };
            }),
            clearThemeGroupLeader: () => set((state) => ({
                themeGroupLeaderId: null,
                themeGroupLeaderFolderId: null
            })),
            addLayer2Folder: (name) => set((state) => ({
                layer2Folders: [...state.layer2Folders, {
                    id: Date.now().toString(),
                    name: name || `Folder ${state.layer2Folders.length + 1}`,
                    images: [],
                    playlistIds: [], // Empty = show on all playlists
                    isThemeFolder: false,
                    condition: null, // null = first image, 'random' = random selection
                    folderColors: [], // Array of folder color IDs
                    colorAssignments: {} // Map of colorId -> imageId
                }]
            })),
            removeLayer2Folder: (folderId) => set((state) => {
                // If deleting the theme folder, clear the theme
                const isTheme = state.themeFolderId === folderId;
                return {
                    layer2Folders: state.layer2Folders.filter(f => f.id !== folderId),
                    // Reset to default if deleted folder was selected
                    selectedLayer2FolderId: state.selectedLayer2FolderId === folderId ? 'default' : state.selectedLayer2FolderId,
                    // Clear theme if deleting theme folder
                    themeFolderId: isTheme ? null : state.themeFolderId
                };
            }),
            renameLayer2Folder: (folderId, newName) => set((state) => ({
                layer2Folders: state.layer2Folders.map(f =>
                    f.id === folderId ? { ...f, name: newName } : f
                )
            })),
            // Update which playlists a folder appears on (empty = all playlists)
            setLayer2FolderPlaylists: (folderId, playlistIds) => set((state) => ({
                layer2Folders: state.layer2Folders.map(f =>
                    f.id === folderId ? { ...f, playlistIds: playlistIds || [] } : f
                )
            })),
            // Update folder condition (null = first image, 'random' = random selection)
            setLayer2FolderCondition: (folderId, condition) => set((state) => ({
                layer2Folders: state.layer2Folders.map(f =>
                    f.id === folderId ? { ...f, condition: condition || null } : f
                )
            })),
            // Update folder color assignments
            updateLayer2FolderFolders: (folderId, folderColors) => set((state) => ({
                layer2Folders: state.layer2Folders.map(f =>
                    f.id === folderId ? { ...f, folderColors: folderColors || [] } : f
                )
            })),
            addLayer2Image: (folderId, image) => set((state) => ({
                layer2Folders: state.layer2Folders.map(folder =>
                    folder.id === folderId
                        ? {
                            ...folder,
                            images: [...folder.images, {
                                id: image.id || Date.now().toString(),
                                image: image.image,
                                scale: image.scale ?? 100,
                                xOffset: image.xOffset ?? 50,
                                yOffset: image.yOffset ?? 50,
                                bgColor: image.bgColor ?? state.pageBannerBgColor, // Save Layer 1 color with image
                                destinations: image.destinations || null, // { pages: [], folderColors: [] } or null for all
                                createdAt: Date.now()
                            }]
                        }
                        : folder
                )
            })),
            removeLayer2Image: (folderId, imageId) => set((state) => ({
                layer2Folders: state.layer2Folders.map(folder =>
                    folder.id === folderId
                        ? { ...folder, images: folder.images.filter(img => img.id !== imageId) }
                        : folder
                )
            })),
            updateLayer2Image: (folderId, imageId, updates) => set((state) => ({
                layer2Folders: state.layer2Folders.map(folder =>
                    folder.id === folderId
                        ? {
                            ...folder,
                            images: folder.images.map(img =>
                                img.id === imageId ? { ...img, ...updates } : img
                            )
                        }
                        : folder
                )
            })),
            applyLayer2Image: (image) => set({
                customPageBannerImage2: image.image,
                pageBannerImage2Scale: image.scale,
                pageBannerImage2XOffset: image.xOffset,
                pageBannerImage2YOffset: image.yOffset
            }),
            // Group management for Layer 2 images
            // groupLeaderId: ID of the layer2 image that is the group leader (format: "folderId:imageId")
            // groupMembers: Array of image IDs that belong to this group (format: "folderId:imageId")
            assignLayer2ToGroup: (imageId, folderId, groupLeaderId, groupLeaderFolderId) => set((state) => {
                const currentImageKey = `${folderId}:${imageId}`;
                const leaderKey = `${groupLeaderFolderId}:${groupLeaderId}`;

                // Find the leader image to get its current members
                let leaderImage = null;
                state.layer2Folders.forEach(folder => {
                    if (folder.id === groupLeaderFolderId) {
                        const img = folder.images.find(i => i.id === groupLeaderId);
                        if (img) {
                            leaderImage = { ...img, folderId: folder.id };
                        }
                    }
                });

                const currentMembers = leaderImage?.groupMembers || [];
                const isAlreadyMember = currentMembers.includes(currentImageKey);

                return {
                    layer2Folders: state.layer2Folders.map(folder => {
                        if (folder.id === groupLeaderFolderId) {
                            // Update leader image's member list
                            return {
                                ...folder,
                                images: folder.images.map(img =>
                                    img.id === groupLeaderId
                                        ? {
                                            ...img,
                                            groupMembers: isAlreadyMember
                                                ? currentMembers.filter(id => id !== currentImageKey)
                                                : [...currentMembers, currentImageKey]
                                        }
                                        : img
                                )
                            };
                        } else if (folder.id === folderId) {
                            // Update the image being assigned (only if it's not the leader itself)
                            if (imageId !== groupLeaderId || folderId !== groupLeaderFolderId) {
                                return {
                                    ...folder,
                                    images: folder.images.map(img =>
                                        img.id === imageId
                                            ? {
                                                ...img,
                                                groupLeaderId: isAlreadyMember ? null : leaderKey
                                            }
                                            : img
                                    )
                                };
                            }
                        }
                        return folder;
                    })
                };
            }),

            // Layer 2 Color Assignments (Image -> Color)
            // Maps a color (e.g. 'red', 'blue') to a specific imageId within a folder
            assignLayer2ImageToColor: (folderId, colorId, imageId) => set((state) => ({
                layer2Folders: state.layer2Folders.map(folder =>
                    folder.id === folderId
                        ? {
                            ...folder,
                            colorAssignments: {
                                ...(folder.colorAssignments || {}),
                                [colorId]: imageId
                            }
                        }
                        : folder
                )
            })),
            // Move image between folders and update references
            moveLayer2Image: (imageId, oldFolderId, newFolderId) => set((state) => {
                if (oldFolderId === newFolderId) return state;

                const oldFolder = state.layer2Folders.find(f => f.id === oldFolderId);
                const imageToMove = oldFolder?.images.find(i => i.id === imageId);

                if (!oldFolder || !imageToMove) return state;

                const getNewKey = (id) => `${newFolderId}:${id}`;
                const getOldKey = (id) => `${oldFolderId}:${id}`;

                // Calculate updated state in steps
                let newState = {
                    layer2Folders: state.layer2Folders.map(folder => {
                        // 1. Remove from old folder
                        if (folder.id === oldFolderId) {
                            return {
                                ...folder,
                                images: folder.images.filter(i => i.id !== imageId),
                                colorAssignments: Object.fromEntries(
                                    Object.entries(folder.colorAssignments || {}).filter(([_, id]) => id !== imageId)
                                )
                            };
                        }
                        // 2. Add to new folder
                        if (folder.id === newFolderId) {
                            return {
                                ...folder,
                                images: [...folder.images, imageToMove]
                            };
                        }
                        return folder;
                    })
                };

                // 3. Update References (Deep Scan)
                newState.layer2Folders = newState.layer2Folders.map(folder => ({
                    ...folder,
                    images: folder.images.map(img => {
                        // Case A: We moved a LEADER. Update MEMBERS.
                        if (img.groupLeaderId === getOldKey(imageId)) {
                            return { ...img, groupLeaderId: getNewKey(imageId) };
                        }

                        // Case B: We moved a MEMBER. Update LEADER.
                        if (img.groupMembers && img.groupMembers.includes(getOldKey(imageId))) {
                            return {
                                ...img,
                                groupMembers: img.groupMembers.map(m => m === getOldKey(imageId) ? getNewKey(imageId) : m)
                            };
                        }

                        return img;
                    })
                }));

                return newState;
            }),

            // Move group (leader + members) to a new folder
            moveGroupToFolder: (leaderId, leaderFolderId, targetFolderId) => set((state) => {
                if (leaderFolderId === targetFolderId) return state;

                // 1. Find Leader and Members
                const sourceFolder = state.layer2Folders.find(f => f.id === leaderFolderId);
                if (!sourceFolder) return state;

                const leaderImage = sourceFolder.images.find(img => img.id === leaderId);
                if (!leaderImage) return state;

                const memberKeys = leaderImage.groupMembers || [];
                // memberKey format: "folderId:imageId"

                // 2. Build list of all images to move (Leader + Members)
                const itemsToMove = [];

                // Add Leader
                itemsToMove.push({
                    imageId: leaderId,
                    folderId: leaderFolderId,
                    imageObj: leaderImage,
                    isLeader: true
                });

                // Add Members
                memberKeys.forEach(key => {
                    const [mFolderId, mImageId] = key.split(':');
                    const mFolder = state.layer2Folders.find(f => f.id === mFolderId);
                    if (mFolder) {
                        const mImage = mFolder.images.find(i => i.id === mImageId);
                        if (mImage) {
                            itemsToMove.push({
                                imageId: mImageId,
                                folderId: mFolderId,
                                imageObj: mImage,
                                isLeader: false
                            });
                        }
                    }
                });

                // 3. Construct new state: Remove from old locations, Add to new location, Update Refs
                const getNewKey = (id) => `${targetFolderId}:${id}`;

                // Create a map for quick reference update of moving items
                // OldKey -> NewKey
                const keyMap = {};
                itemsToMove.forEach(item => {
                    keyMap[`${item.folderId}:${item.imageId}`] = `${targetFolderId}:${item.imageId}`;
                });

                // Helper to update a single key if it was moved
                const updateKey = (key) => keyMap[key] || key;


                const newState = {
                    layer2Folders: state.layer2Folders.map(folder => {
                        let newImages = [...folder.images];
                        let hasChanges = false;

                        // A. Remove items moving OUT of this folder
                        const itemsRemoving = itemsToMove.filter(i => i.folderId === folder.id);
                        if (itemsRemoving.length > 0) {
                            newImages = newImages.filter(img => !itemsRemoving.find(ir => ir.imageId === img.id));
                            hasChanges = true;
                        }

                        // B. Add items moving INTO this folder (only if it's the target)
                        if (folder.id === targetFolderId) {
                            const itemsAdding = itemsToMove.map(i => {
                                // We need to update the image object's internal refs (if they point to moved items)
                                // But we'll do a global pass for refs in step C.
                                // Here just put the object in.
                                return i.imageObj;
                            });
                            newImages = [...newImages, ...itemsAdding];
                            hasChanges = true;
                        }

                        // C. Update References for ALL images (whether moved or not)
                        // Because some images might reference the moved items
                        newImages = newImages.map(img => {
                            let updatedImg = { ...img };
                            let imgChanged = false;

                            // Update groupLeaderId reference
                            if (updatedImg.groupLeaderId && keyMap[updatedImg.groupLeaderId]) {
                                updatedImg.groupLeaderId = keyMap[updatedImg.groupLeaderId];
                                imgChanged = true;
                            }

                            // Update groupMembers references
                            if (updatedImg.groupMembers && updatedImg.groupMembers.length > 0) {
                                const newMembers = updatedImg.groupMembers.map(m => keyMap[m] || m);
                                // Check if changed (simple length check or deep compare not needed if map is pure)
                                // Just assign.
                                if (JSON.stringify(newMembers) !== JSON.stringify(updatedImg.groupMembers)) {
                                    updatedImg.groupMembers = newMembers;
                                    imgChanged = true;
                                }
                            }

                            return imgChanged ? updatedImg : img;
                        });

                        return { ...folder, images: newImages };
                    })
                };

                return newState;
            }),
            // Automatically migrate groups in 'default' to their own folders
            separateGroupsIntoFolders: () => set((state) => {
                const defaultFolder = state.layer2Folders.find(f => f.id === 'default');
                if (!defaultFolder) return state;

                const newFolders = [];
                let remainingImages = [...defaultFolder.images];
                let hasChanges = false;

                // Identify Group Leaders
                const leaders = defaultFolder.images.filter(img => img.groupMembers && img.groupMembers.length > 0);

                if (leaders.length === 0) return state; // Nothing to do

                leaders.forEach((leader, idx) => {
                    hasChanges = true;
                    const folderId = Date.now().toString() + idx; // Ensure unique IDs if multiple
                    const memberIds = leader.groupMembers.map(m => m.split(':')[1]); // extract imageId from 'folderId:imageId'

                    // Identify images to move (Leader + Members)
                    const imagesToMove = defaultFolder.images.filter(img =>
                        img.id === leader.id || memberIds.includes(img.id)
                    );

                    // Create new folder
                    newFolders.push({
                        id: folderId,
                        name: `Group ${idx + 1}`,
                        images: imagesToMove,
                        playlistIds: [],
                        isThemeFolder: false,
                        condition: null,
                        folderColors: [],
                        colorAssignments: {}
                    });

                    // Remove from remaining images
                    remainingImages = remainingImages.filter(img =>
                        img.id !== leader.id && !memberIds.includes(img.id)
                    );
                });

                if (!hasChanges) return state;

                return {
                    layer2Folders: [
                        // Update default folder with remaining images
                        ...state.layer2Folders.map(f => f.id === 'default' ? { ...f, images: remainingImages } : f),
                        // Append new folders
                        ...newFolders
                    ]
                };
            }),
            unassignLayer2ImageFromColor: (folderId, colorId) => set((state) => {
                return {
                    layer2Folders: state.layer2Folders.map(folder => {
                        if (folder.id === folderId && folder.colorAssignments) {
                            const newAssignments = { ...folder.colorAssignments };
                            delete newAssignments[colorId];
                            return { ...folder, colorAssignments: newAssignments };
                        }
                        return folder;
                    })
                };
            }),

            // Per-Playlist Layer 2 Image Overrides
            // Maps playlistId -> { image, scale, xOffset, yOffset, imageId, folderId, bgColor }
            // If a playlist has an override, it uses that image instead of the default
            // bgColor stores the Layer 1 background color at the time of selection
            playlistLayer2Overrides: {},
            setPlaylistLayer2Override: (playlistId, imageConfig) => set((state) => ({
                playlistLayer2Overrides: {
                    ...state.playlistLayer2Overrides,
                    [playlistId]: imageConfig
                }
            })),
            clearPlaylistLayer2Override: (playlistId) => set((state) => {
                const newOverrides = { ...state.playlistLayer2Overrides };
                delete newOverrides[playlistId];
                return { playlistLayer2Overrides: newOverrides };
            }),

            // Player Border Pattern
            playerBorderPattern: 'diagonal',
            setPlayerBorderPattern: (val) => set({ playerBorderPattern: val }),

            // Fullscreen player width (percent of content area; remainder is margin on the right)
            fullscreenPlayerWidthPercent: 75,
            setFullscreenPlayerWidthPercent: (val) => set({ fullscreenPlayerWidthPercent: val }),

            // Visualizer Gradient
            visualizerGradient: true,
            setVisualizerGradient: (val) => set({ visualizerGradient: val }),

            // Visualizer Sensitivity
            visualizerSensitivity: 1.0,
            setVisualizerSensitivity: (val) => set({ visualizerSensitivity: val }),

            // Visualizer Color (Hex string, default is white '#ffffff')
            visualizerColor: '#ffffff',
            setVisualizerColor: (val) => set({ visualizerColor: val }),

            // Quick Assign Slots
            quickAssignSlots: [
                { id: null, name: null },
                { id: null, name: null },
                { id: null, name: null },
                { id: null, name: null }
            ],
            setQuickAssignSlot: (index, playlistId, playlistName) => set((state) => {
                const newSlots = [...(state.quickAssignSlots || [
                    { id: null, name: null },
                    { id: null, name: null },
                    { id: null, name: null },
                    { id: null, name: null }
                ])];
                newSlots[index] = { id: playlistId || null, name: playlistName || null };
                return { quickAssignSlots: newSlots };
            }),

            // Visualizer Mode ('bar' | 'light' | 'light2' | 'bubble')
            visualizerMode: 'light2',
            setVisualizerMode: (val) => set({ visualizerMode: val }),

            // Unified Banner State (Calculated)
            bannerHeight: 0,
            setBannerHeight: (val) => set({ bannerHeight: val }),
            bannerBgSize: '100% auto',
            setBannerBgSize: (val) => set({ bannerBgSize: val }),

            // YouTube API Key
            youtubeApiKey: null,
            setYoutubeApiKey: (val) => set({ youtubeApiKey: val }),
        }), {
        name: 'config-storage-v12', // Bump version for migration
        storage: createJSONStorage(() => idbStorage),
        version: 13,
        migrate: (persistedState, version) => {
            let newState = persistedState;

            if (version < 12) {
                // Migrate from v<12 (flat banner) to v12 (dual banner)
                const oldBannerState = {
                    image: newState.customBannerImage ?? null,
                    verticalPosition: newState.bannerVerticalPosition ?? 0,
                    scale: newState.bannerScale ?? 100,
                    spillHeight: newState.bannerSpillHeight ?? 0,
                    maskPath: newState.bannerMaskPath || [],
                    scrollEnabled: newState.bannerScrollEnabled ?? true,
                    clipLeft: newState.bannerClipLeft ?? 0,
                    horizontalOffset: newState.bannerHorizontalOffset ?? 0,
                    playerControllerXOffset: newState.playerControllerXOffset ?? 0, // Include offset in migration
                };

                newState = {
                    ...newState,
                    fullscreenBanner: { ...oldBannerState },
                    splitscreenBanner: { ...oldBannerState },
                };
            } else if (version < 13) {
                // Migrate from v12 (dual banner check) to v13 (add playerControllerXOffset to banners)
                // We grab the existing active offset and apply it to both as a starting point
                const currentOffset = newState.playerControllerXOffset ?? 0;

                newState = {
                    ...newState,
                    fullscreenBanner: {
                        ...newState.fullscreenBanner,
                        playerControllerXOffset: currentOffset
                    },
                    splitscreenBanner: {
                        ...newState.splitscreenBanner,
                        playerControllerXOffset: currentOffset
                    }
                };
            }

            return newState;
        },
    }
    )
);

if (typeof window !== 'undefined') {
  window.useConfigStore = useConfigStore;
}
