import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Sliders, Box, Layers, Grid, Palette, Layout, FileImage, Folder, Plus, Smile, Check, Settings, Trash2, Music, X, ZoomIn, Move, Maximize, MousePointer2, LayoutGrid } from 'lucide-react';
import OrbGroupColumn from './OrbGroupColumn';
import PageGroupColumn from './PageGroupColumn';
import OrbCropModal from './OrbCropModal';
import { usePlaylistStore } from '../store/playlistStore';
import { FOLDER_COLORS } from '../utils/folderColors';
import { useLayoutStore } from '../store/layoutStore';
import { useConfigStore } from '../store/configStore';
import { saveImageToCache } from '../api/platformBridge';


const AssetManagerPage = () => {
    // Global State
    const {
        layer2Folders,
        orbFavorites,
        customOrbImage,
        setCustomOrbImage, // Added setter
        applyLayer2Image,
        pageBannerBgColor, setPageBannerBgColor,
        applyOrbFavorite,
        // Orb Config State
        isSpillEnabled, setIsSpillEnabled,
        orbSpill, setOrbSpill,
        orbImageScale, setOrbImageScale,
        orbImageXOffset, setOrbImageXOffset,
        orbImageYOffset, setOrbImageYOffset,
        addOrbFavorite,
        removeOrbFavorite,
        updateOrbFavoriteFolders,
        updateOrbFavoritePlaylists,
        assignOrbToGroup,
        orbAdvancedMasks, setOrbAdvancedMasks,
        orbMaskRects, setOrbMaskRects,
        // Page Banner Config State
        customPageBannerImage2, setCustomPageBannerImage2,
        pageBannerImage2Scale, setPageBannerImage2Scale,
        pageBannerImage2XOffset, setPageBannerImage2XOffset,
        pageBannerImage2YOffset, setPageBannerImage2YOffset,
        addLayer2Image, updateLayer2Image, removeLayer2Image,
        assignLayer2ToGroup
    } = useConfigStore();

    const allPlaylists = usePlaylistStore(state => state.allPlaylists);

    // Local State
    const [activeTab, setActiveTab] = useState('orb');

    // Orb Tab State
    const [hoveredFavoriteId, setHoveredFavoriteId] = useState(null);
    const [folderAssignmentOpenId, setFolderAssignmentOpenId] = useState(null);
    const [playlistAssignmentOpenId, setPlaylistAssignmentOpenId] = useState(null);
    const [orbColumnLeaderId, setOrbColumnLeaderId] = useState(null); // ID of orb group leader column
    const [selectedOrbGroupLeaderId, setSelectedOrbGroupLeaderId] = useState(''); // ID for "Save to Group" dropdown
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    // Page Tab State
    const [pageColumnLeaderId, setPageColumnLeaderId] = useState(null); // ID of page group leader column (structure: { id, folderId })
    const [selectedPageGroupLeaderId, setSelectedPageGroupLeaderId] = useState(''); // ID string "folderId:imageId" for dropdown
    const [editingPageBannerId, setEditingPageBannerId] = useState(null);
    const [editingPageBannerFolderId, setEditingPageBannerFolderId] = useState(null);

    const horizontalScrollRef = useRef(null);

    const handleOrbImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const cachedUrl = await saveImageToCache(reader.result, 'orb');
                setCustomOrbImage(cachedUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCurrentOrbAsFavorite = (targetLeaderId = null) => {
        if (!customOrbImage) return;

        const newId = Date.now().toString();

        addOrbFavorite({
            id: newId,
            customOrbImage,
            isSpillEnabled,
            orbSpill: { ...orbSpill },
            orbImageScale,
            orbImageXOffset,
            orbImageYOffset,
            orbAdvancedMasks: { ...orbAdvancedMasks },
            orbMaskRects: JSON.parse(JSON.stringify(orbMaskRects)), // Deep copy
        });

        if (targetLeaderId) {
            assignOrbToGroup(newId, targetLeaderId);
        }
    };

    const handlePageBannerUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const cachedUrl = await saveImageToCache(reader.result, 'banner');
                setCustomPageBannerImage2(cachedUrl);
                setEditingPageBannerId(null);
                setEditingPageBannerFolderId(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSavePageBanner = (targetLeaderStr = null) => {
        if (!customPageBannerImage2) return;

        const newId = Date.now().toString();

        const bannerData = {
            id: editingPageBannerId || newId,
            image: customPageBannerImage2,
            scale: pageBannerImage2Scale,
            xOffset: pageBannerImage2XOffset,
            yOffset: pageBannerImage2YOffset,
            bgColor: pageBannerBgColor
        };

        if (editingPageBannerId && editingPageBannerFolderId) {
            updateLayer2Image(editingPageBannerFolderId, editingPageBannerId, bannerData);
            setEditingPageBannerId(null);
            setEditingPageBannerFolderId(null);
            setCustomPageBannerImage2(null);
        } else {
            // Add to default folder or first available folder
            const targetFolder = layer2Folders.find(f => f.id === 'default') || layer2Folders[0];
            if (targetFolder) {
                addLayer2Image(targetFolder.id, bannerData);

                // Assign to group if requested
                if (targetLeaderStr) {
                    const [leaderFolderId, leaderId] = targetLeaderStr.split(':');
                    assignLayer2ToGroup(newId, targetFolder.id, leaderId, leaderFolderId);
                }
            }
        }
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (folderAssignmentOpenId && !e.target.closest('.folder-assignment-menu')) {
                setFolderAssignmentOpenId(null);
            }
            if (playlistAssignmentOpenId && !e.target.closest('.playlist-assignment-menu')) {
                setPlaylistAssignmentOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [folderAssignmentOpenId, playlistAssignmentOpenId]);

    // Horizontal Scroll Wheel Handler
    useEffect(() => {
        // Only attach when orb tab is active
        if (activeTab !== 'orb') return;

        const container = horizontalScrollRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
            if (hasHorizontalScroll) {
                e.preventDefault();
                e.stopPropagation();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [activeTab]);

    const toggleSpillQuadrant = (q) => {
        setOrbSpill({ ...orbSpill, [q]: !orbSpill[q] });
    };

    const toggleFolderAssignment = (favoriteId, folderColorId) => {
        const favorite = orbFavorites.find(f => f.id === favoriteId);
        if (!favorite) return;

        const currentFolders = favorite.folderColors || [];
        const newFolders = currentFolders.includes(folderColorId)
            ? currentFolders.filter(id => id !== folderColorId)
            : [...currentFolders, folderColorId];

        updateOrbFavoriteFolders(favoriteId, newFolders);
    };

    const togglePlaylistAssignment = (favoriteId, playlistName) => {
        const favorite = orbFavorites.find(f => f.id === favoriteId);
        if (!favorite) return;

        const currentPlaylists = favorite.playlistIds || [];
        const newPlaylists = currentPlaylists.includes(playlistName)
            ? currentPlaylists.filter(name => name !== playlistName)
            : [...currentPlaylists, playlistName];

        updateOrbFavoritePlaylists(favoriteId, newPlaylists);
    };


    // Mock data for carousel (not used but kept for now)
    const folders = [
        { id: 1, name: 'Cyberpunk', count: 12, color: 'from-pink-500 to-rose-500' },
        { id: 2, name: 'Nature', count: 8, color: 'from-emerald-400 to-green-600' },
        { id: 3, name: 'Abstract', count: 24, color: 'from-blue-400 to-indigo-600' },
        { id: 4, name: 'Minimal', count: 5, color: 'from-slate-300 to-slate-500' },
        { id: 5, name: 'Neon', count: 15, color: 'from-purple-400 to-fuchsia-600' },
    ];

    const files = [
        { id: 1, name: 'Banner_01.png', type: 'image' },
        { id: 2, name: 'Banner_02.png', type: 'image' },
        { id: 3, name: 'Banner_03.png', type: 'image' },
        { id: 4, name: 'Banner_04.png', type: 'image' },
    ];

    // Colors for palette
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
    ];

    return (
        <div className="h-full w-full bg-[#e0f2fe] flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">

            {/* Header: 4-Tab Navigation (Centered at top) */}
            <div className="flex items-center justify-center px-1">
                <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm">
                    {[
                        { id: 'orb', label: 'Orb', icon: Smile },
                        { id: 'page', label: 'Page', icon: Layout },
                        { id: 'app', label: 'App', icon: Box },
                        { id: 'theme', label: 'Theme', icon: Palette }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-white text-slate-800 shadow-sm scale-105 ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-sky-500' : 'opacity-70'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>





            {/* --- ZONE 2: CAROUSEL (Content Navigation) --- */}
            <div className="flex-1 flex flex-col gap-3 min-h-[300px] shrink-0 relative group/carousel">
                {/* Sub-Navigation: Folder / File (Removed to maximize space) */}
                {/* <div className="flex items-center px-2 gap-4 border-b border-white/40 mx-2">...</div> */}

                {/* SVG Definitions for Orb Clip Paths */}
                {orbFavorites.length > 0 && (
                    <svg width="0" height="0" className="absolute pointer-events-none">
                        <defs>
                            {orbFavorites.map((favorite) => (
                                <clipPath key={favorite.id} id={`assetOrbClipPath-${favorite.id}`} clipPathUnits="objectBoundingBox">
                                    <circle cx="0.5" cy="0.5" r="0.5" />
                                    {/* TL */}
                                    {favorite.isSpillEnabled && favorite.orbSpill?.tl && (
                                        favorite.orbAdvancedMasks?.tl
                                            ? <rect x={favorite.orbMaskRects?.tl.x / 100} y={favorite.orbMaskRects?.tl.y / 100} width={favorite.orbMaskRects?.tl.w / 100} height={favorite.orbMaskRects?.tl.h / 100} />
                                            : <rect x="-50" y="-50" width="50.5" height="50.5" />
                                    )}
                                    {/* TR */}
                                    {favorite.isSpillEnabled && favorite.orbSpill?.tr && (
                                        favorite.orbAdvancedMasks?.tr
                                            ? <rect x={favorite.orbMaskRects?.tr.x / 100} y={favorite.orbMaskRects?.tr.y / 100} width={favorite.orbMaskRects?.tr.w / 100} height={favorite.orbMaskRects?.tr.h / 100} />
                                            : <rect x="0.5" y="-50" width="50.5" height="50.5" />
                                    )}
                                    {/* BL */}
                                    {favorite.isSpillEnabled && favorite.orbSpill?.bl && (
                                        favorite.orbAdvancedMasks?.bl
                                            ? <rect x={favorite.orbMaskRects?.bl.x / 100} y={favorite.orbMaskRects?.bl.y / 100} width={favorite.orbMaskRects?.bl.w / 100} height={favorite.orbMaskRects?.bl.h / 100} />
                                            : <rect x="-50" y="0.5" width="50.5" height="50.5" />
                                    )}
                                    {/* BR */}
                                    {favorite.isSpillEnabled && favorite.orbSpill?.br && (
                                        favorite.orbAdvancedMasks?.br
                                            ? <rect x={favorite.orbMaskRects?.br.x / 100} y={favorite.orbMaskRects?.br.y / 100} width={favorite.orbMaskRects?.br.w / 100} height={favorite.orbMaskRects?.br.h / 100} />
                                            : <rect x="0.5" y="0.5" width="50.5" height="50.5" />
                                    )}
                                </clipPath>
                            ))}
                        </defs>
                    </svg>
                )}

                {/* Scrollable Viewport */}
                <div className="flex-1 overflow-x-auto overflow-y-visible px-1 custom-scrollbar">
                    <div className="flex gap-4 h-full pb-4 w-max items-center">
                        {/* --- PAGE TAB: FOLDERS / LAYERS --- */}
                        {activeTab === 'page' && (
                            (() => {
                                // Flatten images from all folders
                                const allImages = [];
                                layer2Folders.forEach(folder => {
                                    if (folder.images && folder.images.length > 0) {
                                        folder.images.forEach(img => {
                                            // Only include leaders (no groupLeaderId)
                                            if (!img.groupLeaderId) {
                                                allImages.push({
                                                    ...img,
                                                    folderId: folder.id,
                                                    folderName: folder.name
                                                });
                                            }
                                        });
                                    }
                                });

                                if (allImages.length === 0) {
                                    return (
                                        <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                                            <div className="text-center text-slate-400 italic text-sm bg-white/30 px-6 py-4 rounded-xl border border-white/40">
                                                No page banners found.<br />Add images in Page Settings.
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex gap-4 h-full pb-4 items-center overflow-x-auto px-2 custom-scrollbar w-full">
                                        {allImages.map((img) => {
                                            const isActive = customPageBannerImage2 === img.image;

                                            return (
                                                <div
                                                    key={`${img.folderId}-${img.id}`}
                                                    className="relative group flex flex-col items-center"
                                                    style={{ width: '300px', flexShrink: 0 }}
                                                >
                                                    {/* Image Thumbnail */}
                                                    <div className="relative w-full aspect-video mx-auto overflow-hidden rounded-xl border-4 transition-all duration-300 bg-slate-100 shadow-md group-hover:shadow-xl">
                                                        <button
                                                            onClick={() => {
                                                                applyLayer2Image(img);
                                                                if (img.bgColor) setPageBannerBgColor(img.bgColor);
                                                                setEditingPageBannerId(img.id);
                                                                setEditingPageBannerFolderId(img.folderId);
                                                            }}
                                                            className={`w-full h-full transition-all duration-200 relative overflow-hidden ${isActive
                                                                ? 'border-purple-500 ring-4 ring-purple-200 scale-[1.02]'
                                                                : 'border-slate-200 hover:border-purple-300'
                                                                }`}
                                                        >
                                                            <img
                                                                src={img.image}
                                                                alt="Layer 2"
                                                                className="w-full h-full object-cover"
                                                            />

                                                            {/* Glass Overlay on Hover */}
                                                            <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors pointer-events-none" />

                                                            {/* Active Indicator */}
                                                            {isActive && (
                                                                <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
                                                                    <Check className="text-white drop-shadow-xl" size={32} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </button>

                                                        {/* Group Indicator */}
                                                        {img.groupMembers && img.groupMembers.length > 0 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPageColumnLeaderId({ id: img.id, folderId: img.folderId });
                                                                }}
                                                                className="absolute bottom-1 right-1 z-30 bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md hover:bg-purple-600 transition-colors flex items-center gap-1 hover:scale-110"
                                                                title="View Group"
                                                            >
                                                                <LayoutGrid size={8} />
                                                                {img.groupMembers.length}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Quick Info */}
                                                    <div className="mt-2 text-center w-full">
                                                        <p className="text-xs font-bold text-slate-600 truncate px-2">
                                                            {img.folderName}
                                                        </p>
                                                        {img.bgColor && (
                                                            <div className="flex items-center justify-center gap-1 mt-0.5">
                                                                <div className="w-2 h-2 rounded-full border border-slate-300" style={{ backgroundColor: img.bgColor }} />
                                                                <span className="text-[10px] text-slate-400 font-mono uppercase">{img.bgColor}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Delete Button (on hover) */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Delete this page banner?')) {
                                                                removeLayer2Image(img.folderId, img.id);
                                                                if (editingPageBannerId === img.id) {
                                                                    setCustomPageBannerImage2(null);
                                                                    setEditingPageBannerId(null);
                                                                    setEditingPageBannerFolderId(null);
                                                                }
                                                            }
                                                        }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-30 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                                                        title="Delete Banner"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()
                        )}

                        {/* --- ORB TAB: PRESETS (With Horizontal Scroll & Spill Reflection) --- */}
                        {activeTab === 'orb' && (
                            (() => {
                                if (orbFavorites.length === 0) {
                                    return (
                                        <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                                            <div className="text-center text-slate-400 italic text-sm bg-white/30 px-6 py-4 rounded-xl border border-white/40">
                                                No orb presets found.<br />Save presets in Orb Settings.
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        ref={horizontalScrollRef}
                                        className="flex gap-4 h-full pb-2 px-2 overflow-x-auto overflow-y-visible"
                                        style={{
                                            width: '100%',
                                            scrollbarWidth: 'thin',
                                            paddingTop: '12px'
                                        }}
                                    >
                                        {orbFavorites.filter(f => !f.groupLeaderId).map((favorite) => {
                                            const assignedFolders = favorite.folderColors || [];
                                            const isCurrent = customOrbImage === favorite.customOrbImage; // Simple check

                                            return (
                                                <div
                                                    key={favorite.id}
                                                    className="relative group flex flex-col items-center"
                                                    style={{
                                                        zIndex: folderAssignmentOpenId === favorite.id || playlistAssignmentOpenId === favorite.id ? 100 : 'auto',
                                                        width: '200px',
                                                        flexShrink: 0
                                                    }}
                                                    onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                                    onMouseLeave={() => {
                                                        setHoveredFavoriteId(null);
                                                        // Close menus handled by click outside listener, but helps for immediate feedback
                                                    }}
                                                >
                                                    <div className="relative w-full aspect-square mx-auto overflow-visible">
                                                        <button
                                                            onClick={() => applyOrbFavorite(favorite)}
                                                            className={`w-full h-full rounded-full border-4 transition-all duration-200 relative overflow-visible bg-sky-50 ${isCurrent
                                                                ? 'border-sky-500 ring-4 ring-sky-200 shadow-xl scale-110 z-10'
                                                                : 'border-slate-200 hover:border-sky-300 hover:shadow-lg hover:scale-105'
                                                                }`}

                                                            title={favorite.name}
                                                        >
                                                            {/* Image Layer with Spill Reflecting Effect */}
                                                            <div
                                                                className="absolute inset-0 pointer-events-none transition-all duration-300 flex items-center justify-center z-40"
                                                                style={{
                                                                    clipPath: favorite.isSpillEnabled && favorite.orbSpill ? `url(#assetOrbClipPath-${favorite.id})` : 'circle(50% at 50% 50%)',
                                                                    overflow: 'visible'
                                                                }}
                                                            >
                                                                <img
                                                                    src={favorite.customOrbImage}
                                                                    alt={favorite.name}
                                                                    className="max-w-none transition-all duration-300"
                                                                    style={{
                                                                        width: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                        height: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                        transform: favorite.isSpillEnabled ? `translate(${(favorite.orbImageXOffset || 0) * 0.3}px, ${(favorite.orbImageYOffset || 0) * 0.3}px)` : 'none',
                                                                        objectFit: favorite.isSpillEnabled ? 'contain' : 'cover'
                                                                    }}
                                                                />
                                                            </div>

                                                            {/* Glass Overlay */}
                                                            <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                                                                <div className="absolute inset-0 bg-sky-200/10" />
                                                            </div>

                                                            {/* Active Check */}
                                                            {isCurrent && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full z-20 backdrop-blur-[1px]">
                                                                    <Check size={28} className="text-white drop-shadow-xl" strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </button>

                                                        {/* Group Indicator */}
                                                        {favorite.groupMembers && favorite.groupMembers.length > 0 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOrbColumnLeaderId(favorite.id);
                                                                }}
                                                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-40 bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md hover:bg-purple-600 transition-colors flex items-center gap-1 hover:scale-110"
                                                                title="View Group"
                                                            >
                                                                <LayoutGrid size={8} />
                                                                {favorite.groupMembers.length}
                                                            </button>
                                                        )}

                                                        {/* Spill Indicator */}
                                                        {favorite.isSpillEnabled && (
                                                            <div className="absolute top-0 right-0 bg-sky-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full uppercase tracking-wider shadow-sm z-30">
                                                                Spill
                                                            </div>
                                                        )}

                                                        {/* Hover Actions (Folder, Playlist, etc.) */}
                                                        {hoveredFavoriteId === favorite.id && (
                                                            <div className="absolute -top-1 -left-1 flex flex-col gap-1 z-[100]">
                                                                {/* Folder Assign */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFolderAssignmentOpenId(folderAssignmentOpenId === favorite.id ? null : favorite.id);
                                                                    }}
                                                                    className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all ${assignedFolders.length > 0
                                                                        ? 'bg-sky-500 hover:bg-sky-600 text-white'
                                                                        : 'bg-slate-400 hover:bg-slate-500 text-white'
                                                                        }`}
                                                                    title="Assign to folders"
                                                                >
                                                                    <Folder size={10} />
                                                                </button>

                                                                {/* Playlist Assign */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPlaylistAssignmentOpenId(playlistAssignmentOpenId === favorite.id ? null : favorite.id);
                                                                    }}
                                                                    className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all ${favorite.playlistIds?.length > 0
                                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                        : 'bg-slate-400 hover:bg-slate-500 text-white'
                                                                        }`}
                                                                    title="Assign to Playlists"
                                                                >
                                                                    <Music size={10} />
                                                                </button>

                                                                {/* Folder Menu */}
                                                                {folderAssignmentOpenId === favorite.id && (
                                                                    <div className="folder-assignment-menu absolute top-6 left-0 bg-white border-2 border-slate-200 rounded-lg p-2 shadow-xl z-[100] min-w-[160px]">
                                                                        <div className="text-[9px] font-bold uppercase text-slate-400 mb-2">Assign to Folders</div>
                                                                        <div className="grid grid-cols-4 gap-1">
                                                                            {FOLDER_COLORS.map((color) => {
                                                                                const isAssigned = assignedFolders.includes(color.id);
                                                                                return (
                                                                                    <button
                                                                                        key={color.id}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleFolderAssignment(favorite.id, color.id);
                                                                                        }}
                                                                                        className={`w-6 h-6 rounded border-2 transition-all ${isAssigned
                                                                                            ? 'border-black ring-2 ring-sky-300 scale-110'
                                                                                            : 'border-slate-300 hover:border-slate-400'
                                                                                            }`}
                                                                                        style={{ backgroundColor: color.hex }}
                                                                                    >
                                                                                        {isAssigned && (
                                                                                            <Check size={10} className="text-white drop-shadow-md mx-auto" />
                                                                                        )}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Playlist Menu */}
                                                                {playlistAssignmentOpenId === favorite.id && (
                                                                    <div className="playlist-assignment-menu absolute top-6 left-6 bg-white border-2 border-slate-200 rounded-lg p-2 shadow-xl z-[100] min-w-[180px] max-h-[200px] overflow-hidden flex flex-col">
                                                                        <div className="text-[9px] font-bold uppercase text-slate-400 mb-2 px-1">Assign to Playlists</div>
                                                                        <div className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar">
                                                                            {allPlaylists.map((playlist) => {
                                                                                const isAssigned = favorite.playlistIds?.includes(playlist.id);
                                                                                return (
                                                                                    <button
                                                                                        key={playlist.id}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            togglePlaylistAssignment(favorite.id, playlist.id);
                                                                                        }}
                                                                                        className={`w-full text-left px-2 py-1 rounded-md text-[9px] font-bold transition-all flex items-center justify-between ${isAssigned
                                                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                                            : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                                                                                            }`}
                                                                                    >
                                                                                        <span className="truncate flex-1">{playlist.name}</span>
                                                                                        {isAssigned && <Check size={10} className="text-amber-500 ml-2" />}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Delete Button (on hover) */}
                                                        {hoveredFavoriteId === favorite.id && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm('Delete this preset?')) {
                                                                        removeOrbFavorite(favorite.id);
                                                                    }
                                                                }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-40"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Name Label */}
                                                    <div className="text-center px-1 mt-1">
                                                        <p className={`text-[10px] font-bold truncate transition-colors ${isCurrent ? 'text-sky-600' : 'text-slate-600'}`}>
                                                            {favorite.name || 'Untitled Orb'}
                                                        </p>
                                                        <p className="text-[9px] text-slate-400">
                                                            {favorite.groupMembers?.length > 0 ? `${favorite.groupMembers.length + 1} variants` : 'Preset'}
                                                        </p>
                                                    </div>

                                                    {/* Assigned Folder Dots */}
                                                    {
                                                        assignedFolders.length > 0 && (
                                                            <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-0.5">
                                                                {assignedFolders.slice(0, 3).map((folderId) => {
                                                                    const color = FOLDER_COLORS.find(c => c.id === folderId);
                                                                    if (!color) return null;
                                                                    return (
                                                                        <div
                                                                            key={folderId}
                                                                            className="w-2 h-2 rounded-full border border-white/50 shadow-sm"
                                                                            style={{ backgroundColor: color.hex }}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()
                        )}

                        {/* --- APP TAB (Placeholder) --- */}
                        {activeTab === 'app' && (
                            <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                                <div className="text-center text-slate-400 italic text-sm bg-white/30 px-6 py-4 rounded-xl border border-white/40">
                                    App assets coming soon.
                                </div>
                            </div>
                        )}

                        {/* --- THEME TAB (Placeholder) --- */}
                        {activeTab === 'theme' && (
                            <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                                <div className="text-center text-slate-400 italic text-sm bg-white/30 px-6 py-4 rounded-xl border border-white/40">
                                    Theme configuration coming soon.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ZONE 3: CONFIGURATION (Fine-Tuning) --- */}
            <div className="h-48 shrink-0 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-4 flex gap-4">
                {activeTab === 'orb' ? (
                    // --- ORB CONFIG CONTENT ---
                    <>
                        <div className="w-40 bg-slate-100/80 rounded-xl p-3 flex flex-col gap-3 border border-slate-200/50 justify-center items-center">
                            <div className="relative w-28 h-28 border-2 border-slate-300/50 rounded-xl overflow-visible bg-slate-200/50 select-none group">
                                {customOrbImage ? (
                                    <>
                                        {/* Preview Image */}
                                        {/* Preview Image - HIDDEN as per user request, but kept in DOM for structure if needed, or we can just remove it visually */}
                                        {/* User explicitly asked: "no need to show orb image on the quadrant menu" */}
                                        {/* We will hide the image opacity but keep the container layout stable */}
                                        <div className="absolute inset-0 bg-slate-300/50" />

                                        {/* Hidden SVG Definitions for Clip Path */}
                                        <svg width="0" height="0" className="absolute">
                                            <defs>
                                                <clipPath id="settingVisualizerClipManager" clipPathUnits="objectBoundingBox">
                                                    <circle cx="0.5" cy="0.5" r="0.35" />
                                                    {['tl', 'tr', 'bl', 'br'].map(q => (
                                                        orbSpill[q] && (
                                                            orbAdvancedMasks[q]
                                                                ? <rect key={q} x={orbMaskRects[q].x / 100} y={orbMaskRects[q].y / 100} width={orbMaskRects[q].w / 100} height={orbMaskRects[q].h / 100} />
                                                                : <rect key={q} x={q.includes('l') ? -0.5 : 0.5} y={q.includes('t') ? -0.5 : 0.5} width="0.505" height="0.505" />
                                                        )
                                                    ))}
                                                </clipPath>
                                            </defs>
                                        </svg>

                                        {/* Quadrant Toggles Overlay */}
                                        <div className="absolute inset-0 z-20 grid grid-cols-2 grid-rows-2">
                                            {['tl', 'tr', 'bl', 'br'].map((q) => (
                                                <button
                                                    key={q}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSpillQuadrant(q);
                                                    }}
                                                    className={`
                                                        relative border-dashed border-white/30 transition-all duration-200 hover:bg-sky-500/20 active:scale-95 flex items-center justify-center
                                                        ${q === 'tl' ? 'border-r border-b rounded-tl-xl' : ''}
                                                        ${q === 'tr' ? 'border-l border-b rounded-tr-xl' : ''}
                                                        ${q === 'bl' ? 'border-r border-t rounded-bl-xl' : ''}
                                                        ${q === 'br' ? 'border-l border-t rounded-br-xl' : ''}
                                                        ${orbSpill[q] ? 'bg-sky-500/30' : ''}
                                                    `}
                                                >
                                                    {orbSpill[q] && (
                                                        <div className="p-0.5 bg-sky-500 rounded-full text-white shadow-sm">
                                                            <Check size={8} strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-bold uppercase text-center p-2">
                                        No Image
                                    </div>
                                )}

                                {/* Advanced Crop Trigger */}
                                <button
                                    onClick={() => setIsCropModalOpen(true)}
                                    className="absolute top-1 right-1 z-30 p-1 bg-black/40 hover:bg-sky-500 text-white rounded transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                    title="Advanced Crop"
                                >
                                    <Maximize size={10} />
                                </button>
                            </div>

                            {/* Spill & Upload Controls */}
                            <div className="flex flex-col gap-2 w-full">
                                {/* Spill Toggle */}
                                <button
                                    onClick={() => setIsSpillEnabled(!isSpillEnabled)}
                                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border shadow-sm flex items-center justify-center gap-2 ${isSpillEnabled
                                        ? 'bg-sky-500 text-white border-sky-400 hover:bg-sky-600'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:text-sky-600'
                                        }`}
                                    title="Toggle Spill Effect"
                                >
                                    <Layers size={12} />
                                    {isSpillEnabled ? 'Spill Enabled' : 'Spill Disabled'}
                                </button>

                                {/* Upload / Remove Row */}
                                <div className="flex gap-2 w-full justify-center">
                                    <label className="flex-1 py-1.5 bg-white border border-slate-200 hover:border-sky-400 hover:text-sky-600 text-slate-500 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                        <Plus size={12} />
                                        Upload
                                        <input
                                            type="file"
                                            onChange={handleOrbImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </label>
                                    {customOrbImage && (
                                        <button
                                            onClick={() => setCustomOrbImage(null)}
                                            className="w-8 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg transition-all flex items-center justify-center"
                                            title="Remove Image"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Orb Properties (Sliders & Save) */}
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 content-center">
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><ZoomIn size={10} /> Scale</span>
                                        <span className="font-mono text-slate-500">{orbImageScale.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                        value={orbImageScale}
                                        onChange={(e) => setOrbImageScale(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                </div>
                                <div className="flex flex-col justify-center opacity-50 pointer-events-none">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><Layers size={10} /> Opacity</span>
                                        <span className="font-mono text-slate-500">100%</span>
                                    </div>
                                    <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" disabled />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><Move size={10} /> X-Offset</span>
                                        <span className="font-mono text-slate-500">{orbImageXOffset}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={orbImageXOffset}
                                        onChange={(e) => setOrbImageXOffset(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><Move size={10} /> Y-Offset</span>
                                        <span className="font-mono text-slate-500">{orbImageYOffset}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={orbImageYOffset}
                                        onChange={(e) => setOrbImageYOffset(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => {
                                            setOrbImageScale(1);
                                            setOrbImageXOffset(0);
                                            setOrbImageYOffset(0);
                                        }}
                                        className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                    >
                                        <Trash2 size={12} /> Reset
                                    </button>

                                    <button
                                        onClick={() => handleSaveCurrentOrbAsFavorite(null)}
                                        disabled={!customOrbImage}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all
                                            ${customOrbImage
                                                ? 'bg-sky-500 hover:bg-sky-600 text-white hover:shadow-md active:scale-95'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                        `}
                                    >
                                        <Smile size={12} />
                                        Save as New Leader
                                    </button>
                                </div>

                                {/* Save to Existing Group */}
                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                    <select
                                        value={selectedOrbGroupLeaderId}
                                        onChange={(e) => setSelectedOrbGroupLeaderId(e.target.value)}
                                        className="flex-1 bg-white border border-slate-200 text-slate-600 text-[10px] rounded px-2 py-1 outline-none focus:border-sky-400"
                                    >
                                        <option value="">Select Group Leader...</option>
                                        {orbFavorites
                                            .filter(f => !f.groupLeaderId) // Only show potential leaders (not subordinates)
                                            .map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))
                                        }
                                    </select>
                                    <button
                                        onClick={() => handleSaveCurrentOrbAsFavorite(selectedOrbGroupLeaderId)}
                                        disabled={!customOrbImage || !selectedOrbGroupLeaderId}
                                        className={`
                                            px-3 py-1 text-[10px] font-bold uppercase rounded transition-all flex items-center gap-1
                                            ${customOrbImage && selectedOrbGroupLeaderId
                                                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                                        `}
                                    >
                                        <Plus size={10} />
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'page' ? (
                    // --- PAGE CONFIG CONTENT ---
                    <>
                        {/* Column 1: Visualizer & Actions (Mimicking Orb Tab) */}
                        <div className="w-40 bg-slate-100/80 rounded-xl p-3 flex flex-col gap-3 border border-slate-200/50 justify-center items-center">
                            <div className="relative w-full aspect-video border-2 border-slate-300/50 rounded-xl overflow-hidden bg-slate-200/50 select-none group">
                                {customPageBannerImage2 ? (
                                    <>
                                        <img
                                            src={customPageBannerImage2}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            style={{
                                                transform: `scale(${pageBannerImage2Scale}) translate(${pageBannerImage2XOffset}px, ${pageBannerImage2YOffset}px)`
                                            }}
                                        />
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-bold uppercase text-center p-2">
                                        No Image
                                    </div>
                                )}
                            </div>

                            {/* Upload / Remove Controls */}
                            <div className="flex gap-2 w-full justify-center">
                                <label className="flex-1 py-1.5 bg-white border border-slate-200 hover:border-sky-400 hover:text-sky-600 text-slate-500 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                    <Plus size={12} />
                                    Upload
                                    <input
                                        type="file"
                                        onChange={handlePageBannerUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </label>
                                {customPageBannerImage2 && (
                                    <button
                                        onClick={() => setCustomPageBannerImage2(null)}
                                        className="w-8 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg transition-all flex items-center justify-center"
                                        title="Remove Image"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Column 2: Properties & Adjustments */}
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 content-center">
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><ZoomIn size={10} /> Scale</span>
                                        <span className="font-mono text-slate-500">{pageBannerImage2Scale}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="200"
                                        step="1"
                                        value={pageBannerImage2Scale}
                                        onChange={(e) => setPageBannerImage2Scale(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><Palette size={10} /> BG Color</span>
                                        <span className="font-mono text-slate-500 uppercase">{pageBannerBgColor || 'None'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {colors.slice(0, 8).map((c, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setPageBannerBgColor(c.replace('bg-', '#').replace('-500', ''))} // Rough mapping or pass hex directly if your colors array has hex. The existing 'colors' array has classes like 'bg-red-500'. We need to be careful.
                                                // Actually, PagePage creates hexes or uses a picker.
                                                // Looking at AssetManagerPage, `colors` is an array of classes: 'bg-red-500'.
                                                // Looking at PagePage, it allows hex entry or picking.
                                                // Let's implement a simple color picker using the existing `FOLDER_COLORS` which has hexes if possible, or mapping classes.
                                                // `AssetManagerPage` imports `FOLDER_COLORS`. Let's use that.
                                                className={`w-4 h-4 rounded-full ${c} hover:scale-110 transition-all border border-black/5 ring-1 ring-transparent hover:ring-white/50`}
                                            // We can't easily extract hex from class name here without a map.
                                            // Let's just use FOLDER_COLORS instead which has hex.
                                            />
                                        ))}
                                    </div>
                                    {/* Better Color Picker using FOLDER_COLORS */}
                                    <div className="flex items-center gap-1 mt-1 overflow-x-auto pb-1 custom-scrollbar">
                                        {FOLDER_COLORS.map((color) => (
                                            <button
                                                key={color.id}
                                                onClick={() => setPageBannerBgColor(color.hex)}
                                                className={`flex-shrink-0 w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-110 ${pageBannerBgColor === color.hex ? 'ring-2 ring-purple-400 scale-110' : ''}`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><Move size={10} /> X-Offset</span>
                                        <span className="font-mono text-slate-500">{pageBannerImage2XOffset}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={pageBannerImage2XOffset}
                                        onChange={(e) => setPageBannerImage2XOffset(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><Move size={10} /> Y-Offset</span>
                                        <span className="font-mono text-slate-500">{pageBannerImage2YOffset}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={pageBannerImage2YOffset}
                                        onChange={(e) => setPageBannerImage2YOffset(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="pt-2 border-t border-slate-200/50">
                                {editingPageBannerId ? (
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => {
                                                setEditingPageBannerId(null);
                                                setEditingPageBannerFolderId(null);
                                                setCustomPageBannerImage2(null);
                                            }}
                                            className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSavePageBanner(null)}
                                            className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm bg-purple-500 hover:bg-purple-600 text-white hover:shadow-md active:scale-95 transition-all"
                                        >
                                            <Smile size={12} />
                                            Update Banner
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => {
                                                    setPageBannerImage2Scale(100);
                                                    setPageBannerImage2XOffset(50);
                                                    setPageBannerImage2YOffset(50);
                                                }}
                                                className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                            >
                                                <Trash2 size={12} /> Reset
                                            </button>

                                            <button
                                                onClick={() => handleSavePageBanner(null)}
                                                disabled={!customPageBannerImage2}
                                                className={`
                                                    px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all
                                                    ${customPageBannerImage2
                                                        ? 'bg-purple-500 hover:bg-purple-600 text-white hover:shadow-md active:scale-95'
                                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                                `}
                                            >
                                                <Smile size={12} />
                                                Save as New Leader
                                            </button>
                                        </div>

                                        {/* Save to Existing Group */}
                                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                            <select
                                                value={selectedPageGroupLeaderId}
                                                onChange={(e) => setSelectedPageGroupLeaderId(e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 text-slate-600 text-[10px] rounded px-2 py-1 outline-none focus:border-purple-400"
                                            >
                                                <option value="">Select Group Leader...</option>
                                                {layer2Folders.flatMap(f =>
                                                    f.images
                                                        .filter(img => !img.groupLeaderId)
                                                        .map(img => ({ ...img, folderName: f.name, folderId: f.id }))
                                                ).map(img => (
                                                    <option key={`${img.folderId}:${img.id}`} value={`${img.folderId}:${img.id}`}>
                                                        {img.folderName} - Image {img.id.slice(-4)}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleSavePageBanner(selectedPageGroupLeaderId)}
                                                disabled={!customPageBannerImage2 || !selectedPageGroupLeaderId}
                                                className={`
                                                    px-3 py-1 text-[10px] font-bold uppercase rounded transition-all flex items-center gap-1
                                                    ${customPageBannerImage2 && selectedPageGroupLeaderId
                                                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                                                `}
                                            >
                                                <Plus size={10} />
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    // --- EXISTING CONFIG CONTENT (For App, Theme) ---
                    <>
                        {/* Column 1: Spatial Controls (Quadrants) - OLD (kept for Page tab) */}
                        <div className="w-40 bg-slate-100/80 rounded-xl p-3 flex flex-col gap-3 border border-slate-200/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position</span>
                                <div className="w-8 h-4 bg-sky-500 rounded-full relative cursor-pointer">
                                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-2">
                                {['TL', 'TR', 'BL', 'BR'].map((q, i) => (
                                    <button
                                        key={q}
                                        onClick={() => setSelectedQuadrant && setSelectedQuadrant(q)}
                                        className={`rounded-lg border transition-all ${selectedQuadrant === q ? 'bg-sky-500 border-sky-600 text-white' : 'bg-white border-slate-200 hover:border-sky-300 text-slate-400'}`}
                                    >
                                    </button>
                                ))}
                            </div>

                            <button className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold rounded-lg transition-colors">
                                ADVANCED
                            </button>
                        </div>

                        {/* Column 2: Properties & Adjustments - OLD (kept for Page tab) */}
                        <div className="flex-1 flex flex-col gap-3">

                            {/* Module A: Properties Header */}
                            <div className="flex items-start gap-4 h-1/2">
                                {/* Color Palette */}
                                <div className="flex-1 grid grid-cols-8 gap-1.5 content-start">
                                    {colors.map((c, i) => (
                                        <button key={i} className={`w-5 h-5 rounded-full ${c} hover:scale-110 hover:shadow-md transition-all border border-black/5 ring-1 ring-transparent hover:ring-white/50`} />
                                    ))}
                                </div>

                                {/* Theme Selector */}
                                <div className="w-32 flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Theme</label>
                                    <select className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
                                        <option>Midnight</option>
                                        <option>Daylight</option>
                                        <option>Sunset</option>
                                    </select>
                                </div>

                                {/* Context Selector */}
                                <div className="w-32 flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Context</label>
                                    <select className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
                                        <option>Global</option>
                                        <option>Local</option>
                                    </select>
                                </div>
                            </div>

                            {/* Module B: Transformation Sliders */}
                            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><Box size={10} /> Scale</span>
                                        <span className="font-mono text-slate-500">1.0x</span>
                                    </div>
                                    <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1"><Layers size={10} /> Opacity</span>
                                        <span className="font-mono text-slate-500">100%</span>
                                    </div>
                                    <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1">X-Offset</span>
                                        <span className="font-mono text-slate-500">0px</span>
                                    </div>
                                    <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600 flex items-center gap-1">Y-Offset</span>
                                        <span className="font-mono text-slate-500">0px</span>
                                    </div>
                                    <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Group Leader Columns */}
            {orbColumnLeaderId && (() => {
                const leader = orbFavorites.find(f => f.id === orbColumnLeaderId);
                if (!leader) return null;
                const memeberIds = leader.groupMembers || [];
                const members = [leader, ...orbFavorites.filter(f => memeberIds.includes(f.id))];
                return (
                    <OrbGroupColumn
                        leader={leader}
                        members={members}
                        onClose={() => setOrbColumnLeaderId(null)}
                        onOrbSelect={(orb) => {
                            applyOrbFavorite(orb);
                        }}
                        activeOrbId={leader.id} // Simple highlight for context
                    />
                );
            })()}

            {pageColumnLeaderId && (() => {
                const folder = layer2Folders.find(f => f.id === pageColumnLeaderId.folderId);
                const leader = folder?.images.find(img => img.id === pageColumnLeaderId.id);
                if (!leader) return null;

                const memberKeys = leader.groupMembers || [];
                const subMembers = memberKeys.map(key => {
                    const [fId, iId] = key.split(':');
                    const f = layer2Folders.find(lf => lf.id === fId);
                    const img = f?.images.find(i => i.id === iId);
                    if (img) return { ...img, folderName: f.name, folderId: f.id };
                    return null;
                }).filter(Boolean);
                const members = [{ ...leader, folderName: folder.name, folderId: folder.id }, ...subMembers];

                return (
                    <PageGroupColumn
                        leader={{ ...leader, folderName: folder.name }}
                        members={members}
                        onClose={() => setPageColumnLeaderId(null)}
                        onSelect={(banner) => {
                            applyLayer2Image(banner);
                            if (banner.bgColor) setPageBannerBgColor(banner.bgColor);
                            setEditingPageBannerId(banner.id);
                            setEditingPageBannerFolderId(banner.folderId);
                        }}
                        activeId={editingPageBannerId}
                    />
                );
            })()}

            {/* Advanced Crop Modal */}
            <OrbCropModal
                isOpen={isCropModalOpen}
                onClose={() => setIsCropModalOpen(false)}
                image={customOrbImage}
                spillConfig={orbSpill}
                scale={orbImageScale}
                xOffset={orbImageXOffset}
                yOffset={orbImageYOffset}
                // Advanced State
                advancedMasks={orbAdvancedMasks}
                setAdvancedMasks={setOrbAdvancedMasks}
                maskRects={orbMaskRects}
                setMaskRects={setOrbMaskRects}
            />

        </div >
    );
};

export default AssetManagerPage;
