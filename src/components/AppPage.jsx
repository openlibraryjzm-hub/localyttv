import React, { useState, useRef, useEffect } from 'react';
import { Image, Save, ChevronDown, Trash2, Upload, Repeat, ArrowLeft, Check } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import { usePlaylistStore } from '../store/playlistStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { saveImageToCache } from '../api/platformBridge';

/**
 * Radically Simplified AppPage
 * Two vertical bars side-by-side for Left and Right banner halves.
 * No themes, no borders, no layout settings.
 */
export default function AppPage({ onBack }) {
    const {
        fullscreenBanner, updateFullscreenBanner,
        splitscreenBanner, updateSplitscreenBanner,
        addBannerPreset,
        stashBanners, restoreBanners
    } = useConfigStore();

    const { allPlaylists } = usePlaylistStore();
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

    // Stash banners on mount, restore on unmount for temporary live editing
    useEffect(() => {
        stashBanners();
        return () => restoreBanners();
    }, [stashBanners, restoreBanners]);

    // Active Side for Mobile/Small Screens
    const [activeSide, setActiveSide] = useState('left');

    // Preset State
    const [selectedPlaylistIds, setSelectedPlaylistIds] = useState([]);
    const [isPlaylistDropdownOpen, setIsPlaylistDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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

    const handleBannerUpload = (side, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const cachedUrl = await saveImageToCache(reader.result, 'banner');
                if (side === 'left') updateFullscreenBanner({ image: cachedUrl });
                else updateSplitscreenBanner({ image: cachedUrl });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSavePreset = () => {
        const name = prompt("Enter a name for this preset:", `Banner ${new Date().toLocaleDateString()}`);
        if (!name) return;

        const newPreset = {
            id: Date.now().toString(),
            name: name,
            fullscreenBanner: fullscreenBanner,
            splitscreenBanner: splitscreenBanner,
            playlistIds: selectedPlaylistIds,
            // Legacy fallbacks for card thumbnail
            customBannerImage: fullscreenBanner.image || splitscreenBanner.image
        };

        addBannerPreset(newPreset);
        setSelectedPlaylistIds([]);
        alert('Banner Preset Saved!');
    };

    const handleCopy = (fromSide) => {
        const source = fromSide === 'left' ? fullscreenBanner : splitscreenBanner;
        const targetUpdate = fromSide === 'left' ? updateSplitscreenBanner : updateFullscreenBanner;
        
        // Copy everything including image
        targetUpdate({
            image: source.image,
            scale: source.scale,
            verticalPosition: source.verticalPosition,
            horizontalOffset: source.horizontalOffset,
            scrollEnabled: source.scrollEnabled,
            flipped: source.flipped
        });
    };

    const BannerControlBar = ({ side, config, update }) => (
        <div className="flex-1 min-w-[320px] bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden">
            {/* Bar Header */}
            <div className="px-6 py-5 md:px-10 md:py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">
                        {side === 'left' ? 'Left Half' : 'Right Half'}
                    </h2>
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mt-2">Configuration</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleCopy(side)}
                        className="p-3 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-sky-500 rounded-2xl transition-all active:scale-90 flex items-center gap-2"
                        title="Copy settings to other side"
                    >
                        <Repeat size={18} />
                        <span className="text-[10px] font-black uppercase hidden sm:inline">Copy to {side === 'left' ? 'Right' : 'Left'}</span>
                    </button>
                    {config.image && (
                        <button 
                            onClick={() => update({ image: null })}
                            className="p-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-2xl transition-all active:scale-90"
                            title="Remove Image"
                        >
                            <Trash2 size={18} className="md:w-5 md:h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Preview Box */}
            <div className="p-4 md:p-10">
                <div className="aspect-video w-full bg-slate-50 dark:bg-black/40 rounded-[2rem] relative overflow-hidden group border-2 border-dashed border-slate-200 dark:border-white/10 transition-all hover:border-sky-500/30">
                    {config.image ? (
                        <div 
                            className="w-full h-full transition-transform duration-700"
                            style={{
                                backgroundImage: `url(${config.image})`,
                                backgroundSize: `${config.scale ?? 100}% auto`,
                                backgroundPosition: `${config.horizontalOffset ?? 0}% ${config.verticalPosition ?? 0}%`,
                                backgroundRepeat: 'repeat-x',
                                transform: config.flipped ? 'scaleX(-1)' : 'none'
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                            <Image size={40} className="md:w-14 md:h-14 mb-4 opacity-10" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] opacity-20">Blank Canvas</span>
                        </div>
                    )}
                    
                    {/* Interaction Overlay */}
                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-sky-600/80 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                        <div className="bg-white text-sky-600 p-4 rounded-full shadow-2xl mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            <Upload size={24} />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform delay-75">
                            {config.image ? 'Change Art' : 'Upload Art'}
                        </span>
                        <input type="file" accept="image/*" onChange={(e) => handleBannerUpload(side, e)} className="hidden" />
                    </label>
                </div>
            </div>

            {/* Controls */}
            <div className="px-6 pb-8 md:px-10 md:pb-12 space-y-6 md:space-y-10 flex-1 flex flex-col justify-center">
                {/* Scale Slider */}
                <div className="space-y-5">
                    <div className="flex justify-between items-end">
                        <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scale Factor</label>
                        <span className="text-sm md:text-lg font-black text-slate-900 dark:text-white tabular-nums">{config.scale ?? 100}%</span>
                    </div>
                    <input
                        type="range" min="10" max="300"
                        value={config.scale ?? 100}
                        onChange={(e) => update({ scale: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full appearance-none accent-sky-500 cursor-pointer"
                    />
                </div>

                {/* XY Offsets */}
                <div className="grid grid-cols-2 gap-6 md:gap-10">
                    <div className="space-y-5">
                        <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vertical</label>
                        <input
                            type="range" min="-100" max="100"
                            value={config.verticalPosition ?? 0}
                            onChange={(e) => update({ verticalPosition: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full appearance-none accent-sky-500 cursor-pointer"
                        />
                    </div>
                    <div className="space-y-5">
                        <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Horizontal</label>
                        <input
                            type="range" min="-200" max="200"
                            value={config.horizontalOffset ?? 0}
                            onChange={(e) => update({ horizontalOffset: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full appearance-none accent-sky-500 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Animation & Flip Toggles */}
                <div className="pt-6 md:pt-10 border-t border-slate-100 dark:border-white/5 space-y-4 md:space-y-6">
                    {/* Motion Scroll */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-all ${config.scrollEnabled ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                <Repeat size={18} />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 block">Motion Scroll</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Infinite Panning</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.scrollEnabled}
                                onChange={(e) => update({ scrollEnabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                    </div>

                    {/* Flip Image */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-all ${config.flipped ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l5 5-5 5"/><path d="M4 15h16"/></svg>
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 block">Flip Image</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Horizontal Mirror</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.flipped}
                                onChange={(e) => update({ flipped: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#020617] overflow-hidden">

            {/* Side Switcher (Always show top padding if header is gone) */}
            <div className="px-6 py-6 shrink-0">
                <div className="lg:hidden bg-white dark:bg-white/5 p-1.5 rounded-[1.5rem] flex items-center border border-slate-200 dark:border-white/10 shadow-sm">
                    <button 
                        onClick={() => setActiveSide('left')}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSide === 'left' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        Left Half
                    </button>
                    <button 
                        onClick={() => setActiveSide('right')}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSide === 'right' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        Right Half
                    </button>
                </div>
            </div>

            {/* Content: Two Bars */}
            <div className="flex-1 overflow-y-auto px-4 pb-12 md:px-12">
                <div className="flex flex-col lg:flex-row gap-6 md:gap-10 max-w-[1600px] mx-auto items-stretch">
                    <div className={`${activeSide === 'left' ? 'flex' : 'hidden'} lg:flex flex-1`}>
                        <BannerControlBar 
                            side="left" 
                            config={fullscreenBanner} 
                            update={updateFullscreenBanner} 
                        />
                    </div>
                    <div className={`${activeSide === 'right' ? 'flex' : 'hidden'} lg:flex flex-1`}>
                        <BannerControlBar 
                            side="right" 
                            config={splitscreenBanner} 
                            update={updateSplitscreenBanner} 
                        />
                    </div>
                </div>

                {/* Bottom Action Bar (Now scrollable) */}
                <div className="max-w-[1600px] mx-auto mt-10 p-8 bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                    {/* Playlist Picker */}
                    <div className="relative flex-1" ref={dropdownRef}>
                        <button
                            onClick={() => setIsPlaylistDropdownOpen(!isPlaylistDropdownOpen)}
                            className="w-full flex items-center justify-between gap-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm transition-all"
                        >
                            <span className="truncate">
                                {selectedPlaylistIds.length === 0 ? "Target Playlists" : `${selectedPlaylistIds.length} Selected`}
                            </span>
                            <ChevronDown size={16} className={`shrink-0 transition-transform duration-500 ${isPlaylistDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPlaylistDropdownOpen && (
                            <div className="absolute bottom-full mb-3 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-2 max-h-[40vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                                {filteredPlaylists.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPlaylistIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                                        className={`w-full text-left px-5 py-4 rounded-xl flex items-center justify-between transition-all mb-1 last:mb-0 ${
                                            selectedPlaylistIds.includes(p.id) 
                                            ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' 
                                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <span className="text-xs font-black truncate uppercase tracking-tight">{p.name}</span>
                                        {selectedPlaylistIds.includes(p.id) && <div className="bg-sky-500 p-1 rounded-full text-white"><Check size={12} /></div>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Save Action */}
                    <button
                        onClick={handleSavePreset}
                        className="p-5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-2xl shadow-sky-500/30 active:scale-95 transition-all flex items-center justify-center shrink-0"
                        title="Save Preset"
                    >
                        <Save size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
