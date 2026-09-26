import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Settings, Plus, Trash2, ZoomIn, Move, Maximize, X, Check, ChevronDown, Save, MoreHorizontal, Eye } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import { usePlaylistStore } from '../store/playlistStore';
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
        orbMaskPaths, setOrbMaskPaths, // New
        orbMaskModes, setOrbMaskModes, // New
        orbFavorites, addOrbFavorite, clearOrbFavorites,
        isOrbPreviewMode, setIsOrbPreviewMode // New
    } = useConfigStore();

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
            name: `Orb ${new Date().toLocaleDateString()}`, // Default name
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
        setSelectedPlaylistIds([]); // Clear selection
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
        <div className="w-full h-full flex flex-col relative overflow-y-auto">
            <BottomNavigation />
            <div className="flex-1 p-6 pt-0">
                {/* --- Configuration Section --- */}
                <h2 className="text-xl font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                    <Settings className="text-sky-500" /> Orb Configuration
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mb-12">
                    {/* Left Column: Visualizer & Core Controls */}
                    <div className="space-y-6">
                        {/* Visualizer Section */}
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10 flex flex-col items-center">
                            {/* Toggle Spill Switch */}


                            {/* Visualizer Container */}
                            <div className="relative w-64 h-64 border-2 border-white/20 rounded-3xl overflow-visible bg-black/20 select-none group backdrop-blur-sm shadow-xl">
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

                                                    {/* Advanced Masks Logic */}
                                                    {['tl', 'tr', 'bl', 'br'].map(q => {
                                                        if (!orbSpill[q]) return null;

                                                        // Default Spill Rects (Infinite Spill)
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

                                                        // Custom Mask Logic
                                                        const mode = orbMaskModes[q] || 'rect';

                                                        if (mode === 'path') {
                                                            const points = orbMaskPaths[q] || [];
                                                            if (points.length < 3) return <rect key={q} x={defaults[q].x} y={defaults[q].y} width={defaults[q].width} height={defaults[q].height} />;

                                                            // Convert 0-100 to 0-1
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
                                                    ${q === 'tl' ? 'border-r border-b rounded-tl-3xl' : ''}
                                                    ${q === 'tr' ? 'border-l border-b rounded-tr-3xl' : ''}
                                                    ${q === 'bl' ? 'border-r border-t rounded-bl-3xl' : ''}
                                                    ${q === 'br' ? 'border-l border-t rounded-br-3xl' : ''}
                                                    ${orbSpill[q] ? 'bg-sky-500/30' : ''}
                                                `}
                                                >
                                                    {orbSpill[q] && (
                                                        <div className="p-1 bg-sky-500 rounded-full text-white shadow-sm">
                                                            <Check size={12} strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30 p-4">
                                        <div className="p-4 rounded-full bg-white/5 mb-2">
                                            <Maximize size={24} className="opacity-50" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                                    </div>
                                )}

                                {/* Advanced Crop Button */}
                                {customOrbImage && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsCropModalOpen(true);
                                        }}
                                        className="absolute top-2 right-2 z-40 p-1.5 bg-black/40 hover:bg-sky-500 text-white rounded-lg transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                        title="Advanced Crop & View"
                                    >
                                        <Settings size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Upload Controls */}
                            <div className="mt-6 flex flex-col gap-3 w-full max-w-[200px]">
                                <label className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold uppercase rounded-lg cursor-pointer transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2">
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
                                        className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2"
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
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10 h-full flex flex-col gap-8">
                            {/* Toggles Section */}
                            <div className="space-y-4 border-b border-white/5 pb-2">
                                {/* Toggle Spill Switch */}
                                <div className="w-full flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase text-slate-400">Enable Spill</label>
                                    <button
                                        onClick={() => setIsSpillEnabled(!isSpillEnabled)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isSpillEnabled ? 'bg-sky-500' : 'bg-slate-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isSpillEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Toggle Live Preview Switch */}
                                <div className="w-full flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                                        <Eye size={14} className={isOrbPreviewMode ? "text-sky-400" : "text-slate-500"} />
                                        Live Preview
                                    </label>
                                    <button
                                        onClick={() => setIsOrbPreviewMode(!isOrbPreviewMode)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isOrbPreviewMode ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                        title="Show this configuration on the main Orb"
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isOrbPreviewMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Adjustments Section */}
                            <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <ZoomIn size={14} /> Adjustments
                                </h3>

                                {customOrbImage && isSpillEnabled ? (
                                    <div className="space-y-8">
                                        {/* Scale Slider */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-400 uppercase">Scale</label>
                                                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">{orbImageScale.toFixed(2)}x</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-500">0.5x</span>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="3.0"
                                                    step="0.05"
                                                    value={orbImageScale}
                                                    onChange={(e) => setOrbImageScale(parseFloat(e.target.value))}
                                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all"
                                                />
                                                <span className="text-[10px] font-bold text-slate-500">3.0x</span>
                                            </div>
                                        </div>

                                        {/* X Offset Slider */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-400 uppercase">Horizontal (X)</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">{orbImageXOffset}px</span>
                                                    {orbImageXOffset !== 0 && (
                                                        <button onClick={() => setOrbImageXOffset(0)} className="text-[10px] text-slate-500 hover:text-white transition-colors">Reset</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-500">-100</span>
                                                <input
                                                    type="range"
                                                    min="-100"
                                                    max="100"
                                                    step="1"
                                                    value={orbImageXOffset}
                                                    onChange={(e) => setOrbImageXOffset(parseInt(e.target.value))}
                                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all"
                                                />
                                                <span className="text-[10px] font-bold text-slate-500">+100</span>
                                            </div>
                                        </div>

                                        {/* Y Offset Slider */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-400 uppercase">Vertical (Y)</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">{orbImageYOffset}px</span>
                                                    {orbImageYOffset !== 0 && (
                                                        <button onClick={() => setOrbImageYOffset(0)} className="text-[10px] text-slate-500 hover:text-white transition-colors">Reset</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-500">-100</span>
                                                <input
                                                    type="range"
                                                    min="-100"
                                                    max="100"
                                                    step="1"
                                                    value={orbImageYOffset}
                                                    onChange={(e) => setOrbImageYOffset(parseInt(e.target.value))}
                                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all"
                                                />
                                                <span className="text-[10px] font-bold text-slate-500">+100</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20">
                                        <Move size={32} className="mb-2 opacity-50" />
                                        <p className="text-xs font-medium uppercase tracking-wider text-center max-w-[200px]">
                                            {customOrbImage ? "Enable Spill to Adjust Image" : "Upload Image to Start"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Save & Playlist Assignment Section */}
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                                    <Save size={14} /> Save Preset
                                </h3>

                                <div className="space-y-4">


                                    {/* Playlist Dropdown */}
                                    <div className="relative" ref={dropdownRef}>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Assign to Playlists</label>
                                        <button
                                            onClick={() => setIsPlaylistDropdownOpen(!isPlaylistDropdownOpen)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-slate-800 transition-colors"
                                        >
                                            <span className={selectedPlaylistIds.length === 0 ? "text-slate-500" : "text-white"}>
                                                {selectedPlaylistIds.length === 0
                                                    ? "Select Playlists..."
                                                    : `${selectedPlaylistIds.length} Playlists Selected`
                                                }
                                            </span>
                                            <ChevronDown size={14} className={`transform transition-transform ${isPlaylistDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isPlaylistDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto p-1">
                                                {allPlaylists.map(playlist => {
                                                    const isSelected = selectedPlaylistIds.includes(playlist.id);
                                                    return (
                                                        <button
                                                            key={playlist.id}
                                                            onClick={() => togglePlaylistSelection(playlist.id)}
                                                            className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors ${isSelected
                                                                ? 'bg-sky-500/20 text-sky-400'
                                                                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                                                                }`}
                                                        >
                                                            <span className="truncate text-sm">{playlist.name}</span>
                                                            {isSelected && <Check size={14} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSaveOrb}
                                        className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold uppercase tracking-wide rounded-lg shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Save size={16} />
                                        Save Configuration
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* --- Saved Orbs Grid Section Removed --- */}

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
                />
            </div>
        </div >
    );
};

export default OrbConfigPlaceholderPage;
