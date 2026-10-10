import React, { useState, useRef, useEffect } from 'react';
import { Smile, Plus, ArrowLeft, Trash2, Check, Folder, Settings, LayoutGrid, ChevronDown, Image, Music } from 'lucide-react';
import OrbGroupColumn from './OrbGroupColumn';
import OrbCropModal from './OrbCropModal';
import { useConfigStore } from '../store/configStore';
import { usePlaylistStore } from '../store/playlistStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { saveImageToCache } from '../api/platformBridge';

import { FOLDER_COLORS } from '../utils/folderColors';

export default function OrbPage({ onBack, onNavigateToYou, onNavigateToPage, onNavigateToApp }) {
    const {
        customOrbImage, setCustomOrbImage,
        isSpillEnabled, setIsSpillEnabled,
        orbSpill, setOrbSpill,
        orbImageScale, setOrbImageScale,
        orbImageXOffset, setOrbImageXOffset,
        orbImageYOffset, setOrbImageYOffset,
        addOrbFavorite,
        orbFavorites,
        removeOrbFavorite,
        applyOrbFavorite,
        updateOrbFavoriteFolders,
        updateOrbFavoritePlaylists,
        assignOrbToGroup,
        orbAdvancedMasks, setOrbAdvancedMasks,
        orbMaskRects, setOrbMaskRects,
        orbMaskPaths, setOrbMaskPaths,
        orbMaskModes, setOrbMaskModes,
        orbSize,
        orbImageScaleW,
        orbImageScaleH,
        setIsOrbPreviewMode,
        updateOrbFavorite,
        orbNavOrbId
    } = useConfigStore();

    const allPlaylists = usePlaylistStore(state => state.allPlaylists);
    const { activePage, groups, getGroupIdsForPlaylist } = usePlaylistGroupStore();

    // Filter playlists based on active explorer page (Hub Isolation)
    const filteredPlaylists = React.useMemo(() => {
        return allPlaylists.filter(p => {
            const groupIds = getGroupIdsForPlaylist(p.id);
            if (activePage === 1) {
                // Page 1: Playlists in P1 groups + Unsorted (no group)
                if (groupIds.length === 0) return true;
                return groupIds.some(gid => {
                    const group = groups.find(g => g.id === gid);
                    return group && (group.page || 1) === 1;
                });
            } else {
                // Page 2+: Only playlists assigned to carousels on this page
                return groupIds.some(gid => {
                    const group = groups.find(g => g.id === gid);
                    return group && (group.page || 1) === activePage;
                });
            }
        });
    }, [allPlaylists, groups, activePage, getGroupIdsForPlaylist]);

    const [hoveredFavoriteId, setHoveredFavoriteId] = useState(null);


    const [activeTab, setActiveTab] = useState('configuration'); // 'configuration' or 'groups'
    const [selectedFolderFilter, setSelectedFolderFilter] = useState(null); // null = show all
    const [folderAssignmentOpenId, setFolderAssignmentOpenId] = useState(null); // ID of preset with open folder selector
    const [playlistAssignmentOpenId, setPlaylistAssignmentOpenId] = useState(null); // ID of preset with open playlist selector
    const [selectedGroupLeaderId, setSelectedGroupLeaderId] = useState(null); // ID of selected group leader preset (Groups Tab)
    const [showGroupLeadersOnly, setShowGroupLeadersOnly] = useState(false); // Toggle to show only group leaders with members
    const [columnLeaderId, setColumnLeaderId] = useState(null); // ID of group leader whose column is open
    const [isCropModalOpen, setIsCropModalOpen] = useState(false); // State for advanced crop modal

    // content tab state
    const [selectedConfigGroupLeaderId, setSelectedConfigGroupLeaderId] = useState(null);
    const [configShowAllPresets, setConfigShowAllPresets] = useState(true);
    const [expandedConfigGroupLeaderSelector, setExpandedConfigGroupLeaderSelector] = useState(false);
    const [hideSubordinates, setHideSubordinates] = useState(false); // Toggle to hide subordinate orbs in groups tab
    const [hideSingletons, setHideSingletons] = useState(false); // Toggle to hide unassigned/non-leader orbs in groups tab


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

    const toggleSpillQuadrant = (q) => {
        setOrbSpill({ ...orbSpill, [q]: !orbSpill[q] });
    };

    const handleSaveCurrentOrbAsFavorite = () => {
        if (!customOrbImage) return;
        addOrbFavorite({
            customOrbImage,
            isSpillEnabled,
            orbSpill: { ...orbSpill },
            orbImageScale,
            orbImageXOffset,
            orbImageYOffset,
            orbAdvancedMasks: { ...orbAdvancedMasks },
            orbMaskRects: JSON.parse(JSON.stringify(orbMaskRects)), // Deep copy
            orbMaskPaths: JSON.parse(JSON.stringify(orbMaskPaths)),
            orbMaskModes: { ...orbMaskModes },
        });
    };


    const scrollContainerRef = useRef(null);
    const horizontalScrollRef = useRef(null);


    // Sticky toolbar state
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef(null);

    useEffect(() => {
        setIsOrbPreviewMode(isCropModalOpen);
        return () => {
            if (isCropModalOpen) setIsOrbPreviewMode(false);
        };
    }, [isCropModalOpen, setIsOrbPreviewMode]);
    
    // Sticky toolbar detection
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 0);
            },
            { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
        );

        if (stickySentinelRef.current) {
            observer.observe(stickySentinelRef.current);
        }
        return () => observer.disconnect();
    }, []);

    // Close folder assignment menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (folderAssignmentOpenId && !e.target.closest('.folder-assignment-menu')) {
                setFolderAssignmentOpenId(null);
            }
            if (expandedConfigGroupLeaderSelector && !e.target.closest('[data-config-group-leader-selector]')) {
                setExpandedConfigGroupLeaderSelector(false);
            }
            if (playlistAssignmentOpenId && !e.target.closest('.playlist-assignment-menu')) {
                setPlaylistAssignmentOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [folderAssignmentOpenId, expandedConfigGroupLeaderSelector]);

    // Convert vertical wheel scrolling to horizontal scrolling (optimized)
    useEffect(() => {
        // Only attach when presets tab is active
        if (activeTab !== 'presets') return;

        const container = horizontalScrollRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            // Check if there's horizontal scroll available
            const hasHorizontalScroll = container.scrollWidth > container.clientWidth;

            if (hasHorizontalScroll) {
                // Prevent default vertical scrolling
                e.preventDefault();
                e.stopPropagation();

                // Direct scrollLeft assignment for better performance
                container.scrollLeft += e.deltaY;
            }
        };

        // Add listener to container
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab]); // Re-attach when tab changes or component mounts

    // Calculate folder counts for prism bar
    const folderCounts = {};
    FOLDER_COLORS.forEach(color => {
        folderCounts[color.id] = orbFavorites.filter(fav =>
            fav.folderColors && fav.folderColors.includes(color.id)
        ).length;
    });

    // Filter presets based on selected folder and group leader toggle
    const filteredFavorites = (selectedFolderFilter
        ? orbFavorites.filter(fav =>
            fav.folderColors && fav.folderColors.includes(selectedFolderFilter)
        )
        : orbFavorites
    ).filter(fav => {
        // If toggle is on, only show group leaders with at least 1 member
        if (showGroupLeadersOnly) {
            return fav.groupMembers && fav.groupMembers.length >= 1;
        }
        return true;
    });

    // Toggle folder assignment for a preset
    const toggleFolderAssignment = (favoriteId, folderColorId) => {
        const favorite = orbFavorites.find(f => f.id === favoriteId);
        if (!favorite) return;

        const currentFolders = favorite.folderColors || [];
        const newFolders = currentFolders.includes(folderColorId)
            ? currentFolders.filter(id => id !== folderColorId)
            : [...currentFolders, folderColorId];

        updateOrbFavoriteFolders(favoriteId, newFolders);
    };

    // Toggle playlist assignment for a preset
    const togglePlaylistAssignment = (favoriteId, playlistName) => {
        const favorite = orbFavorites.find(f => f.id === favoriteId);
        if (!favorite) return;

        const currentPlaylists = favorite.playlistIds || [];
        const newPlaylists = currentPlaylists.includes(playlistName)
            ? currentPlaylists.filter(name => name !== playlistName)
            : [...currentPlaylists, playlistName];

        updateOrbFavoritePlaylists(favoriteId, newPlaylists);
    };

    // Spill Editor component for Page Banner
    const spillEditor = (
        <div className="flex items-center gap-4 animate-fade-in">
            {/* Interactive Visualizer */}
            <div className="relative w-24 h-24 border-2 border-white/20 rounded-xl overflow-visible bg-black/20 select-none group backdrop-blur-sm shadow-lg">
                {/* The Image (Clipped directly) */}
                {customOrbImage ? (
                    <>
                        <img
                            src={customOrbImage}
                            className="absolute inset-0 max-w-none transition-all duration-300 origin-center"
                            style={{
                                width: `${96 * orbImageScale * orbImageScaleW}px`,
                                height: `${96 * orbImageScale * orbImageScaleH}px`,
                                transform: `translate(${(orbImageXOffset) * (96 / orbSize)}px, ${(orbImageYOffset) * (96 / orbSize)}px)`,
                                clipPath: 'url(#settingVisualizerClip)',
                                objectFit: 'contain'
                            }}
                            alt=""
                        />

                        {/* Hidden SVG Definitions for Clip Path */}
                        <svg width="0" height="0" className="absolute">
                            <defs>
                                <clipPath id="settingVisualizerClip" clipPathUnits="objectBoundingBox">
                                    <circle cx="0.5" cy="0.5" r="0.5" />

                                    {/* Advanced Masks */}
                                    {['tl', 'tr', 'bl', 'br'].map(q => {
                                        if (!orbSpill[q]) return null;

                                        const defaults = {
                                            tl: { x: -1.0, y: -0.5, w: 1.5, h: 1.0 },
                                            tr: { x: 0.5, y: -0.5, w: 1.0, h: 1.0 },
                                            bl: { x: -1.0, y: 0.5, w: 1.5, h: 1.5 },
                                            br: { x: 0.5, y: 0.5, w: 1.0, h: 1.5 }
                                        };

                                        if (!orbAdvancedMasks[q]) {
                                            const d = defaults[q];
                                            return <rect key={q} x={d.x} y={d.y} width={d.w} height={d.h} />;
                                        }

                                        const mode = orbMaskModes[q] || 'rect';
                                        if (mode === 'path') {
                                            const points = orbMaskPaths[q] || [];
                                            if (points.length < 3) return <rect key={q} x={defaults[q].x} y={defaults[q].y} width={defaults[q].w} height={defaults[q].h} />;
                                            const pts = points.map(p => `${p.x / 100},${p.y / 100}`).join(' ');
                                            return <polygon key={q} points={pts} />;
                                        } else {
                                            const r = orbMaskRects[q];
                                            return <rect key={q} x={r.x / 100} y={r.y / 100} width={r.w / 100} height={r.h / 100} />;
                                        }
                                    })}
                                </clipPath>
                            </defs>
                        </svg>

                        {/* Quadrant Toggles */}
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
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-[9px] font-bold uppercase text-center p-2">
                        No Image
                    </div>
                )}

                {/* Expand Button for Advanced Crop */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCropModalOpen(true);
                    }}
                    className="absolute top-1 right-1 z-40 p-1 bg-black/40 hover:bg-sky-500 text-white rounded transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                    title="Advanced Crop & View"
                >
                    <Settings size={12} />
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold uppercase rounded-md cursor-pointer transition-all shadow-md border border-white/10 flex items-center gap-1.5">
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
                            className="px-3 py-1.5 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-1.5"
                        >
                            <Trash2 size={12} />
                            Remove
                        </button>
                    )}
                </div>
                <div className="text-[10px] text-white/50 leading-tight max-w-[140px]">
                    <p>Click quadrants to toggle spill. Use <span className="text-white/80 font-bold"><Settings size={10} className="inline mb-0.5" /></span> for advanced crop.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col relative">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-transparent relative">
                {/* Header Section */}
                {/* Header Removed */}

                {/* Presets Carousel (Always Visible at Top) */}
                <div className="space-y-4 mb-8 pt-8 px-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Smile size={14} /> Saved Presets
                            {selectedFolderFilter && (
                                <span className="text-[10px] font-normal normal-case text-slate-500">
                                    ({filteredFavorites.length} {filteredFavorites.length === 1 ? 'preset' : 'presets'})
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-3">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft size={14} />
                                    Back
                                </button>
                            )}
                            <button
                                onClick={() => setShowGroupLeadersOnly(!showGroupLeadersOnly)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${showGroupLeadersOnly
                                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                                    }`}
                                title={showGroupLeadersOnly ? 'Show all presets' : 'Show only group leaders with members'}
                            >
                                <Folder size={12} />
                                {showGroupLeadersOnly ? 'Group Leaders Only' : 'All Presets'}
                            </button>
                        </div>
                    </div>

                    {orbFavorites.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                            <Smile size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs font-medium">No presets saved yet</p>
                        </div>
                    ) : (
                        <div
                            ref={horizontalScrollRef}
                            className="horizontal-video-scroll no-scrollbar"
                            onWheel={(e) => {
                                const container = horizontalScrollRef.current;
                                if (container && container.scrollWidth > container.clientWidth) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    container.scrollLeft += e.deltaY;
                                }
                            }}
                            style={{
                                width: '100%',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                WebkitOverflowScrolling: 'touch',
                                paddingBottom: '12px',
                            }}
                        >
                            <div
                                className="flex gap-6 animate-fade-in"
                                style={{
                                    width: 'max-content',
                                    paddingTop: '0px',
                                }}
                            >
                                {filteredFavorites.map((favorite) => {
                                    const assignedFolders = favorite.folderColors || [];
                                    return (
                                        <div
                                            key={favorite.id}
                                            className="relative group flex flex-col items-center"
                                            style={{
                                                zIndex: folderAssignmentOpenId === favorite.id ? 100 : 'auto',
                                                width: '200px', // Increased width
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                            onMouseLeave={() => {
                                                setHoveredFavoriteId(null);
                                                if (folderAssignmentOpenId !== favorite.id) {
                                                    setFolderAssignmentOpenId(null);
                                                }
                                            }}
                                        >
                                            {/* Favorite Thumbnail */}
                                            <div className="relative w-40 h-40 mx-auto overflow-visible">
                                                <button
                                                    onClick={() => applyOrbFavorite(favorite)}
                                                    className={`w-full h-full rounded-full border-4 transition-all duration-200 relative overflow-visible bg-sky-50 ${favorite.customOrbImage === customOrbImage
                                                        ? 'border-sky-500 ring-4 ring-sky-200 shadow-lg scale-105'
                                                        : 'border-slate-200 hover:border-sky-300 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div
                                                        className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center z-40"
                                                        style={{
                                                            clipPath: favorite.isSpillEnabled && favorite.orbSpill ? `url(#orbClipPath-${favorite.id})` : 'circle(50% at 50% 50%)',
                                                            overflow: 'visible'
                                                        }}
                                                    >
                                                        <img
                                                            src={favorite.customOrbImage}
                                                            alt={favorite.name}
                                                            className="max-w-none transition-all duration-500"
                                                            style={{
                                                                width: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1} * ${favorite.orbImageScaleW || 1})` : '100%',
                                                                height: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1} * ${favorite.orbImageScaleH || 1})` : '100%',
                                                                transform: favorite.isSpillEnabled ? `translate(${(favorite.orbImageXOffset || 0) * (160 / orbSize)}px, ${(favorite.orbImageYOffset || 0) * (160 / orbSize)}px)` : 'none',
                                                                objectFit: favorite.isSpillEnabled ? 'contain' : 'cover'
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                                                        <div className="absolute inset-0 bg-sky-200/10" />
                                                    </div>
                                                </button>
                                            </div>

                                            <p className="mt-2 text-[10px] text-slate-500 text-center font-bold truncate w-full px-1">
                                                {favorite.name}
                                            </p>

                                            {/* Spill Indicator */}
                                            {favorite.isSpillEnabled && (
                                                <div className="absolute top-0 right-2 bg-sky-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                                    Spill
                                                </div>
                                            )}

                                            {/* Hover Controls */}
                                            {hoveredFavoriteId === favorite.id && (
                                                <div className="absolute -top-2 left-2 flex flex-col gap-1 z-[100]">
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

                                                    {favorite.groupMembers && favorite.groupMembers.length > 0 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setColumnLeaderId(favorite.id);
                                                            }}
                                                            className="w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all bg-purple-500 hover:bg-purple-600 text-white"
                                                            title={`View Group (${favorite.groupMembers.length} members)`}
                                                        >
                                                            <LayoutGrid size={10} />
                                                        </button>
                                                    )}

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
                                                </div>
                                            )}

                                            {/* Delete Button */}
                                            {hoveredFavoriteId === favorite.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Delete this preset?')) {
                                                            removeOrbFavorite(favorite.id);
                                                        }
                                                    }}
                                                    className="absolute -top-2 right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-30"
                                                    title="Delete Preset"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            )}

                                            {/* Folder Color Selector Popup */}
                                            {folderAssignmentOpenId === favorite.id && (
                                                <div className="folder-assignment-menu absolute top-6 left-0 bg-white border-2 border-slate-200 rounded-lg p-2 shadow-xl z-[100] min-w-[160px]">
                                                    <div className="text-[9px] font-bold uppercase text-slate-400 mb-2">Assign</div>
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
                                                                    className={`w-6 h-6 rounded border transition-all ${isAssigned
                                                                        ? 'border-black ring-1 ring-sky-300 scale-110'
                                                                        : 'border-slate-300 hover:border-slate-400'
                                                                        }`}
                                                                    style={{ backgroundColor: color.hex }}
                                                                    title={color.name}
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

                                            {/* Playlist Assignment Selector Popup */}
                                            {playlistAssignmentOpenId === favorite.id && (
                                                <div className="playlist-assignment-menu absolute top-6 left-6 bg-white border-2 border-slate-200 rounded-lg p-2 shadow-xl z-[100] min-w-[180px] max-h-[200px] overflow-hidden flex flex-col">
                                                    <div className="text-[9px] font-bold uppercase text-slate-400 mb-2 px-1">Playlists</div>
                                                    <div className="overflow-y-auto flex-1 space-y-0.5 pr-1">
                                                        {filteredPlaylists.map((playlist) => {
                                                            const isAssigned = favorite.playlistIds?.includes(playlist.id);
                                                            return (
                                                                <button
                                                                    key={playlist.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        togglePlaylistAssignment(favorite.id, playlist.id);
                                                                    }}
                                                                    className={`w-full text-left px-2 py-1 rounded text-[9px] font-medium transition-all flex items-center justify-between ${isAssigned
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                                        : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                                                                        }`}
                                                                >
                                                                    <span className="truncate flex-1">{playlist.name}</span>
                                                                    {isAssigned && <Check size={10} className="text-amber-500 ml-1.5" />}
                                                                </button>
                                                            );
                                                        })}
                                                        {filteredPlaylists.length === 0 && (
                                                            <div className="px-2 py-2 text-center text-slate-400 italic text-[9px]">
                                                                No playlists found on Page {activePage}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>



            {/* Content */}
            <div className="px-6 pt-2 pb-6 text-slate-800 space-y-3">
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">

                        <button
                            onClick={() => setActiveTab('configuration')}
                            className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${activeTab === 'configuration'
                                ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                        >
                            <Settings size={14} />
                            <span className="font-bold text-xs uppercase tracking-wide">Configuration</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${activeTab === 'groups'
                                ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                        >
                            <Folder size={14} />
                            <span className="font-bold text-xs uppercase tracking-wide">Groups</span>
                        </button>
                    </div>

                    {/* SVG ClipPath Definitions for Each Preset (available in all tabs) */}
                    {orbFavorites.length > 0 && (
                        <svg width="0" height="0" className="absolute pointer-events-none">
                            <defs>
                                {orbFavorites.map((favorite) => (
                                    <clipPath key={favorite.id} id={`orbClipPath-${favorite.id}`} clipPathUnits="objectBoundingBox">
                                        <circle cx="0.5" cy="0.5" r="0.5" />
                                        {['tl', 'tr', 'bl', 'br'].map(q => {
                                            if (!favorite.isSpillEnabled || !favorite.orbSpill?.[q]) return null;

                                            const defaults = {
                                                tl: { x: -1.0, y: -0.5, w: 1.5, h: 1.0 },
                                                tr: { x: 0.5, y: -0.5, w: 1.0, h: 1.0 },
                                                bl: { x: -1.0, y: 0.5, w: 1.5, h: 1.5 },
                                                br: { x: 0.5, y: 0.5, w: 1.0, h: 1.5 }
                                            };

                                            if (!favorite.orbAdvancedMasks?.[q]) {
                                                const d = defaults[q];
                                                return <rect key={q} x={d.x} y={d.y} width={d.w} height={d.h} />;
                                            }

                                            const mode = favorite.orbMaskModes?.[q] || 'rect';
                                            if (mode === 'path') {
                                                const points = favorite.orbMaskPaths?.[q] || [];
                                                if (points.length < 3) return <rect key={q} x={defaults[q].x} y={defaults[q].y} width={defaults[q].w} height={defaults[q].h} />;
                                                const pts = points.map(p => `${p.x / 100},${p.y / 100}`).join(' ');
                                                return <polygon key={q} points={pts} />;
                                            } else {
                                                // Check if rect exists, fallback to default if missing (safety)
                                                const r = favorite.orbMaskRects?.[q] || { x: 0, y: 0, w: 50, h: 50 };
                                                return <rect key={q} x={r.x / 100} y={r.y / 100} width={r.w / 100} height={r.h / 100} />;
                                            }
                                        })}
                                    </clipPath>
                                ))}
                            </defs>
                        </svg>
                    )}

                    {activeTab === 'configuration' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Side: Settings, Adjustments, Save */}
                            <div className="space-y-4">
                                <div className="bg-white/50 p-4 rounded-xl border border-sky-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                            <Settings size={14} /> Orb Settings
                                        </h3>
                                        {spillEditor}
                                    </div>

                                    {/* Image Adjustments */}
                                    <div className="space-y-2 px-1">
                                        <label className="text-xs font-bold uppercase text-slate-400 border-b border-slate-100 pb-1 w-full block">Image Adjustments</label>
                                        {customOrbImage && isSpillEnabled ? (
                                            <div className="space-y-3">
                                                {/* Scale */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-slate-500">Scale</label>
                                                        <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">{orbImageScale.toFixed(2)}x</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-300">0.5</span>
                                                        <input
                                                            type="range"
                                                            min="0.5"
                                                            max="3.0"
                                                            step="0.05"
                                                            value={orbImageScale}
                                                            onChange={(e) => setOrbImageScale(parseFloat(e.target.value))}
                                                            className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                        />
                                                        <span className="text-[9px] font-bold text-slate-300">3.0</span>
                                                    </div>
                                                </div>

                                                {/* X Offset */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-slate-500">Horizontal (X)</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">{orbImageXOffset}px</span>
                                                            {orbImageXOffset !== 0 && (
                                                                <button
                                                                    onClick={() => setOrbImageXOffset(0)}
                                                                    className="text-[9px] font-bold text-slate-400 hover:text-sky-500"
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-300">-100</span>
                                                        <input
                                                            type="range"
                                                            min="-100"
                                                            max="100"
                                                            step="1"
                                                            value={orbImageXOffset}
                                                            onChange={(e) => setOrbImageXOffset(parseInt(e.target.value))}
                                                            className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                        />
                                                        <span className="text-[9px] font-bold text-slate-300">+100</span>
                                                    </div>
                                                </div>

                                                {/* Y Offset */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-slate-500">Vertical (Y)</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">{orbImageYOffset}px</span>
                                                            {orbImageYOffset !== 0 && (
                                                                <button
                                                                    onClick={() => setOrbImageYOffset(0)}
                                                                    className="text-[9px] font-bold text-slate-400 hover:text-sky-500"
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-300">-100</span>
                                                        <input
                                                            type="range"
                                                            min="-100"
                                                            max="100"
                                                            step="1"
                                                            value={orbImageYOffset}
                                                            onChange={(e) => setOrbImageYOffset(parseInt(e.target.value))}
                                                            className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                        />
                                                        <span className="text-[9px] font-bold text-slate-300">+100</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-slate-400 bg-slate-100 rounded-lg border-2 border-dashed border-slate-200">
                                                <p className="text-[10px]">Enable spill to adjust image settings</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Save Current Configuration Button */}
                                <div className="bg-white/50 p-4 rounded-xl border border-sky-100">
                                    <button
                                        onClick={handleSaveCurrentOrbAsFavorite}
                                        disabled={!customOrbImage}
                                        className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${customOrbImage
                                            ? 'bg-sky-500 border-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 shadow-md hover:shadow-lg'
                                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Plus size={14} />
                                        Save Current Configuration as Preset
                                    </button>
                                    {!customOrbImage && (
                                        <p className="text-[10px] text-slate-400 text-center mt-1">
                                            Upload an orb image first to save it as a preset
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Group Leader Previewer */}
                            <div className="bg-slate-50/50 p-4 rounded-xl border-2 border-slate-200 h-full">
                                <div className="flex items-start gap-4 h-full">
                                    <div className="flex-1 space-y-3 h-full">
                                        {(() => {
                                            // 1. Get Group Leaders
                                            const groupLeaders = orbFavorites.filter(fav =>
                                                fav.groupMembers && fav.groupMembers.length >= 1
                                            );

                                            // 2. Determine Selection
                                            const activeLeaderId = (!configShowAllPresets && selectedConfigGroupLeaderId) || null;
                                            const selectedLeader = activeLeaderId
                                                ? orbFavorites.find(f => f.id === activeLeaderId)
                                                : null;

                                            // 3. Get Items to Display
                                            let displayItems = [];
                                            if (configShowAllPresets) {
                                                displayItems = orbFavorites;
                                            } else if (selectedLeader) {
                                                // Leader first, then members
                                                displayItems = [selectedLeader];
                                                if (selectedLeader.groupMembers) {
                                                    const memberObjects = selectedLeader.groupMembers
                                                        .map(mid => orbFavorites.find(f => f.id === mid))
                                                        .filter(Boolean);
                                                    displayItems = [...displayItems, ...memberObjects];
                                                }
                                            }

                                            return (
                                                <div className="space-y-3 h-full flex flex-col">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                                                            <Folder size={12} className={selectedLeader ? "text-sky-500" : "text-slate-400"} />
                                                            {configShowAllPresets ? 'All Presets' : selectedLeader ? 'Group Leader' : 'Group Preview'}
                                                        </label>
                                                        {(selectedLeader || configShowAllPresets) && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedConfigGroupLeaderId(null);
                                                                    setConfigShowAllPresets(false);
                                                                    setExpandedConfigGroupLeaderSelector(false);
                                                                }}
                                                                className="text-[9px] font-bold text-red-400 hover:text-red-500 transition-colors"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Group Leader Selector Dropdown */}
                                                    <div className="relative" data-config-group-leader-selector>
                                                        <button
                                                            onClick={() => setExpandedConfigGroupLeaderSelector(!expandedConfigGroupLeaderSelector)}
                                                            className="flex items-center gap-2 px-2 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-sky-300 rounded-lg text-[10px] font-medium text-slate-700 transition-all w-full justify-between"
                                                        >
                                                            <span className="truncate">
                                                                {configShowAllPresets
                                                                    ? 'All Presets'
                                                                    : selectedLeader
                                                                        ? `${selectedLeader.name} (${selectedLeader.groupMembers?.length || 0} members)`
                                                                        : 'Select Group Leader...'
                                                                }
                                                            </span>
                                                            <ChevronDown
                                                                size={12}
                                                                className={`transition-transform ${expandedConfigGroupLeaderSelector ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        {expandedConfigGroupLeaderSelector && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                                                {/* All Presets Option */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setConfigShowAllPresets(true);
                                                                        setSelectedConfigGroupLeaderId(null);
                                                                        setExpandedConfigGroupLeaderSelector(false);
                                                                    }}
                                                                    className={`w-full px-3 py-2 text-left text-[10px] font-medium transition-all flex items-center gap-2 border-b border-slate-100 ${configShowAllPresets
                                                                        ? 'bg-sky-50 text-sky-700'
                                                                        : 'hover:bg-slate-50 text-slate-600'
                                                                        }`}
                                                                >
                                                                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                                                                        <LayoutGrid size={14} className="text-slate-400" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-bold truncate">All Presets</div>
                                                                        <div className="text-[9px] text-slate-500">Show all saved presets</div>
                                                                    </div>
                                                                    {configShowAllPresets && <Check size={12} className="text-sky-600" />}
                                                                </button>

                                                                {groupLeaders.length === 0 ? (
                                                                    <div className="px-3 py-4 text-[10px] text-slate-400 text-center">
                                                                        No group leaders found.
                                                                    </div>
                                                                ) : (
                                                                    groupLeaders.map((leader) => {
                                                                        const isSelected = selectedConfigGroupLeaderId === leader.id;
                                                                        return (
                                                                            <button
                                                                                key={leader.id}
                                                                                onClick={() => {
                                                                                    setConfigShowAllPresets(false);
                                                                                    setSelectedConfigGroupLeaderId(leader.id);
                                                                                    setExpandedConfigGroupLeaderSelector(false);
                                                                                }}
                                                                                className={`w-full px-3 py-2 text-left text-[10px] font-medium transition-all flex items-center gap-2 border-b border-slate-100 last:border-b-0 ${isSelected
                                                                                    ? 'bg-sky-50 text-sky-700'
                                                                                    : 'hover:bg-slate-50 text-slate-600'
                                                                                    }`}
                                                                            >
                                                                                <div className="w-8 h-8 rounded-full border-2 border-slate-200 overflow-hidden flex-shrink-0">
                                                                                    <img src={leader.customOrbImage} alt="" className="w-full h-full object-cover" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="font-bold truncate">{leader.name}</div>
                                                                                    <div className="text-[9px] text-slate-500">{leader.groupMembers?.length} members</div>
                                                                                </div>
                                                                                {isSelected && <Check size={12} className="text-sky-600" />}
                                                                            </button>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Grid display */}
                                                    <div className="flex-1 overflow-y-auto min-h-[200px] border-t border-slate-200 pt-2 -mx-2 px-2">
                                                        {(configShowAllPresets || selectedLeader) ? (
                                                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                                                {displayItems.map((item) => {
                                                                    const isLeader = selectedLeader && item.id === selectedLeader.id;
                                                                    const isCurrent = customOrbImage === item.customOrbImage;

                                                                    return (
                                                                        <div key={item.id} className="relative group" style={{ width: '64px', height: '64px' }}>
                                                                            <button
                                                                                onClick={() => applyOrbFavorite(item)}
                                                                                className={`w-full h-full relative aspect-square rounded-full border-2 transition-all ${isCurrent ? 'border-sky-500 ring-2 ring-sky-200 z-10' :
                                                                                    isLeader ? 'border-purple-400 ring-1 ring-purple-100' : 'border-slate-200 hover:border-sky-300'
                                                                                    }`}
                                                                                title={item.name}
                                                                            >
                                                                                {/* Image Layer with Spill Effect */}
                                                                                <div
                                                                                    className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible"
                                                                                    style={{
                                                                                        clipPath: item.isSpillEnabled && item.orbSpill ? `url(#orbClipPath-${item.id})` : 'circle(50% at 50% 50%)',
                                                                                    }}
                                                                                >
                                                                                    <img
                                                                                        src={item.customOrbImage}
                                                                                        alt=""
                                                                                        className="max-w-none transition-all duration-300"
                                                                                        style={{
                                                                                            width: item.isSpillEnabled ? `calc(100% * ${item.orbImageScale || 1})` : '100%',
                                                                                            height: item.isSpillEnabled ? `calc(100% * ${item.orbImageScale || 1})` : '100%',
                                                                                            transform: item.isSpillEnabled ? `translate(${(item.orbImageXOffset || 0) * 0.3}px, ${(item.orbImageYOffset || 0) * 0.3}px)` : 'none',
                                                                                            objectFit: item.isSpillEnabled ? 'contain' : 'cover'
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                {/* Leader Badge */}
                                                                                {isLeader && (
                                                                                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-[7px] font-bold px-1 py-0.5 rounded uppercase z-20 shadow-sm border border-white/50">
                                                                                        Leader
                                                                                    </div>
                                                                                )}

                                                                                {/* Active Check */}
                                                                                {isCurrent && (
                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full z-20 backdrop-blur-[1px]">
                                                                                        <Check size={16} className="text-white drop-shadow-md" />
                                                                                    </div>
                                                                                )}
                                                                            </button>

                                                                            {/* Delete Button */}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (window.confirm('Delete this preset?')) {
                                                                                        removeOrbFavorite(item.id);
                                                                                    }
                                                                                }}
                                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-30 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                                                                                title="Delete Preset"
                                                                            >
                                                                                <Trash2 size={10} />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                                <div className="p-4 rounded-full bg-slate-100 mb-2">
                                                                    <Folder size={24} className="opacity-50" />
                                                                </div>
                                                                <p className="text-[10px] font-bold uppercase">Select Group to Preview</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* Orb Groups Tab */}
                    {activeTab === 'groups' && (
                        <div className="space-y-2 border-t border-sky-50 pt-3 bg-white/50 p-3 rounded-2xl">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Folder size={14} /> Orb Groups
                            </h3>
                            <div className="space-y-2 px-1">
                                {(() => {
                                    if (orbFavorites.length === 0) {
                                        return (
                                            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                                                <p className="text-[10px] text-slate-400">No orb presets saved yet</p>
                                            </div>
                                        );
                                    }

                                    // Find the selected group leader preset
                                    const groupLeader = selectedGroupLeaderId
                                        ? orbFavorites.find(fav => fav.id === selectedGroupLeaderId)
                                        : null;

                                    // Get group members for the selected leader
                                    const groupMembers = groupLeader?.groupMembers || [];

                                    // Count how many presets are assigned to this group
                                    const assignedCount = groupMembers.length;

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Left side: All orb presets - click to select group leader */}
                                            <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold uppercase text-slate-400">
                                                        {groupLeader ? 'Group Leader' : 'Select Group Leader'}
                                                    </label>
                                                    <button
                                                        onClick={() => setHideSubordinates(!hideSubordinates)}
                                                        className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md transition-all ${hideSubordinates ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                        title="Hide images that are already assigned to a group"
                                                    >
                                                        {hideSubordinates ? 'Show Subordinates' : 'Hide Subordinates'}
                                                    </button>
                                                </div>
                                                {groupLeader && (
                                                    <div className="mb-3 pb-3 border-b border-slate-200 space-y-2 text-center">
                                                        <div className="text-xs font-bold text-sky-600">
                                                            {assignedCount} {assignedCount === 1 ? 'preset' : 'presets'} assigned
                                                        </div>
                                                        <p className="text-[10px] text-slate-400">
                                                            Click presets on the right to assign them to this group leader
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[600px] overflow-y-auto pr-2">
                                                    {orbFavorites.filter(fav => {
                                                        if (!hideSubordinates) return true;
                                                        // Check if this favorite is a member of ANY group
                                                        // We iterate through all favorites to see if 'fav.id' is in their groupMembers
                                                        const isSubordinate = orbFavorites.some(parent =>
                                                            parent.id !== fav.id && // not looking at itself (though shouldn't be in own group)
                                                            parent.groupMembers &&
                                                            parent.groupMembers.includes(fav.id)
                                                        );
                                                        return !isSubordinate;
                                                    }).map((favorite) => {
                                                        const isGroupLeader = selectedGroupLeaderId === favorite.id;
                                                        const isActive = favorite.customOrbImage === customOrbImage;

                                                        return (
                                                            <div
                                                                key={`left-${favorite.id}`}
                                                                className="relative group"
                                                                onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedGroupLeaderId(favorite.id);
                                                                        applyOrbFavorite(favorite);
                                                                    }}
                                                                    className={`w-full aspect-square rounded-full border-2 transition-all duration-200 relative overflow-hidden bg-sky-50 ${isGroupLeader
                                                                        ? 'border-sky-500 ring-2 ring-sky-200 shadow-md'
                                                                        : isActive
                                                                            ? 'border-sky-400 ring-1 ring-sky-100'
                                                                            : 'border-slate-200 hover:border-sky-300 hover:shadow-sm'
                                                                        }`}
                                                                    style={{ width: '64px', height: '64px' }}
                                                                >
                                                                    {/* Image with spill effect - reuses clipPath from presets tab */}
                                                                    <div
                                                                        className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center"
                                                                        style={{
                                                                            clipPath: favorite.isSpillEnabled && favorite.orbSpill ? `url(#orbClipPath-${favorite.id})` : 'circle(50% at 50% 50%)',
                                                                            overflow: 'visible'
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={favorite.customOrbImage}
                                                                            alt={favorite.name}
                                                                            className="max-w-none transition-all duration-500"
                                                                            style={{
                                                                                width: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                                height: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                                transform: favorite.isSpillEnabled ? `translate(${(favorite.orbImageXOffset || 0) * 0.2}px, ${(favorite.orbImageYOffset || 0) * 0.2}px)` : 'none',
                                                                                objectFit: favorite.isSpillEnabled ? 'contain' : 'cover'
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    {/* Glass Overlay */}
                                                                    <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                                                                        <div className="absolute inset-0 bg-sky-200/10" />
                                                                    </div>

                                                                    {/* Group Leader Badge */}
                                                                    {isGroupLeader && (
                                                                        <div className="absolute top-0 left-0 bg-sky-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-br rounded-tl uppercase z-20">
                                                                            Leader
                                                                        </div>
                                                                    )}

                                                                    {/* Active Indicator */}
                                                                    {isActive && !isGroupLeader && (
                                                                        <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center pointer-events-none z-20 rounded-full">
                                                                            <Check className="text-white drop-shadow-md" size={12} />
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                {/* Tooltip on hover */}
                                                                {hoveredFavoriteId === favorite.id && (
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                                                                        {favorite.name}
                                                                        {isGroupLeader && ' (Group Leader)'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Right side: All orb presets - click to assign to group leader */}
                                            <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold uppercase text-slate-400">
                                                        {groupLeader ? 'Assign Presets to Group' : 'Select Group Leader'}
                                                    </label>
                                                    <button
                                                        onClick={() => setHideSingletons(!hideSingletons)}
                                                        className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md transition-all ${hideSingletons ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                        title="Hide images that are neither a group leader nor assigned to a group"
                                                    >
                                                        {hideSingletons ? 'Show Unassigned' : 'Hide Unassigned'}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[600px] overflow-y-auto pr-2">
                                                    {orbFavorites.filter(fav => {
                                                        if (!hideSingletons) return true;
                                                        // Logic: Hide if (Not Assigned to ANY group) AND (Not a Leader with Subordinates)

                                                        // 1. Is it a group member of ANY group?
                                                        const isSubordinate = orbFavorites.some(p => p.groupMembers && p.groupMembers.includes(fav.id));
                                                        if (isSubordinate) return true; // It is assigned, so show it (don't hide)

                                                        // 2. Is it a group leader of ANY group (with members)?
                                                        const isLeader = fav.groupMembers && fav.groupMembers.length > 0;
                                                        if (isLeader) return true; // It is a leader, so show it (don't hide)

                                                        // If neither, it is a "Singleton" / "Unassigned" -> Hide it
                                                        return false;
                                                    }).map((favorite) => {
                                                        const isGroupLeader = selectedGroupLeaderId === favorite.id;
                                                        const isAssignedToGroup = groupLeader && groupMembers.includes(favorite.id);
                                                        const isActive = favorite.customOrbImage === customOrbImage;

                                                        return (
                                                            <div
                                                                key={`right-${favorite.id}`}
                                                                className="relative group"
                                                                onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        if (groupLeader) {
                                                                            // Assign/unassign to group (don't assign the leader to itself)
                                                                            if (!(favorite.id === groupLeader.id)) {
                                                                                assignOrbToGroup(favorite.id, groupLeader.id);
                                                                            }
                                                                        } else {
                                                                            // Set as group leader
                                                                            setSelectedGroupLeaderId(favorite.id);
                                                                            applyOrbFavorite(favorite);
                                                                        }
                                                                    }}
                                                                    className={`w-full aspect-square rounded-full border-2 transition-all duration-200 relative overflow-hidden bg-sky-50 ${isGroupLeader
                                                                        ? 'border-sky-500 ring-2 ring-sky-200 shadow-md'
                                                                        : isAssignedToGroup
                                                                            ? 'border-purple-500 ring-2 ring-purple-200 shadow-md'
                                                                            : isActive
                                                                                ? 'border-sky-400 ring-1 ring-sky-100'
                                                                                : 'border-slate-200 hover:border-sky-300 hover:shadow-sm'
                                                                        }`}
                                                                    style={{ width: '64px', height: '64px' }}
                                                                >
                                                                    {/* Image with spill effect - reuses clipPath from presets tab */}
                                                                    <div
                                                                        className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center"
                                                                        style={{
                                                                            clipPath: favorite.isSpillEnabled && favorite.orbSpill ? `url(#orbClipPath-${favorite.id})` : 'circle(50% at 50% 50%)',
                                                                            overflow: 'visible'
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={favorite.customOrbImage}
                                                                            alt={favorite.name}
                                                                            className="max-w-none transition-all duration-500"
                                                                            style={{
                                                                                width: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                                height: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                                transform: favorite.isSpillEnabled ? `translate(${(favorite.orbImageXOffset || 0) * 0.2}px, ${(favorite.orbImageYOffset || 0) * 0.2}px)` : 'none',
                                                                                objectFit: favorite.isSpillEnabled ? 'contain' : 'cover'
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    {/* Glass Overlay */}
                                                                    <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                                                                        <div className="absolute inset-0 bg-sky-200/10" />
                                                                    </div>

                                                                    {/* Group Leader Badge */}
                                                                    {isGroupLeader && (
                                                                        <div className="absolute top-0 left-0 bg-sky-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-br rounded-tl uppercase z-20">
                                                                            Leader
                                                                        </div>
                                                                    )}

                                                                    {/* Assigned Badge */}
                                                                    {isAssignedToGroup && !isGroupLeader && (
                                                                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-bl rounded-tr uppercase z-20">
                                                                            ✓
                                                                        </div>
                                                                    )}

                                                                    {/* Active Indicator */}
                                                                    {isActive && !isGroupLeader && !isAssignedToGroup && (
                                                                        <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center pointer-events-none z-20 rounded-full">
                                                                            <Check className="text-white drop-shadow-md" size={12} />
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                {/* Tooltip on hover */}
                                                                {hoveredFavoriteId === favorite.id && (
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                                                                        {favorite.name}
                                                                        {isGroupLeader && ' (Group Leader)'}
                                                                        {isAssignedToGroup && !isGroupLeader && ' (Assigned)'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>

            </div >
            {/* Group Leader Column Overlay */}
            {
                columnLeaderId && (() => {
                    const leader = orbFavorites.find(f => f.id === columnLeaderId);
                    const members = leader?.groupMembers?.map(mid => orbFavorites.find(f => f.id === mid)).filter(Boolean) || [];

                    if (!leader) {
                        setColumnLeaderId(null);
                        return null;
                    }

                    return (
                        <OrbGroupColumn
                            leader={leader}
                            members={members}
                            onClose={() => setColumnLeaderId(null)}
                            onOrbSelect={(orb) => {
                                applyOrbFavorite(orb);
                                // Optional: Close column on selection? 
                                // PlaylistFolderColumn doesn't close on selection naturally (unless navigating), 
                                // but here we just apply settings. Let's keep it open to browse.
                            }}
                            activeOrbId={null} // We don't track active ID effectively for now
                        />
                    );
                })()
            }

            {/* Advanced Crop Modal */}
            <OrbCropModal
                isOpen={isCropModalOpen}
                onClose={() => {
                    setIsCropModalOpen(false);
                    // If we have an active favorite, update it automatically so changes persist after preview mode ends
                    if (orbNavOrbId) {
                        updateOrbFavorite(orbNavOrbId, {
                            orbAdvancedMasks,
                            orbMaskRects,
                            orbMaskPaths,
                            orbMaskModes
                        });
                    }
                }}
                image={customOrbImage}
                spillConfig={orbSpill}
                scale={orbImageScale}
                xOffset={orbImageXOffset}
                yOffset={orbImageYOffset}
                orbSize={orbSize}
                orbImageScaleW={orbImageScaleW}
                orbImageScaleH={orbImageScaleH}
                // Advanced State
                advancedMasks={orbAdvancedMasks}
                setAdvancedMasks={setOrbAdvancedMasks}
                maskRects={orbMaskRects}
                setMaskRects={setOrbMaskRects}
                // New Path Props
                maskPaths={orbMaskPaths}
                setMaskPaths={setOrbMaskPaths}
                maskModes={orbMaskModes}
                setMaskModes={setOrbMaskModes}
                // Preview Mode
                setIsOrbPreviewMode={setIsOrbPreviewMode}
            />

        </div >
    );
}
