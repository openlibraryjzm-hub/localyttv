import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Settings, Plus, Trash2, ZoomIn, Move, Maximize, X, Check, ChevronDown, Save, MoreHorizontal, Eye } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import { usePlaylistStore } from '../store/playlistStore';
import { getAllPlaylistMetadata } from '../api/playlistApi';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import OrbCropModal from './OrbCropModal';
import { saveImageToCache } from '../api/platformBridge';

// --- Orb Card Component ---
import OrbCard from './OrbCard';
import BottomNavigation from './BottomNavigation';

// --- Main Page Component ---
const OrbConfigPlaceholderPage = () => {
    const {
        customOrbImage, setCustomOrbImage,
        isSpillEnabled, setIsSpillEnabled,
        orbSpill, setOrbSpill,
        orbImageScale, setOrbImageScale,
        orbImageXOffset, setOrbImageXOffset,
        orbImageYOffset, setOrbImageYOffset,
        orbAdvancedMasks, setOrbAdvancedMasks,
        orbMaskRects, setOrbMaskRects,
        orbMaskPaths, setOrbMaskPaths,
        orbMaskModes, setOrbMaskModes,
        orbFavorites, addOrbFavorite, clearOrbFavorites,
        isOrbPreviewMode, setIsOrbPreviewMode,
        fullscreenBanner,
        bannerNavBannerId,
        bannerPresets,
        bannerPreviewMode
    } = useConfigStore();

    // Resolve dynamic banner background
    let effectiveBanner = fullscreenBanner;
    if (bannerNavBannerId && !bannerPreviewMode && bannerPresets?.length) {
        const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
        if (preset?.fullscreenBanner) effectiveBanner = preset.fullscreenBanner;
    }

    const bannerImage = effectiveBanner?.image || '/banner.PNG';
    const bannerScale = effectiveBanner?.scale ?? 100;
    const bannerVertical = effectiveBanner?.verticalPosition ?? 0;
    const bannerHorizontal = effectiveBanner?.horizontalOffset ?? 0;

    // Playlist Store
    const { allPlaylists } = usePlaylistStore();

    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    const toggleSpillQuadrant = (q) => {
        setOrbSpill({ ...orbSpill, [q]: !orbSpill[q] });
    };

    // New Config Workflow State
    const [selectedPlaylistIds, setSelectedPlaylistIds] = useState([]);
    const [isPlaylistDropdownOpen, setIsPlaylistDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Playlist metadata for thumbnail previews
    const [playlistMetadataMap, setPlaylistMetadataMap] = useState({});

    useEffect(() => {
        async function loadPlaylistMeta() {
            try {
                const metadataList = await getAllPlaylistMetadata().catch(() => []);
                const map = {};
                if (Array.isArray(metadataList)) {
                    metadataList.forEach(m => {
                        map[m.playlist_id] = m;
                    });
                }
                setPlaylistMetadataMap(map);
            } catch (err) {
                console.error('Failed to load playlist metadata for dropdown:', err);
            }
        }
        loadPlaylistMeta();
    }, []);

    const getPlaylistThumbnailAndCount = (playlist) => {
        const meta = playlistMetadataMap[playlist.id];
        let thumbnailUrl = null;
        let itemCount = meta ? meta.count : 0;

        if (playlist.custom_thumbnail_url) {
            thumbnailUrl = playlist.custom_thumbnail_url;
        } else if (meta && meta.first_video) {
            const vid = meta.first_video;
            thumbnailUrl = vid.thumbnail_url || (vid.video_id ? getThumbnailUrl(vid.video_id, 'medium') : null);
        }
        return { thumbnailUrl, itemCount };
    };

    // One-time wipe of presets
    useEffect(() => {
        const hasWiped = localStorage.getItem('orb_presets_wiped_v1');
        if (!hasWiped) {
            clearOrbFavorites();
            localStorage.setItem('orb_presets_wiped_v1', 'true');
        }
    }, [clearOrbFavorites]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPlaylistDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup: Turn off live preview when leaving the page
    useEffect(() => {
        return () => {
            setIsOrbPreviewMode(false);
        };
    }, [setIsOrbPreviewMode]);

    const togglePlaylistSelection = (id) => {
        setSelectedPlaylistIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleSaveOrb = () => {
        const newPreset = {
            id: Date.now().toString(),
            name: `Orb ${new Date().toLocaleDateString()}`,
            customOrbImage,
            isSpillEnabled,
            orbSpill,
            orbImageScale,
            orbImageXOffset,
            orbImageYOffset,
            orbAdvancedMasks,
            orbMaskRects,
            playlistIds: selectedPlaylistIds
        };

        addOrbFavorite(newPreset);
        setSelectedPlaylistIds([]);
        alert(`Orb Configuration Saved!`);
    };

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

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-950">
            {/* Blurred App Banner Background Layer */}
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
            >
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

            {/* Content Layer */}
            <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-y-auto">
                <BottomNavigation title="Orb Configuration" />
                <div className="flex-1 p-6 flex flex-col items-center">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full mb-12 justify-center mx-auto items-stretch">
                        {/* Left Column: Visualizer & Core Controls */}
                        <div className="flex flex-col h-full">
                            <div className="bg-slate-100 border-2 border-[#052F4A] rounded-2xl shadow-2xl p-6 h-full flex flex-col items-center justify-center gap-6">
                                {/* Visualizer Container */}
                                <div className="relative w-64 h-64 border-2 border-[#052F4A] rounded-3xl overflow-visible bg-white select-none group shadow-xl">
                                    {customOrbImage ? (
                                        <>
                                            <img
                                                src={customOrbImage}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 origin-center"
                                                style={{
                                                    transform: `scale(${orbImageScale}) translate(${orbImageXOffset * 0.3}px, ${orbImageYOffset * 0.3}px)`,
                                                    clipPath: 'url(#placeholderVisualizerClip)'
                                                }}
                                                alt="Orb Preview"
                                            />

                                            {/* SVG Definitions */}
                                            <svg width="0" height="0" className="absolute">
                                                <defs>
                                                    <clipPath id="placeholderVisualizerClip" clipPathUnits="objectBoundingBox">
                                                        <circle cx="0.5" cy="0.5" r="0.35" />

                                                        {['tl', 'tr', 'bl', 'br'].map(q => {
                                                            if (!orbSpill[q]) return null;

                                                            const defaults = {
                                                                tl: { x: -0.5, y: -0.5, w: 1.0, h: 1.0 },
                                                                tr: { x: 0.5, y: -0.5, w: 0.5, h: 1.0 },
                                                                bl: { x: -0.5, y: 0.5, w: 1.0, h: 0.5 },
                                                                br: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
                                                            };

                                                            if (!orbAdvancedMasks[q]) {
                                                                const d = defaults[q];
                                                                return <rect key={q} x={d.x} y={d.y} width={d.w} height={d.h} />;
                                                            }

                                                            const mode = orbMaskModes[q] || 'rect';

                                                            if (mode === 'path') {
                                                                const points = orbMaskPaths[q] || [];
                                                                if (points.length < 3) return <rect key={q} x={defaults[q].x} y={defaults[q].y} width={defaults[q].width} height={defaults[q].height} />;

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
                                                        relative border-dashed border-[#052F4A]/30 transition-all duration-200 hover:bg-[#052F4A]/20 active:scale-95 flex items-center justify-center
                                                        ${q === 'tl' ? 'border-r border-b rounded-tl-3xl' : ''}
                                                        ${q === 'tr' ? 'border-l border-b rounded-tr-3xl' : ''}
                                                        ${q === 'bl' ? 'border-r border-t rounded-bl-3xl' : ''}
                                                        ${q === 'br' ? 'border-l border-t rounded-br-3xl' : ''}
                                                        ${orbSpill[q] ? 'bg-[#052F4A]/30' : ''}
                                                    `}
                                                    >
                                                        {orbSpill[q] && (
                                                            <div className="p-1 bg-[#052F4A] rounded-full text-white shadow-sm">
                                                                <Check size={12} strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-[#052F4A]/40 p-4">
                                            <div className="p-4 rounded-full bg-[#052F4A]/5 mb-2">
                                                <Maximize size={24} className="opacity-50" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#052F4A]">No Image</span>
                                        </div>
                                    )}

                                    {/* Advanced Crop Button */}
                                    {customOrbImage && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsCropModalOpen(true);
                                            }}
                                            className="absolute top-2 right-2 z-40 p-2 bg-[#052F4A] hover:bg-[#084267] text-white rounded-xl transition-all shadow-md opacity-0 group-hover:opacity-100"
                                            title="Advanced Crop & View"
                                        >
                                            <Settings size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Upload Controls */}
                                <div className="flex flex-col gap-3 w-full max-w-[220px]">
                                    <label className="w-full py-2.5 bg-[#052F4A] hover:bg-[#084267] text-white text-xs font-bold uppercase rounded-xl cursor-pointer transition-all shadow-md border-2 border-[#052F4A] flex items-center justify-center gap-2">
                                        <Plus size={14} />
                                        Upload Image
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
                                            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 border-2 border-red-500/30 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={14} />
                                            Remove Image
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Sliders & Config */}
                        <div className="space-y-6">
                            <div className="bg-slate-100 border-2 border-[#052F4A] rounded-2xl shadow-2xl p-6 h-full flex flex-col gap-8">
                                {/* Toggles Section */}
                                <div className="space-y-4 border-b-2 border-[#052F4A]/20 pb-4">
                                    {/* Toggle Spill Switch */}
                                    <div className="w-full flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase text-[#052F4A]">Enable Spill</label>
                                        <button
                                            onClick={() => setIsSpillEnabled(!isSpillEnabled)}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors border border-[#052F4A]/20 ${isSpillEnabled ? 'bg-[#052F4A]' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isSpillEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {/* Toggle Live Preview Switch */}
                                    <div className="w-full flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase text-[#052F4A] flex items-center gap-2">
                                            <Eye size={14} className={isOrbPreviewMode ? "text-[#052F4A]" : "text-slate-400"} />
                                            Live Preview
                                        </label>
                                        <button
                                            onClick={() => setIsOrbPreviewMode(!isOrbPreviewMode)}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors border border-[#052F4A]/20 ${isOrbPreviewMode ? 'bg-[#052F4A]' : 'bg-slate-300'}`}
                                            title="Show this configuration on the main Orb"
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isOrbPreviewMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Adjustments Section */}
                                <div>
                                    <h3 className="text-xs font-black uppercase text-[#052F4A] tracking-widest mb-6 flex items-center gap-2 border-b-2 border-[#052F4A]/20 pb-2">
                                        <ZoomIn size={14} /> Adjustments
                                    </h3>

                                    {customOrbImage && isSpillEnabled ? (
                                        <div className="space-y-6">
                                            {/* Scale Slider */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-[#052F4A] uppercase">Scale</label>
                                                    <span className="text-xs font-mono font-bold text-[#052F4A] bg-slate-200 px-2 py-0.5 rounded border border-[#052F4A]/20">{orbImageScale.toFixed(2)}x</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-[#052F4A]/70">0.5x</span>
                                                    <input
                                                        type="range"
                                                        min="0.5"
                                                        max="3.0"
                                                        step="0.05"
                                                        value={orbImageScale}
                                                        onChange={(e) => setOrbImageScale(parseFloat(e.target.value))}
                                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#052F4A]"
                                                    />
                                                    <span className="text-[10px] font-bold text-[#052F4A]/70">3.0x</span>
                                                </div>
                                            </div>

                                            {/* X Offset Slider */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-[#052F4A] uppercase">Horizontal (X)</label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono font-bold text-[#052F4A] bg-slate-200 px-2 py-0.5 rounded border border-[#052F4A]/20">{orbImageXOffset}px</span>
                                                        {orbImageXOffset !== 0 && (
                                                            <button onClick={() => setOrbImageXOffset(0)} className="text-[10px] font-bold text-[#052F4A]/70 hover:text-[#052F4A] transition-colors">Reset</button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-[#052F4A]/70">-100</span>
                                                    <input
                                                        type="range"
                                                        min="-100"
                                                        max="100"
                                                        step="1"
                                                        value={orbImageXOffset}
                                                        onChange={(e) => setOrbImageXOffset(parseInt(e.target.value))}
                                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#052F4A]"
                                                    />
                                                    <span className="text-[10px] font-bold text-[#052F4A]/70">+100</span>
                                                </div>
                                            </div>

                                            {/* Y Offset Slider */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-[#052F4A] uppercase">Vertical (Y)</label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono font-bold text-[#052F4A] bg-slate-200 px-2 py-0.5 rounded border border-[#052F4A]/20">{orbImageYOffset}px</span>
                                                        {orbImageYOffset !== 0 && (
                                                            <button onClick={() => setOrbImageYOffset(0)} className="text-[10px] font-bold text-[#052F4A]/70 hover:text-[#052F4A] transition-colors">Reset</button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-[#052F4A]/70">-100</span>
                                                    <input
                                                        type="range"
                                                        min="-100"
                                                        max="100"
                                                        step="1"
                                                        value={orbImageYOffset}
                                                        onChange={(e) => setOrbImageYOffset(parseInt(e.target.value))}
                                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#052F4A]"
                                                    />
                                                    <span className="text-[10px] font-bold text-[#052F4A]/70">+100</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-36 flex flex-col items-center justify-center text-[#052F4A]/60 border-2 border-dashed border-[#052F4A]/30 rounded-xl bg-white/50">
                                            <Move size={28} className="mb-2 opacity-50" />
                                            <p className="text-xs font-bold uppercase tracking-wider text-center max-w-[200px]">
                                                {customOrbImage ? "Enable Spill to Adjust Image" : "Upload Image to Start"}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Save & Playlist Assignment Section */}
                                <div className="pt-6 border-t-2 border-[#052F4A]/20">
                                    <h3 className="text-xs font-black uppercase text-[#052F4A] tracking-widest mb-4 flex items-center gap-2">
                                        <Save size={14} /> Save Preset
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Playlist Dropdown */}
                                        <div className="relative" ref={dropdownRef}>
                                            <label className="text-[10px] font-bold text-[#052F4A] uppercase mb-1 block">Assign to Playlists</label>
                                            <button
                                                onClick={() => setIsPlaylistDropdownOpen(!isPlaylistDropdownOpen)}
                                                className="w-full bg-white border-2 border-[#052F4A]/30 rounded-xl px-4 py-2.5 text-sm font-bold text-left flex items-center justify-between hover:bg-slate-50 transition-colors text-[#052F4A] shadow-sm"
                                            >
                                                <span className={selectedPlaylistIds.length === 0 ? "text-[#052F4A]/60" : "text-[#052F4A]"}>
                                                    {selectedPlaylistIds.length === 0
                                                        ? "Select Playlists..."
                                                        : `${selectedPlaylistIds.length} Playlists Selected`
                                                    }
                                                </span>
                                                <ChevronDown size={16} className={`transform transition-transform ${isPlaylistDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isPlaylistDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-100 border-2 border-[#052F4A] rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 space-y-1.5">
                                                    {allPlaylists.map(playlist => {
                                                        const isSelected = selectedPlaylistIds.includes(playlist.id);
                                                        const { thumbnailUrl, itemCount } = getPlaylistThumbnailAndCount(playlist);

                                                        return (
                                                            <button
                                                                key={playlist.id}
                                                                type="button"
                                                                onClick={() => togglePlaylistSelection(playlist.id)}
                                                                className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors ${isSelected
                                                                    ? 'bg-[#052F4A] text-white font-bold'
                                                                    : 'hover:bg-slate-200 text-[#052F4A] font-bold'
                                                                }`}
                                                            >
                                                                {thumbnailUrl ? (
                                                                    <img
                                                                        src={thumbnailUrl}
                                                                        alt={playlist.name}
                                                                        className="w-14 h-10 rounded-lg object-cover shrink-0 border border-[#052F4A]/20 shadow-sm"
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.style.display = 'none';
                                                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div
                                                                    className={`w-14 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                                                                        isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200 text-[#052F4A] border-[#052F4A]/20'
                                                                    }`}
                                                                    style={{ display: thumbnailUrl ? 'none' : 'flex' }}
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="truncate text-xs font-bold uppercase">{playlist.name}</span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                                                                            isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200/80 text-[#052F4A]/80 border-[#052F4A]/10'
                                                                        }`}>
                                                                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="p-1 bg-white rounded-full text-[#052F4A] shrink-0">
                                                                        <Check size={12} strokeWidth={3} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Save Button */}
                                        <button
                                            onClick={handleSaveOrb}
                                            className="w-full py-3 bg-[#052F4A] hover:bg-[#084267] text-white font-bold uppercase tracking-wide rounded-xl shadow-lg border-2 border-[#052F4A] transition-all flex items-center justify-center gap-2 mt-2"
                                        >
                                            <Save size={16} />
                                            Save Configuration
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Advanced Crop Modal */}
                    <OrbCropModal
                        isOpen={isCropModalOpen}
                        onClose={() => setIsCropModalOpen(false)}
                        image={customOrbImage}
                        spillConfig={orbSpill}
                        scale={orbImageScale}
                        xOffset={orbImageXOffset}
                        yOffset={orbImageYOffset}
                        advancedMasks={orbAdvancedMasks}
                        setAdvancedMasks={setOrbAdvancedMasks}
                        maskRects={orbMaskRects}
                        setMaskRects={setOrbMaskRects}
                        maskPaths={orbMaskPaths}
                        setMaskPaths={setOrbMaskPaths}
                        maskModes={orbMaskModes}
                        setMaskModes={setOrbMaskModes}
                    />
                </div>
            </div>
        </div>
    );
};

export default OrbConfigPlaceholderPage;
