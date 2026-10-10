import React, { useState, useRef, useEffect } from 'react';
import { Image, Save, ChevronDown, Trash2, Upload, Repeat, Check } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import { usePlaylistStore } from '../store/playlistStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { getAllPlaylistMetadata } from '../api/playlistApi';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import { saveImageToCache } from '../api/platformBridge';
import BottomNavigation from './BottomNavigation';

/**
 * Radically Simplified AppPage
 * Two vertical bars side-by-side for Left and Right banner halves.
 * Styled with solid light card theme (#052F4A) and dynamic blurred banner backdrop.
 */
export default function AppPage({ onBack }) {
    const {
        fullscreenBanner, updateFullscreenBanner,
        splitscreenBanner, updateSplitscreenBanner,
        addBannerPreset,
        stashBanners, restoreBanners,
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

    const { allPlaylists } = usePlaylistStore();
    const { activePage, groups, getGroupIdsForPlaylist } = usePlaylistGroupStore();

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
                if (side === 'left') updateFullscreenBanner({ image: cachedUrl, name: file.name });
                else updateSplitscreenBanner({ image: cachedUrl, name: file.name });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSavePreset = () => {
        const defaultName = fullscreenBanner?.name || splitscreenBanner?.name || `Banner ${new Date().toLocaleDateString()}`;
        const newPreset = {
            id: Date.now().toString(),
            name: defaultName,
            fullscreenBanner: fullscreenBanner,
            splitscreenBanner: splitscreenBanner,
            playlistIds: selectedPlaylistIds,
            // Legacy fallbacks for card thumbnail
            customBannerImage: fullscreenBanner?.image || splitscreenBanner?.image
        };

        addBannerPreset(newPreset);
        setSelectedPlaylistIds([]);
        alert(`Banner Preset "${defaultName}" Saved!`);
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
        <div className="flex-1 min-w-[320px] bg-slate-100 border-2 border-[#052F4A] rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Bar Header */}
            <div className="px-6 py-5 md:px-8 md:py-6 border-b-2 border-[#052F4A]/20 bg-slate-200/50 flex items-center justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#052F4A] leading-none">
                        {side === 'left' ? 'Left Half' : 'Right Half'}
                    </h2>
                    <p className="text-[10px] font-black text-[#052F4A]/70 uppercase tracking-[0.3em] mt-1.5">Banner Configuration</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleCopy(side)}
                        className="p-2.5 border border-[#052F4A]/30 hover:bg-[#052F4A]/10 text-[#052F4A] rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold uppercase"
                        title="Copy settings to other side"
                    >
                        <Repeat size={16} />
                        <span className="hidden sm:inline">Copy to {side === 'left' ? 'Right' : 'Left'}</span>
                    </button>
                    {config.image && (
                        <button 
                            onClick={() => update({ image: null })}
                            className="p-2.5 border border-red-500/30 hover:bg-red-500/10 text-red-600 rounded-xl transition-all active:scale-95"
                            title="Remove Image"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Preview Box */}
            <div className="p-4 md:p-8">
                <div className="aspect-video w-full bg-slate-200/60 rounded-2xl relative overflow-hidden group border-2 border-dashed border-[#052F4A]/30 transition-all hover:border-[#052F4A]">
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#052F4A]/40">
                            <Image size={40} className="md:w-12 md:h-12 mb-3 opacity-30" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Blank Canvas</span>
                        </div>
                    )}
                    
                    {/* Interaction Overlay */}
                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-[#052F4A]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                        <div className="bg-white text-[#052F4A] p-3.5 rounded-full shadow-2xl mb-2 transform translate-y-3 group-hover:translate-y-0 transition-transform">
                            <Upload size={22} />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-widest transform translate-y-3 group-hover:translate-y-0 transition-transform delay-75">
                            {config.image ? 'Change Art' : 'Upload Art'}
                        </span>
                        <input type="file" accept="image/*" onChange={(e) => handleBannerUpload(side, e)} className="hidden" />
                    </label>
                </div>
            </div>

            {/* Controls */}
            <div className="px-6 pb-6 md:px-8 md:pb-8 space-y-6 flex-1 flex flex-col justify-center">
                {/* Scale Slider */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase text-[#052F4A]">Scale Factor</label>
                        <span className="text-xs font-mono font-bold text-[#052F4A] bg-slate-200 px-2 py-0.5 rounded border border-[#052F4A]/20 tabular-nums">{config.scale ?? 100}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-[#052F4A]/70">10%</span>
                        <input
                            type="range" min="10" max="300"
                            value={config.scale ?? 100}
                            onChange={(e) => update({ scale: parseInt(e.target.value) })}
                            className="flex-1 h-2 bg-slate-200 rounded-full appearance-none accent-[#052F4A] cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-[#052F4A]/70">300%</span>
                    </div>
                </div>

                {/* XY Offsets */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase text-[#052F4A]">Vertical</label>
                            <span className="text-xs font-mono font-bold text-[#052F4A] bg-slate-200 px-1.5 py-0.5 rounded border border-[#052F4A]/20 tabular-nums">{config.verticalPosition ?? 0}%</span>
                        </div>
                        <input
                            type="range" min="-100" max="100"
                            value={config.verticalPosition ?? 0}
                            onChange={(e) => update({ verticalPosition: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-[#052F4A] cursor-pointer"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase text-[#052F4A]">Horizontal</label>
                            <span className="text-xs font-mono font-bold text-[#052F4A] bg-slate-200 px-1.5 py-0.5 rounded border border-[#052F4A]/20 tabular-nums">{config.horizontalOffset ?? 0}%</span>
                        </div>
                        <input
                            type="range" min="-200" max="200"
                            value={config.horizontalOffset ?? 0}
                            onChange={(e) => update({ horizontalOffset: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-[#052F4A] cursor-pointer"
                        />
                    </div>
                </div>

                {/* Animation & Flip Toggles */}
                <div className="pt-6 border-t-2 border-[#052F4A]/20 space-y-4">
                    {/* Motion Scroll */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border border-[#052F4A]/20 transition-all ${config.scrollEnabled ? 'bg-[#052F4A] text-white shadow-md' : 'bg-slate-200 text-[#052F4A]/60'}`}>
                                <Repeat size={16} />
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase text-[#052F4A] block">Motion Scroll</span>
                                <span className="text-[10px] font-semibold text-[#052F4A]/60 uppercase">Infinite Panning</span>
                            </div>
                        </div>
                        <button
                            onClick={() => update({ scrollEnabled: !config.scrollEnabled })}
                            className={`w-12 h-6 rounded-full p-1 transition-colors border border-[#052F4A]/20 ${config.scrollEnabled ? 'bg-[#052F4A]' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config.scrollEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Flip Image */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border border-[#052F4A]/20 transition-all ${config.flipped ? 'bg-[#052F4A] text-white shadow-md' : 'bg-slate-200 text-[#052F4A]/60'}`}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l5 5-5 5"/><path d="M4 15h16"/></svg>
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase text-[#052F4A] block">Flip Image</span>
                                <span className="text-[10px] font-semibold text-[#052F4A]/60 uppercase">Horizontal Mirror</span>
                            </div>
                        </div>
                        <button
                            onClick={() => update({ flipped: !config.flipped })}
                            className={`w-12 h-6 rounded-full p-1 transition-colors border border-[#052F4A]/20 ${config.flipped ? 'bg-[#052F4A]' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config.flipped ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

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
                <BottomNavigation title="App Banner Configuration" />
                
                <div className="flex-1 p-6 flex flex-col items-center">
                    {/* Side Switcher (Mobile) */}
                    <div className="lg:hidden mb-6 w-full max-w-5xl">
                        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center border-2 border-[#052F4A] shadow-md">
                            <button 
                                onClick={() => setActiveSide('left')}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSide === 'left' ? 'bg-[#052F4A] text-white shadow-md' : 'text-[#052F4A]/70'}`}
                            >
                                Left Half
                            </button>
                            <button 
                                onClick={() => setActiveSide('right')}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSide === 'right' ? 'bg-[#052F4A] text-white shadow-md' : 'text-[#052F4A]/70'}`}
                            >
                                Right Half
                            </button>
                        </div>
                    </div>

                    {/* Content: Two Bars */}
                    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 max-w-5xl w-full items-stretch justify-center mx-auto">
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

                    {/* Bottom Action Bar */}
                    <div className="w-full max-w-5xl mx-auto mt-8 p-6 bg-slate-100 rounded-2xl border-2 border-[#052F4A] shadow-2xl flex items-center justify-between gap-4">
                        {/* Playlist Picker */}
                        <div className="relative flex-1" ref={dropdownRef}>
                            <label className="text-[10px] font-bold text-[#052F4A] uppercase mb-1 block">Target Playlists</label>
                            <button
                                onClick={() => setIsPlaylistDropdownOpen(!isPlaylistDropdownOpen)}
                                className="w-full bg-white border-2 border-[#052F4A]/30 rounded-xl px-4 py-2.5 text-xs font-bold uppercase text-[#052F4A] flex items-center justify-between hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <span className="truncate">
                                    {selectedPlaylistIds.length === 0 ? "Select Target Playlists..." : `${selectedPlaylistIds.length} Selected`}
                                </span>
                                <ChevronDown size={16} className={`shrink-0 transition-transform duration-300 ${isPlaylistDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isPlaylistDropdownOpen && (
                                <div className="absolute bottom-full mb-2 left-0 w-full bg-slate-100 border-2 border-[#052F4A] rounded-xl shadow-2xl z-50 p-2 max-h-60 overflow-y-auto space-y-1.5">
                                    {filteredPlaylists.map(p => {
                                        const isSelected = selectedPlaylistIds.includes(p.id);
                                        const { thumbnailUrl, itemCount } = getPlaylistThumbnailAndCount(p);

                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPlaylistIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                                                className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors ${
                                                    isSelected 
                                                    ? 'bg-[#052F4A] text-white font-bold' 
                                                    : 'hover:bg-slate-200 text-[#052F4A] font-bold'
                                                }`}
                                            >
                                                {thumbnailUrl ? (
                                                    <img
                                                        src={thumbnailUrl}
                                                        alt={p.name}
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
                                                        <span className="text-xs font-bold truncate uppercase">{p.name}</span>
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

                        {/* Save Action */}
                        <div className="flex flex-col justify-end">
                            <button
                                onClick={handleSavePreset}
                                className="py-3 px-6 bg-[#052F4A] hover:bg-[#084267] text-white font-bold uppercase tracking-wide rounded-xl shadow-lg border-2 border-[#052F4A] transition-all flex items-center justify-center gap-2 mt-5"
                                title="Save Preset"
                            >
                                <Save size={16} />
                                <span className="hidden sm:inline text-xs">Save Preset</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
