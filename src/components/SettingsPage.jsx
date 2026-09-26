import React, { useState, useEffect, useRef } from 'react';
import { Palette, User, Smile, ExternalLink, Copy, Check, Image, Layout, Music, Box, Volume2, Heart, Trash2, Plus, Star, Folder, ChevronDown, Shuffle, MapPin, FileText, Settings } from 'lucide-react';
import { openUrl } from '../api/platformBridge';
import { useConfigStore } from '../store/configStore';
import { THEMES } from '../utils/themes';
import { FOLDER_COLORS } from '../utils/folderColors';
import PageBanner from './PageBanner';
import { getAllPlaylists } from '../api/playlistApi';
import OrbPage from './OrbPage';
import PagePage from './PagePage';
import AppPage from './AppPage';
import YouPage from './YouPage';

const AVATARS = [
    '( ͡° ͜ʖ ͡°)',
    '( ͠° ͟ʖ ͡°)',
    '( ͡~ ͜ʖ ͡°)',
    '( . •́ _ʖ •̀ .)',
    '( ಠ ͜ʖ ಠ)',
    '( ͡o ͜ʖ ͡o)',
    '( ͡◉ ͜ʖ ͡◉)',
    '( ͡☉ ͜ʖ ͡☉)',
    '( ͡⚆ ͜ʖ ͡⚆)',
    '( ͡◎ ͜ʖ ͡◎)',
    '( ✧≖ ͜ʖ≖)',
    '( ง ͠° ͟ل͜ ͡°) ง',
    '( ͡° ͜V ͡°)',
    '¯\\_(ツ)_/¯',
    '(>_>)',
    '(^_^)',
    '(¬_¬)',
    `
   /\\
  /  \\
  |  |
  |  |
 / == \\
 |/**\\|
`,
    `
 .--.
|o_o |
|:_/ |
//   \\ \\
(|     | )
/'\\_   _/\`\\
\\___)=(___/
`,
    'custom'
];

function ConfigSection({ title, icon: Icon, children }) {
    return (
        <div className="space-y-4 border-t border-sky-50 pt-6 first:border-0 first:pt-0 bg-white/50 p-4 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">{Icon && <Icon size={14} />} {title}</h3>
            <div className="space-y-4 px-1">{children}</div>
        </div>
    );
}

export default function SettingsPage({ currentThemeId, onThemeChange }) {
    const [activeTab, setActiveTab] = useState('theme');
    // Actual Store State
    const {
        userName, setUserName, userAvatar, setUserAvatar,
        customOrbImage, setCustomOrbImage,
        isSpillEnabled, setIsSpillEnabled,
        orbSpill, setOrbSpill,
        orbImageScale, setOrbImageScale,
        orbImageXOffset, setOrbImageXOffset,
        orbImageYOffset, setOrbImageYOffset,
        bannerPattern, setBannerPattern,
        pageBannerBgColor, setPageBannerBgColor,
        customPageBannerImage2, setCustomPageBannerImage2,
        pageBannerImage2Scale, setPageBannerImage2Scale,
        pageBannerImage2XOffset, setPageBannerImage2XOffset,
        pageBannerImage2YOffset, setPageBannerImage2YOffset,
        playerBorderPattern, setPlayerBorderPattern,
        visualizerGradient, setVisualizerGradient,
        // Orb Favorites
        orbFavorites, addOrbFavorite, removeOrbFavorite, applyOrbFavorite, renameOrbFavorite,
        // Layer 2 Folders
        layer2Folders, addLayer2Image, removeLayer2Image, updateLayer2Image, applyLayer2Image,
        addLayer2Folder, removeLayer2Folder, renameLayer2Folder, selectedLayer2FolderId, setSelectedLayer2FolderId,
        setLayer2FolderPlaylists, setLayer2FolderCondition, themeFolderId, setThemeFolder, clearThemeFolder
    } = useConfigStore();
    const [customAvatar, setCustomAvatar] = useState('');
    const [copied, setCopied] = useState(false);

    // Mock State for new representative options
    // Mock State for new representative options
    const [mockVideoBanner, setMockVideoBanner] = useState('diagonal');
    const [mockBorder, setMockBorder] = useState('neon');
    const [mockVisualizer, setMockVisualizer] = useState('bars');
    const [mockVisColor, setMockVisColor] = useState('theme');

    // Sticky toolbar state
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Orb page modal state - default to true so Orb page shows by default
    const [showOrbPage, setShowOrbPage] = useState(true);
    // Page page modal state
    const [showPagePage, setShowPagePage] = useState(false);
    // App page modal state
    const [showAppPage, setShowAppPage] = useState(false);
    // You page modal state
    const [showYouPage, setShowYouPage] = useState(false);

    const promptText = 'maintain style as much as possible. dont change anything about original image. im looking for a "zoom out" so that I can [insert desired changes]. reference the single primary color markings which mark out how I want things expanded. remove single primary color markings from final image.';

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAvatarSelect = (avatar) => {
        if (avatar === 'custom') {
            setUserAvatar(customAvatar || 'Custom');
        } else {
            setUserAvatar(avatar.trim());
        }
    };

    const handleOrbImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomOrbImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };



    const handlePageBannerUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomPageBannerImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePageBanner2Upload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomPageBannerImage2(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLayer2FolderImageUpload = (e, folderId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                addLayer2Image(folderId, {
                    image: reader.result,
                    scale: 100,
                    xOffset: 50,
                    yOffset: 50,
                    bgColor: pageBannerBgColor // Save current Layer 1 color with the image
                });
            };
            reader.readAsDataURL(file);
        }
        // Reset input so the same file can be uploaded again
        e.target.value = '';
    };

    const toggleSpillQuadrant = (q) => {
        setOrbSpill({ ...orbSpill, [q]: !orbSpill[q] });
    };

    const isMultiLine = (text) => text.includes('\n');

    // Orb Favorites handlers
    const [editingFavoriteId, setEditingFavoriteId] = useState(null);
    const [editingFavoriteName, setEditingFavoriteName] = useState('');
    const [hoveredFavoriteId, setHoveredFavoriteId] = useState(null);

    // Layer 2 Folder handlers
    const [hoveredLayer2ImageId, setHoveredLayer2ImageId] = useState(null);
    const [editingLayer2FolderName, setEditingLayer2FolderName] = useState('');
    const [hoveredLayer2FolderId, setHoveredLayer2FolderId] = useState(null);
    const [editingLayer2FolderId, setEditingLayer2FolderId] = useState(null);
    const [expandedConditionSelector, setExpandedConditionSelector] = useState(null); // folderId
    const [expandedDestinationSelector, setExpandedDestinationSelector] = useState(null); // imageId

    // Playlist list for folder assignment
    const [allPlaylists, setAllPlaylists] = useState([]);
    const [expandedFolderPlaylistSelector, setExpandedFolderPlaylistSelector] = useState(null);

    // Fetch playlists for folder assignment dropdown
    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const playlists = await getAllPlaylists();
                setAllPlaylists(playlists || []);
            } catch (error) {
                console.error('Error fetching playlists for folder assignment:', error);
            }
        };
        fetchPlaylists();
    }, []);

    const handleSaveCurrentOrbAsFavorite = () => {
        if (!customOrbImage) return; // Don't save if no image is set
        addOrbFavorite({
            customOrbImage,
            isSpillEnabled,
            orbSpill: { ...orbSpill },
            orbImageScale,
            orbImageXOffset,
            orbImageYOffset,
        });
    };

    const handleApplyFavorite = (favorite) => {
        applyOrbFavorite(favorite);
    };

    const handleStartRename = (favorite) => {
        setEditingFavoriteId(favorite.id);
        setEditingFavoriteName(favorite.name);
    };

    const handleFinishRename = () => {
        if (editingFavoriteId && editingFavoriteName.trim()) {
            renameOrbFavorite(editingFavoriteId, editingFavoriteName.trim());
        }
        setEditingFavoriteId(null);
        setEditingFavoriteName('');
    };

    // Sticky toolbar detection
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // When sentinel is NOT visible (scrolled past top), we are stuck
                setIsStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 0);
            },
            { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
        );

        if (stickySentinelRef.current) {
            observer.observe(stickySentinelRef.current);
        }
        return () => observer.disconnect();
    }, []);

    // Mock folder counts for prism bar (will be wired up later)
    const folderCounts = {};

    // Navigation helper function
    const navigateToPage = (targetPage) => {
        setShowOrbPage(false);
        setShowPagePage(false);
        setShowAppPage(false);
        setShowYouPage(false);
        if (targetPage === 'orb') setShowOrbPage(true);
        else if (targetPage === 'page') setShowPagePage(true);
        else if (targetPage === 'app') setShowAppPage(true);
        else if (targetPage === 'you') setShowYouPage(true);
    };

    // If Orb page is active, render it instead of settings
    if (showOrbPage) {
        return <OrbPage
            onBack={() => navigateToPage('orb')}
            onNavigateToYou={() => navigateToPage('you')}
            onNavigateToPage={() => navigateToPage('page')}
            onNavigateToApp={() => navigateToPage('app')}
        />;
    }

    // If Page page is active, render it instead of settings
    if (showPagePage) {
        return <PagePage
            onBack={() => navigateToPage('orb')}
            onNavigateToOrb={() => navigateToPage('orb')}
            onNavigateToYou={() => navigateToPage('you')}
            onNavigateToApp={() => navigateToPage('app')}
        />;
    }

    // If App page is active, render it instead of settings
    if (showAppPage) {
        return <AppPage
            onBack={() => navigateToPage('orb')}
            currentThemeId={currentThemeId}
            onThemeChange={onThemeChange}
            onNavigateToOrb={() => navigateToPage('orb')}
            onNavigateToYou={() => navigateToPage('you')}
            onNavigateToPage={() => navigateToPage('page')}
        />;
    }

    // If You page is active, render it instead of settings
    if (showYouPage) {
        return <YouPage
            onBack={() => navigateToPage('orb')}
            onNavigateToOrb={() => navigateToPage('orb')}
            onNavigateToPage={() => navigateToPage('page')}
            onNavigateToApp={() => navigateToPage('app')}
        />;
    }

    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-transparent relative">
                {/* Page Banner */}
                <div className="px-4 pt-8">
                    <PageBanner
                        title="Settings"
                        description={null}
                        color={null}
                        isEditable={false}
                        childrenPosition="bottom"
                    >
                        <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-xl w-fit flex-wrap gap-1 mt-4 border border-white/10">
                            <button
                                onClick={() => setActiveTab('theme')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'theme'
                                    ? 'bg-white/20 text-white shadow-sm'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <Palette size={16} /> Appearance
                            </button>
                            <button
                                onClick={() => setActiveTab('visualizer')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'visualizer'
                                    ? 'bg-white/20 text-white shadow-sm'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <Music size={16} /> Visualizer
                            </button>
                            <button
                                onClick={() => setActiveTab('orb')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orb'
                                    ? 'bg-white/20 text-white shadow-sm'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <Smile size={16} /> Orb
                            </button>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile'
                                    ? 'bg-white/20 text-white shadow-sm'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <User size={16} /> Signature
                            </button>
                        </div>
                    </PageBanner>
                </div>

                {/* Sticky Sentinel */}
                <div ref={stickySentinelRef} className="absolute h-px w-full -mt-px pointer-events-none opacity-0" />

                {/* Sticky Toolbar */}
                <div
                    className={`sticky top-0 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden -mt-16
                    ${isStuck
                            ? 'backdrop-blur-xl border-y shadow-2xl mx-0 rounded-none mb-6 pt-2 pb-2 bg-slate-900/70'
                            : 'backdrop-blur-[2px] border-b border-x border-t border-white/10 shadow-xl mx-8 rounded-b-2xl mb-8 mt-0 pt-1 pb-0 bg-slate-900/40'
                        }
                    `}
                >
                    <div className={`px-4 flex items-center justify-between transition-all duration-300 relative z-10 ${isStuck ? 'h-[52px]' : 'py-0.5'}`}>
                        {/* Left Side: 4 Buttons + Colored Prism */}
                        <div className="flex items-center gap-0 overflow-x-auto no-scrollbar mask-gradient-right flex-1 min-w-0 pr-0">
                            {/* 4 Navigation Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 pr-3">
                                <button
                                    onClick={() => navigateToPage('orb')}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider border border-white/5 ${showOrbPage
                                        ? 'bg-sky-500 text-white shadow-sm'
                                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                        }`}
                                    title="Orb"
                                >
                                    Orb
                                </button>
                                <button
                                    onClick={() => navigateToPage('you')}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider border border-white/5 ${showYouPage
                                        ? 'bg-sky-500 text-white shadow-sm'
                                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                        }`}
                                    title="You"
                                >
                                    You
                                </button>
                                <button
                                    onClick={() => navigateToPage('page')}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider border border-white/5 ${showPagePage
                                        ? 'bg-sky-500 text-white shadow-sm'
                                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                        }`}
                                    title="Page"
                                >
                                    Page
                                </button>
                                <button
                                    onClick={() => navigateToPage('app')}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider border border-white/5 ${showAppPage
                                        ? 'bg-sky-500 text-white shadow-sm'
                                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                        }`}
                                    title="App"
                                >
                                    App
                                </button>
                            </div>

                            {/* Colored Prism Bar */}
                            <div className="flex-1 flex items-center shrink-0 h-6 mr-3 border-2 border-black rounded-lg overflow-hidden">
                                {FOLDER_COLORS.map((color, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === FOLDER_COLORS.length - 1;
                                    const count = folderCounts[color.id] || 0;

                                    return (
                                        <button
                                            key={color.id}
                                            className={`h-full flex-1 flex items-center justify-center transition-all opacity-60 hover:opacity-100 ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''}`}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                        >
                                            {count > 0 && (
                                                <span className="text-sm font-bold text-white/90 drop-shadow-md">
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 text-slate-800 space-y-6">
                    <div className="space-y-8 pb-20">
                        {activeTab === 'theme' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <ConfigSection title="Page Banner" icon={Layout}>
                                    {/* Two-column layer controls */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Layer 1 - Background Color (Default/Fallback) */}
                                        <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                            <label className="text-xs font-bold uppercase text-slate-400">Layer 1 (Default Fallback)</label>
                                            <p className="text-[9px] text-slate-400 -mt-2">Used when no paired color is set with an image</p>

                                            {/* Color Preview */}
                                            <div
                                                className="w-full h-16 rounded-lg border-2 border-slate-200"
                                                style={{ backgroundColor: pageBannerBgColor }}
                                            />

                                            {/* Color Picker */}
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={pageBannerBgColor}
                                                    onChange={(e) => setPageBannerBgColor(e.target.value)}
                                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                                                />
                                                <input
                                                    type="text"
                                                    value={pageBannerBgColor}
                                                    onChange={(e) => setPageBannerBgColor(e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 uppercase"
                                                    placeholder="#000000"
                                                />
                                            </div>

                                            {/* Quick Color Presets */}
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { color: '#1e293b', name: 'Slate' },
                                                    { color: '#0f172a', name: 'Dark' },
                                                    { color: '#18181b', name: 'Zinc' },
                                                    { color: '#1e1b4b', name: 'Indigo' },
                                                    { color: '#172554', name: 'Blue' },
                                                    { color: '#14532d', name: 'Green' },
                                                    { color: '#7f1d1d', name: 'Red' },
                                                    { color: '#78350f', name: 'Amber' },
                                                ].map(preset => (
                                                    <button
                                                        key={preset.color}
                                                        onClick={() => setPageBannerBgColor(preset.color)}
                                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${pageBannerBgColor === preset.color
                                                            ? 'border-sky-500 ring-2 ring-sky-200'
                                                            : 'border-slate-200 hover:border-slate-400'
                                                            }`}
                                                        style={{ backgroundColor: preset.color }}
                                                        title={preset.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Layer 2 - Overlay */}
                                        <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold uppercase text-slate-400">Layer 2 (Overlay)</label>
                                                {customPageBannerImage2 && (
                                                    <button
                                                        onClick={() => {
                                                            setCustomPageBannerImage2(null);
                                                            setPageBannerImage2Scale(100);
                                                            setPageBannerImage2XOffset(50);
                                                            setPageBannerImage2YOffset(50);
                                                        }}
                                                        className="text-[9px] font-bold text-red-400 hover:text-red-500 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            {customPageBannerImage2 ? (
                                                <>
                                                    {/* Thumbnail */}
                                                    <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-100 relative">
                                                        <img src={customPageBannerImage2} alt="Layer 2" className="w-full h-full object-cover" />
                                                    </div>
                                                    {/* Scale */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-bold text-slate-500">Scale</label>
                                                            <span className="text-[10px] font-mono font-bold text-purple-600">{pageBannerImage2Scale}%</span>
                                                        </div>
                                                        <input type="range" min="50" max="200" step="5" value={pageBannerImage2Scale}
                                                            onChange={(e) => setPageBannerImage2Scale(parseInt(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                                    </div>
                                                    {/* X Position */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-bold text-slate-500">X Position</label>
                                                            <span className="text-[10px] font-mono font-bold text-purple-600">{pageBannerImage2XOffset}%</span>
                                                        </div>
                                                        <input type="range" min="0" max="100" step="1" value={pageBannerImage2XOffset}
                                                            onChange={(e) => setPageBannerImage2XOffset(parseInt(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                                    </div>
                                                    {/* Y Position */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-bold text-slate-500">Y Position</label>
                                                            <span className="text-[10px] font-mono font-bold text-purple-600">{pageBannerImage2YOffset}%</span>
                                                        </div>
                                                        <input type="range" min="0" max="100" step="1" value={pageBannerImage2YOffset}
                                                            onChange={(e) => setPageBannerImage2YOffset(parseInt(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                                    </div>
                                                    {/* Paired Background Color */}
                                                    <div className="space-y-1 pt-2 border-t border-slate-100">
                                                        <label className="text-[10px] font-bold text-slate-500">Paired Background Color</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={pageBannerBgColor}
                                                                onChange={(e) => setPageBannerBgColor(e.target.value)}
                                                                className="w-8 h-8 rounded-lg cursor-pointer border-2 border-slate-200"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={pageBannerBgColor}
                                                                onChange={(e) => setPageBannerBgColor(e.target.value)}
                                                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700 uppercase"
                                                                placeholder="#000000"
                                                            />
                                                        </div>
                                                        <p className="text-[9px] text-slate-400">This color will be saved with the image config</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-400 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                                    <Image size={12} />
                                                    Upload Layer 2
                                                    <input type="file" accept="image/*" onChange={handlePageBanner2Upload} className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                                        Set the paired background color in Layer 2 settings, then save to library. Each saved image remembers its paired color.
                                    </p>

                                    {/* Layer 2 Image Folders */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Folder size={14} className="text-purple-500" />
                                                <label className="text-xs font-bold uppercase text-slate-400">Layer 2 Image Library</label>
                                            </div>
                                            <button
                                                onClick={() => addLayer2Folder()}
                                                className="flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg text-[10px] font-bold uppercase transition-all"
                                            >
                                                <Plus size={10} />
                                                New Folder
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            Organize Layer 2 images in folders. Click to apply, hover to delete. Click folder name to rename.
                                        </p>

                                        {layer2Folders.map((folder) => (
                                            <div
                                                key={folder.id}
                                                className={`space-y-3 p-4 rounded-xl border-2 transition-all ${selectedLayer2FolderId === folder.id
                                                    ? 'border-purple-400 bg-purple-50/50'
                                                    : 'border-purple-100 bg-purple-50/30'
                                                    }`}
                                                onMouseEnter={() => setHoveredLayer2FolderId(folder.id)}
                                                onMouseLeave={() => setHoveredLayer2FolderId(null)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {editingLayer2FolderId === folder.id ? (
                                                            <input
                                                                type="text"
                                                                value={editingLayer2FolderName}
                                                                onChange={(e) => setEditingLayer2FolderName(e.target.value)}
                                                                onBlur={() => {
                                                                    if (editingLayer2FolderName.trim()) {
                                                                        renameLayer2Folder(folder.id, editingLayer2FolderName.trim());
                                                                    }
                                                                    setEditingLayer2FolderId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        if (editingLayer2FolderName.trim()) {
                                                                            renameLayer2Folder(folder.id, editingLayer2FolderName.trim());
                                                                        }
                                                                        setEditingLayer2FolderId(null);
                                                                    }
                                                                }}
                                                                autoFocus
                                                                className="text-xs font-bold text-purple-600 bg-white border border-purple-400 rounded px-2 py-0.5 outline-none w-32"
                                                            />
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingLayer2FolderId(folder.id);
                                                                    setEditingLayer2FolderName(folder.name);
                                                                }}
                                                                className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                                                                title="Click to rename"
                                                            >
                                                                {folder.name}
                                                            </button>
                                                        )}
                                                        {selectedLayer2FolderId === folder.id && (
                                                            <span className="text-[8px] font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded-full uppercase">Active</span>
                                                        )}
                                                        {themeFolderId === folder.id && (
                                                            <span className="text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                                <Star size={8} className="fill-current" />
                                                                Theme
                                                            </span>
                                                        )}
                                                        {folder.condition === 'random' && (
                                                            <span className="text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                                <Shuffle size={8} />
                                                                Random
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400">{folder.images.length} images</span>
                                                        {/* Condition Selector */}
                                                        {folder.images.length > 0 && (
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => {
                                                                        setExpandedConditionSelector(
                                                                            expandedConditionSelector === folder.id ? null : folder.id
                                                                        );
                                                                    }}
                                                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${folder.condition === 'random'
                                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                                        }`}
                                                                    title={folder.condition === 'random' ? 'Random selection enabled' : 'Set selection mode'}
                                                                >
                                                                    <Shuffle size={9} className={folder.condition === 'random' ? 'fill-current' : ''} />
                                                                    {folder.condition === 'random' ? 'Random' : 'First'}
                                                                </button>
                                                                {/* Condition Dropdown */}
                                                                {expandedConditionSelector === folder.id && (
                                                                    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                                                                        <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100">
                                                                            Selection Mode
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                setLayer2FolderCondition(folder.id, null);
                                                                                setExpandedConditionSelector(null);
                                                                            }}
                                                                            className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${!folder.condition || folder.condition === null
                                                                                ? 'bg-purple-50 text-purple-700'
                                                                                : 'hover:bg-slate-50 text-slate-600'
                                                                                }`}
                                                                        >
                                                                            {(!folder.condition || folder.condition === null) && <Check size={10} />}
                                                                            <span className={(!folder.condition || folder.condition === null) ? '' : 'ml-[18px]'}>
                                                                                First (Default)
                                                                            </span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setLayer2FolderCondition(folder.id, 'random');
                                                                                setExpandedConditionSelector(null);
                                                                            }}
                                                                            className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${folder.condition === 'random'
                                                                                ? 'bg-amber-50 text-amber-700'
                                                                                : 'hover:bg-slate-50 text-slate-600'
                                                                                }`}
                                                                        >
                                                                            {folder.condition === 'random' && <Check size={10} />}
                                                                            <span className={folder.condition === 'random' ? '' : 'ml-[18px]'}>
                                                                                <Shuffle size={10} className="inline mr-1" />
                                                                                Random
                                                                            </span>
                                                                        </button>
                                                                        <div className="px-2 py-1 text-[8px] text-slate-400 border-t border-slate-100">
                                                                            Random selects different image on each page entry
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Set as Theme Button */}
                                                        {folder.images.length > 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    if (themeFolderId === folder.id) {
                                                                        clearThemeFolder();
                                                                    } else {
                                                                        setThemeFolder(folder.id);
                                                                    }
                                                                }}
                                                                className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${themeFolderId === folder.id
                                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                                    }`}
                                                                title={themeFolderId === folder.id ? 'Remove theme (applies app-wide)' : 'Set as page banner theme (applies app-wide)'}
                                                            >
                                                                <Star size={9} className={themeFolderId === folder.id ? 'fill-current' : ''} />
                                                                {themeFolderId === folder.id ? 'Theme' : 'Set Theme'}
                                                            </button>
                                                        )}
                                                        {folder.id !== 'default' && hoveredLayer2FolderId === folder.id && (
                                                            <button
                                                                onClick={() => removeLayer2Folder(folder.id)}
                                                                className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
                                                                title="Delete folder"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Playlist Assignment Selector */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setExpandedFolderPlaylistSelector(
                                                            expandedFolderPlaylistSelector === folder.id ? null : folder.id
                                                        )}
                                                        className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-medium text-slate-600 transition-all w-full justify-between"
                                                    >
                                                        <span>
                                                            {(!folder.playlistIds || folder.playlistIds.length === 0)
                                                                ? '📍 Shows on: All Playlists'
                                                                : `📍 Shows on: ${folder.playlistIds.length} playlist${folder.playlistIds.length > 1 ? 's' : ''}`
                                                            }
                                                        </span>
                                                        <ChevronDown
                                                            size={12}
                                                            className={`transition-transform ${expandedFolderPlaylistSelector === folder.id ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>

                                                    {/* Playlist Dropdown */}
                                                    {expandedFolderPlaylistSelector === folder.id && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                                            {/* All Playlists Option */}
                                                            <button
                                                                onClick={() => {
                                                                    setLayer2FolderPlaylists(folder.id, []);
                                                                }}
                                                                className={`w-full px-3 py-2 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${(!folder.playlistIds || folder.playlistIds.length === 0)
                                                                    ? 'bg-purple-100 text-purple-700'
                                                                    : 'hover:bg-slate-50 text-slate-600'
                                                                    }`}
                                                            >
                                                                {(!folder.playlistIds || folder.playlistIds.length === 0) && <Check size={10} />}
                                                                <span className={(!folder.playlistIds || folder.playlistIds.length === 0) ? '' : 'ml-[18px]'}>
                                                                    All Playlists (Default)
                                                                </span>
                                                            </button>

                                                            <div className="border-t border-slate-100 my-1" />
                                                            <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400">
                                                                Select specific playlists:
                                                            </div>

                                                            {allPlaylists.map((playlist) => {
                                                                const isSelected = folder.playlistIds?.includes(playlist.id);
                                                                return (
                                                                    <button
                                                                        key={playlist.id}
                                                                        onClick={() => {
                                                                            const currentIds = folder.playlistIds || [];
                                                                            const newIds = isSelected
                                                                                ? currentIds.filter(id => id !== playlist.id)
                                                                                : [...currentIds, playlist.id];
                                                                            setLayer2FolderPlaylists(folder.id, newIds);
                                                                        }}
                                                                        className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${isSelected
                                                                            ? 'bg-purple-50 text-purple-700'
                                                                            : 'hover:bg-slate-50 text-slate-600'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-300'
                                                                            }`}>
                                                                            {isSelected && <Check size={8} className="text-white" />}
                                                                        </div>
                                                                        <span className="truncate">{playlist.name}</span>
                                                                    </button>
                                                                );
                                                            })}

                                                            {allPlaylists.length === 0 && (
                                                                <div className="px-3 py-2 text-[10px] text-slate-400 italic">
                                                                    No playlists found
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Images Grid */}
                                                {folder.images.length > 0 ? (
                                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                                        {folder.images.map((img) => (
                                                            <div
                                                                key={img.id}
                                                                className="relative group"
                                                                onMouseEnter={() => setHoveredLayer2ImageId(img.id)}
                                                                onMouseLeave={() => setHoveredLayer2ImageId(null)}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        applyLayer2Image(img);
                                                                        // Also load the image's paired bgColor
                                                                        if (img.bgColor) {
                                                                            setPageBannerBgColor(img.bgColor);
                                                                        }
                                                                        setSelectedLayer2FolderId(folder.id);
                                                                    }}
                                                                    className={`w-full aspect-video rounded-lg border-2 overflow-hidden transition-all duration-200 ${customPageBannerImage2 === img.image
                                                                        ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg'
                                                                        : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                                                                        }`}
                                                                    title={`Paired color: ${img.bgColor || 'none'}`}
                                                                >
                                                                    <img
                                                                        src={img.image}
                                                                        alt="Layer 2"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {/* Paired color indicator */}
                                                                    <div
                                                                        className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-md"
                                                                        style={{ backgroundColor: img.bgColor || '#94a3b8' }}
                                                                        title={`Paired: ${img.bgColor || 'none'}`}
                                                                    />
                                                                    {/* Destination Badge */}
                                                                    {img.destinations && (img.destinations.pages?.length > 0 || img.destinations.folderColors?.length > 0) && (
                                                                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-md" title="Has destination assignments">
                                                                            <MapPin size={10} />
                                                                        </div>
                                                                    )}
                                                                    {/* Active Indicator */}
                                                                    {customPageBannerImage2 === img.image && (
                                                                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                                            <Check className="text-white drop-shadow-md" size={16} />
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                {/* Destination Assignment Button */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedDestinationSelector(
                                                                            expandedDestinationSelector === img.id ? null : img.id
                                                                        );
                                                                    }}
                                                                    className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all z-10 ${img.destinations && (img.destinations.pages?.length > 0 || img.destinations.folderColors?.length > 0)
                                                                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                        : 'bg-slate-700/80 hover:bg-slate-600 text-white'
                                                                        }`}
                                                                    title="Assign destinations (pages/folders)"
                                                                >
                                                                    <MapPin size={10} />
                                                                </button>

                                                                {/* Destination Assignment Dropdown */}
                                                                {expandedDestinationSelector === img.id && (
                                                                    <div className="absolute top-6 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[280px] max-w-[320px] max-h-[400px] overflow-y-auto">
                                                                        <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100 sticky top-0 bg-white">
                                                                            Assign Destinations
                                                                        </div>

                                                                        {/* Pages Section */}
                                                                        <div className="px-2 py-1">
                                                                            <div className="text-[9px] font-bold uppercase text-slate-500 mb-1">Pages</div>
                                                                            <div className="text-[8px] text-slate-400 mb-2">Select pages where this image appears</div>
                                                                            {['videos', 'playlists', 'likes', 'history', 'pins'].map((page) => {
                                                                                const isSelected = img.destinations?.pages?.includes(page);
                                                                                return (
                                                                                    <button
                                                                                        key={page}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const currentPages = img.destinations?.pages || [];
                                                                                            const newPages = isSelected
                                                                                                ? currentPages.filter(p => p !== page)
                                                                                                : [...currentPages, page];
                                                                                            const newDestinations = {
                                                                                                ...(img.destinations || {}),
                                                                                                pages: newPages.length > 0 ? newPages : undefined
                                                                                            };
                                                                                            updateLayer2Image(folder.id, img.id, {
                                                                                                destinations: newPages.length > 0 || newDestinations.folderColors?.length > 0 ? newDestinations : null
                                                                                            });
                                                                                        }}
                                                                                        className={`w-full px-2 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 rounded ${isSelected
                                                                                            ? 'bg-blue-50 text-blue-700'
                                                                                            : 'hover:bg-slate-50 text-slate-600'
                                                                                            }`}
                                                                                    >
                                                                                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                                                                                            }`}>
                                                                                            {isSelected && <Check size={8} className="text-white" />}
                                                                                        </div>
                                                                                        <span className="capitalize">{page}</span>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>

                                                                        <div className="border-t border-slate-100 my-1" />

                                                                        {/* Folder Colors Section */}
                                                                        <div className="px-2 py-1">
                                                                            <div className="text-[9px] font-bold uppercase text-slate-500 mb-1">Colored Folders</div>
                                                                            <div className="text-[8px] text-slate-400 mb-2">Select folder colors where this image appears</div>
                                                                            <div className="grid grid-cols-4 gap-1">
                                                                                {FOLDER_COLORS.map((color) => {
                                                                                    const isSelected = img.destinations?.folderColors?.includes(color.id);
                                                                                    return (
                                                                                        <button
                                                                                            key={color.id}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                const currentColors = img.destinations?.folderColors || [];
                                                                                                const newColors = isSelected
                                                                                                    ? currentColors.filter(c => c !== color.id)
                                                                                                    : [...currentColors, color.id];
                                                                                                const newDestinations = {
                                                                                                    ...(img.destinations || {}),
                                                                                                    folderColors: newColors.length > 0 ? newColors : undefined
                                                                                                };
                                                                                                updateLayer2Image(folder.id, img.id, {
                                                                                                    destinations: newColors.length > 0 || newDestinations.pages?.length > 0 ? newDestinations : null
                                                                                                });
                                                                                            }}
                                                                                            className={`w-full aspect-square rounded border-2 transition-all ${isSelected
                                                                                                ? 'border-white ring-2 ring-blue-500 ring-offset-1'
                                                                                                : 'border-slate-300 hover:border-slate-400'
                                                                                                }`}
                                                                                            style={{ backgroundColor: color.hex }}
                                                                                            title={color.name}
                                                                                        >
                                                                                            {isSelected && (
                                                                                                <div className="w-full h-full flex items-center justify-center">
                                                                                                    <Check size={10} className="text-white drop-shadow-md" />
                                                                                                </div>
                                                                                            )}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                        {/* Clear All Button */}
                                                                        <div className="border-t border-slate-100 px-2 py-2">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    updateLayer2Image(folder.id, img.id, { destinations: null });
                                                                                    setExpandedDestinationSelector(null);
                                                                                }}
                                                                                className="w-full px-2 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded transition-all"
                                                                            >
                                                                                Clear All Destinations
                                                                            </button>
                                                                            <div className="text-[8px] text-slate-400 mt-1">
                                                                                No destinations = appears everywhere
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Delete Button */}
                                                                {hoveredLayer2ImageId === img.id && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeLayer2Image(folder.id, img.id);
                                                                        }}
                                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-4 text-center border-2 border-dashed border-purple-200 rounded-lg bg-white/50">
                                                        <p className="text-[10px] text-slate-400">No images saved yet</p>
                                                    </div>
                                                )}

                                                {/* Add Image Button */}
                                                <label className="w-full py-2 bg-white border-2 border-dashed border-purple-200 rounded-lg text-[10px] font-bold uppercase text-purple-400 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                                    <Plus size={12} />
                                                    Add Image to Folder
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleLayer2FolderImageUpload(e, folder.id)}
                                                        className="hidden"
                                                    />
                                                </label>

                                                {/* Save Button */}
                                                {customPageBannerImage2 && (
                                                    <button
                                                        onClick={() => addLayer2Image(folder.id, {
                                                            image: customPageBannerImage2,
                                                            scale: pageBannerImage2Scale,
                                                            xOffset: pageBannerImage2XOffset,
                                                            yOffset: pageBannerImage2YOffset,
                                                            bgColor: pageBannerBgColor
                                                        })}
                                                        className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={12} />
                                                        Save to This Folder
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ConfigSection>

                                <ConfigSection title="Color Palette" icon={Palette}>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(THEMES).map(([id, theme]) => (
                                            <button
                                                key={id}
                                                onClick={() => onThemeChange && onThemeChange(id)}
                                                className={`p-3 rounded-xl text-xs font-bold uppercase transition-all border-2 text-left flex flex-col gap-2 ${currentThemeId === id
                                                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md ring-2 ring-sky-200'
                                                    : 'border-slate-100 bg-white text-slate-400 hover:border-sky-200 hover:text-sky-600 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${theme.bg.replace('from-', 'from-').replace('via-', 'via-').replace('to-', 'to-')} shadow-inner`}></div>
                                                <span className="px-1">{theme.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </ConfigSection>

                                <ConfigSection title="App Banner" icon={Image}>
                                    {/* Current Banner Display */}
                                    <div className="space-y-3 pb-4 border-b border-slate-100">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-xs font-bold uppercase text-slate-400">Current App Banner</label>
                                            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                                        </div>
                                        <div className="w-full h-32 rounded-xl overflow-hidden shadow-sm border-2 border-slate-100 relative group bg-slate-50">
                                            <img
                                                src={customBannerImage || "/banner.PNG"}
                                                alt="Current Banner"
                                                className="w-full h-full object-cover"
                                            />
                                            {!customBannerImage && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                                            )}
                                            <div className="absolute bottom-3 left-3 text-white text-xs font-bold drop-shadow-md">
                                                {customBannerImage ? "Custom Upload" : "/public/banner.PNG"}
                                            </div>
                                            {customBannerImage && (
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setCustomBannerImage(null);
                                                            setMockAppBanner('default');
                                                        }}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg"
                                                    >
                                                        Remove Custom Banner
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Presets */}
                                    <div className="space-y-3 pt-2">
                                        <label className="text-xs font-bold uppercase text-slate-400 ml-1">Presets</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {['Default', 'Cosmic', 'Nature', 'Industrial'].map((name) => {
                                                const id = name.toLowerCase();
                                                return (
                                                    <button
                                                        key={id}
                                                        onClick={() => {
                                                            setMockAppBanner(id);
                                                            if (id === 'default') {
                                                                setCustomBannerImage(null);
                                                            }
                                                            // Future: Set other presets if we have assets
                                                        }}
                                                        className={`p-2 rounded-xl text-xs font-bold uppercase transition-all border-2 flex flex-col gap-2 items-center ${mockAppBanner === id
                                                            ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                                                            : 'border-slate-100 bg-white text-slate-400 hover:border-sky-200 hover:text-sky-600'
                                                            }`}
                                                    >
                                                        <div className="w-full h-16 bg-slate-100 rounded-lg overflow-hidden relative">
                                                            {/* Representational placeholder visuals */}
                                                            {id === 'default' && <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-600 opacity-50" />}
                                                            {id === 'cosmic' && <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 via-indigo-900 to-black opacity-80" />}
                                                            {id === 'nature' && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-800 opacity-60" />}
                                                            {id === 'industrial' && <div className="absolute inset-0 bg-gradient-to-bl from-slate-600 to-zinc-900 opacity-70" />}
                                                            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50">IMG</span>
                                                        </div>
                                                        <span>{name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Upload Action */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <label className="w-full py-3 bg-white border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold uppercase text-slate-500 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-600 hover:shadow-sm transition-all flex items-center justify-center gap-2 group cursor-pointer relative overflow-hidden">
                                            <div className="p-1 bg-slate-100 rounded-md group-hover:bg-white transition-colors">
                                                <Image size={14} />
                                            </div>
                                            Upload Custom Banner
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBannerUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-[10px] text-slate-400 text-center mt-2">
                                            Supports PNG, JPG, WEBP. Recommended size: 1920x200px.
                                        </p>
                                    </div>
                                </ConfigSection>

                                <ConfigSection title="Player Borders" icon={Box}>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Diagonal', 'Dots', 'Mesh', 'Solid'].map((name) => {
                                            const id = name === 'Mesh' ? 'waves' : name.toLowerCase();
                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => setPlayerBorderPattern(id)}
                                                    className={`p-3 rounded-xl text-xs font-bold uppercase transition-all border-2 text-left flex items-center justify-between ${playerBorderPattern === id
                                                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                                                        : 'border-slate-100 bg-white text-slate-400 hover:border-sky-200 hover:text-sky-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[#052F4A] relative overflow-hidden shadow-sm border border-slate-200">
                                                            <div className={`absolute inset-0 pattern-${id}`}></div>
                                                        </div>
                                                        <span>{name}</span>
                                                    </div>
                                                    {playerBorderPattern === id && <Check size={14} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </ConfigSection>
                            </div>

                        ) : activeTab === 'visualizer' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <ConfigSection title="Visualizer Style" icon={Volume2}>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Frequency Bars', 'Digital Wave', 'Particle Storm', 'Retro Lines'].map((name) => {
                                            const id = name.toLowerCase().split(' ')[0];
                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => setMockVisualizer(id)}
                                                    className={`p-4 rounded-xl text-xs font-bold uppercase transition-all border-2 flex flex-col gap-3 relative overflow-hidden group ${mockVisualizer === id
                                                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                                                        : 'border-slate-100 bg-white text-slate-400 hover:border-sky-200 hover:text-sky-600'
                                                        }`}
                                                >
                                                    <div className="w-full h-24 bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center">
                                                        {/* Visualizer Mocks */}
                                                        {id === 'frequency' && (
                                                            <div className="flex items-end gap-1 h-12">
                                                                {[...Array(10)].map((_, i) => (
                                                                    <div key={i} className="w-2 bg-sky-400 rounded-t-sm animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {id === 'digital' && (
                                                            <svg viewBox="0 0 100 40" className="w-full h-full stroke-sky-400 fill-none stroke-2 opacity-80">
                                                                <path d="M0 20 Q 25 5, 50 20 T 100 20" />
                                                            </svg>
                                                        )}
                                                        {id === 'particle' && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-ping"></div>
                                                            </div>
                                                        )}
                                                        {id === 'retro' && (
                                                            <div className="w-full h-full border-b-2 border-sky-400 flex items-end justify-between px-4 pb-2">
                                                                <div className="text-[10px] font-mono text-sky-400">L</div>
                                                                <div className="text-[10px] font-mono text-sky-400">R</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{name}</span>
                                                        {mockVisualizer === id && <Check size={14} className="text-sky-500" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </ConfigSection>

                                <ConfigSection title="Visualizer Effects" icon={Volume2}>
                                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-white">
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold text-slate-700 block">Distance-Based Transparency</span>
                                            <p className="text-xs text-slate-400">
                                                Bars fade out as they extend outward from the orb.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setVisualizerGradient(!visualizerGradient)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${visualizerGradient ? 'bg-sky-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${visualizerGradient ? 'left-7 shadow-sm' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </ConfigSection>

                                <ConfigSection title="Color Mode" icon={Palette}>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Theme Match', 'Rainbow', 'Custom'].map((name) => {
                                            const id = name.toLowerCase().split(' ')[0];
                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => setMockVisColor(id)}
                                                    className={`p-3 rounded-xl text-xs font-bold uppercase transition-all border-2 ${mockVisColor === id
                                                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                                                        : 'border-slate-100 bg-white text-slate-400 hover:border-sky-200'
                                                        }`}
                                                >
                                                    {name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </ConfigSection>

                                <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 text-sky-800 text-xs font-medium leading-relaxed">
                                    <h4 className="font-bold flex items-center gap-2 mb-1"><Box size={14} /> Border Integration</h4>
                                    The selected visualizer will automatically integrate with the "Border Style" chosen in the Appearance tab, overflowing onto the video player when "Spill" is enabled in Orb settings.
                                </div>
                            </div>

                        ) : activeTab === 'orb' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Orb Favorites Section */}
                                <ConfigSection title="Saved Orb Presets" icon={Star}>
                                    <div className="space-y-4">
                                        {/* Favorites Grid */}
                                        {orbFavorites.length > 0 ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                {orbFavorites.map((favorite) => (
                                                    <div
                                                        key={favorite.id}
                                                        className="relative group"
                                                        onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                                        onMouseLeave={() => setHoveredFavoriteId(null)}
                                                    >
                                                        {/* Favorite Thumbnail */}
                                                        <button
                                                            onClick={() => handleApplyFavorite(favorite)}
                                                            className={`w-full aspect-square rounded-full border-4 overflow-hidden transition-all duration-200 relative ${favorite.customOrbImage === customOrbImage
                                                                ? 'border-sky-500 ring-4 ring-sky-200 shadow-lg scale-105'
                                                                : 'border-slate-200 hover:border-sky-300 hover:shadow-md'
                                                                }`}
                                                        >
                                                            <img
                                                                src={favorite.customOrbImage}
                                                                alt={favorite.name}
                                                                className="w-full h-full object-cover"
                                                                style={{
                                                                    transform: favorite.isSpillEnabled ? `scale(${favorite.orbImageScale})` : 'none'
                                                                }}
                                                            />
                                                            {/* Active Indicator */}
                                                            {favorite.customOrbImage === customOrbImage && (
                                                                <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
                                                                    <Check className="text-white drop-shadow-md" size={20} />
                                                                </div>
                                                            )}
                                                        </button>

                                                        {/* Delete Button (on hover) */}
                                                        {hoveredFavoriteId === favorite.id && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeOrbFavorite(favorite.id);
                                                                }}
                                                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}

                                                        {/* Name Label */}
                                                        {editingFavoriteId === favorite.id ? (
                                                            <input
                                                                type="text"
                                                                value={editingFavoriteName}
                                                                onChange={(e) => setEditingFavoriteName(e.target.value)}
                                                                onBlur={handleFinishRename}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                                                                autoFocus
                                                                className="mt-2 w-full text-[10px] text-center font-bold bg-white border border-sky-400 rounded px-1 py-0.5 outline-none"
                                                            />
                                                        ) : (
                                                            <p
                                                                onClick={() => handleStartRename(favorite)}
                                                                className="mt-2 text-[10px] text-slate-500 text-center font-bold truncate cursor-pointer hover:text-sky-600 transition-colors"
                                                                title="Click to rename"
                                                            >
                                                                {favorite.name}
                                                            </p>
                                                        )}

                                                        {/* Spill Indicator */}
                                                        {favorite.isSpillEnabled && (
                                                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                Spill
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                                <Heart className="mx-auto text-slate-300 mb-2" size={28} />
                                                <p className="text-xs text-slate-400 font-medium">No saved presets yet</p>
                                                <p className="text-[10px] text-slate-400 mt-1">Configure your orb below, then save it</p>
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-800 text-[11px] font-medium leading-relaxed">
                                            <p><strong>Tip:</strong> Saved presets include the image, spill settings, scale, and quadrant configuration. Click a preset to instantly apply it.</p>
                                        </div>
                                    </div>
                                </ConfigSection>

                                <ConfigSection title="Orb Configuration" icon={Smile}>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Custom Orb Image</label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 h-24 rounded-full border-4 border-slate-100 overflow-hidden flex items-center justify-center bg-slate-50 relative group">
                                                    {customOrbImage ? (
                                                        <img src={customOrbImage} alt="Orb" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-slate-300 text-xs text-center p-2">No Image</div>
                                                    )}
                                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                                                        <span className="text-xs font-bold">Change</span>
                                                        <input type="file" onChange={handleOrbImageUpload} accept="image/*" className="hidden" />
                                                    </label>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        Upload a custom image for the central orb. You can enable "Spill" to let the image break out of the circle in specific corners.
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => setIsSpillEnabled(!isSpillEnabled)}
                                                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border-2 ${isSpillEnabled
                                                                ? 'bg-sky-500 border-sky-500 text-white shadow-md'
                                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                        >
                                                            {isSpillEnabled ? 'Spill Enabled' : 'Spill Disabled'}
                                                        </button>
                                                        {customOrbImage && (
                                                            <button
                                                                onClick={() => setCustomOrbImage(null)}
                                                                className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-50 transition-colors"
                                                            >
                                                                Remove Image
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Image Scale Slider */}
                                        {customOrbImage && isSpillEnabled && (
                                            <div className="space-y-2 border-t border-slate-100 pt-4">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Image Scale</label>
                                                    <span className="text-xs font-mono font-bold text-sky-600">{orbImageScale.toFixed(2)}x</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-slate-300">0.5x</span>
                                                    <input
                                                        type="range"
                                                        min="0.5"
                                                        max="3.0"
                                                        step="0.05"
                                                        value={orbImageScale}
                                                        onChange={(e) => setOrbImageScale(parseFloat(e.target.value))}
                                                        className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-300">3.0x</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Image Position Offset Sliders */}
                                        {customOrbImage && isSpillEnabled && (
                                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Image Position</label>

                                                {/* X Offset */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[11px] font-bold text-slate-500">Horizontal (X)</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono font-bold text-sky-600">{orbImageXOffset}px</span>
                                                            {orbImageXOffset !== 0 && (
                                                                <button
                                                                    onClick={() => setOrbImageXOffset(0)}
                                                                    className="text-[9px] font-bold text-slate-400 hover:text-sky-500 transition-colors"
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-300">-100</span>
                                                        <input
                                                            type="range"
                                                            min="-100"
                                                            max="100"
                                                            step="1"
                                                            value={orbImageXOffset}
                                                            onChange={(e) => setOrbImageXOffset(parseInt(e.target.value))}
                                                            className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-300">+100</span>
                                                    </div>
                                                </div>

                                                {/* Y Offset */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[11px] font-bold text-slate-500">Vertical (Y)</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono font-bold text-sky-600">{orbImageYOffset}px</span>
                                                            {orbImageYOffset !== 0 && (
                                                                <button
                                                                    onClick={() => setOrbImageYOffset(0)}
                                                                    className="text-[9px] font-bold text-slate-400 hover:text-sky-500 transition-colors"
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-300">-100</span>
                                                        <input
                                                            type="range"
                                                            min="-100"
                                                            max="100"
                                                            step="1"
                                                            value={orbImageYOffset}
                                                            onChange={(e) => setOrbImageYOffset(parseInt(e.target.value))}
                                                            className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-300">+100</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {customOrbImage && isSpillEnabled && (
                                            <div className="space-y-2 border-t border-slate-100 pt-4">
                                                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Spill Areas</label>
                                                <div className="flex gap-8">
                                                    {/* Interactive Visualizer */}
                                                    <div className="relative w-48 h-48 border-2 border-slate-100 rounded-xl overflow-hidden bg-slate-50 mx-auto select-none">
                                                        {/* The Image Background */}
                                                        <img
                                                            src={customOrbImage}
                                                            className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale transition-transform duration-300 origin-center"
                                                            style={{ transform: `scale(${orbImageScale}) translate(${orbImageXOffset * 0.5}px, ${orbImageYOffset * 0.5}px)` }}
                                                            alt=""
                                                        />

                                                        {/* The Circle Mask (Inverse) */}
                                                        <div className="absolute inset-0 pointer-events-none z-10">
                                                            <svg width="100%" height="100%" viewBox="0 0 100 100">
                                                                <defs>
                                                                    <mask id="circleMask">
                                                                        <rect width="100" height="100" fill="white" />
                                                                        <circle cx="50" cy="50" r="35" fill="black" />
                                                                    </mask>
                                                                </defs>
                                                                <rect width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#circleMask)" />
                                                            </svg>
                                                        </div>

                                                        {/* Quadrant Toggles */}
                                                        <div className="absolute inset-0 z-20 grid grid-cols-2 grid-rows-2">
                                                            {['tl', 'tr', 'bl', 'br'].map((q) => (
                                                                <button
                                                                    key={q}
                                                                    onClick={() => toggleSpillQuadrant(q)}
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
                                                                        <div className="p-1 bg-sky-500 rounded-full text-white shadow-sm">
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Center Label */}
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                                            <div className="bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                                ORB
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 text-xs text-slate-500 space-y-2 py-2">
                                                        <p>Click the quadrants to toggle spill for that area.</p>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            <li><span className="font-bold text-sky-600">Selected:</span> Image overflows the circle in this corner.</li>
                                                            <li><span className="font-bold text-slate-400">Unselected:</span> Image is clipped to the circle in this corner.</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Save Current Configuration Button */}
                                        <div className="border-t border-slate-100 pt-4 mt-4">
                                            <button
                                                onClick={handleSaveCurrentOrbAsFavorite}
                                                disabled={!customOrbImage}
                                                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${customOrbImage
                                                    ? 'bg-sky-500 border-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 shadow-md hover:shadow-lg'
                                                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Plus size={16} />
                                                Save Current Configuration as Preset
                                            </button>
                                            {!customOrbImage && (
                                                <p className="text-[10px] text-slate-400 text-center mt-2">
                                                    Upload an orb image first to save it as a preset
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </ConfigSection>

                                {/* Background Removal Banner */}
                                <button
                                    onClick={() => openUrl('https://www.remove.bg/upload')}
                                    className="w-full p-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg shadow-teal-200 group hover:shadow-xl hover:shadow-teal-300 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                    <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="text-left space-y-1">
                                            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                                Make it Pop
                                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] uppercase tracking-wider font-bold">Free Tool</span>
                                            </h3>
                                            <p className="text-emerald-50 text-xs font-medium max-w-sm leading-relaxed">
                                                Use <span className="font-bold text-white underline decoration-white/50 underline-offset-2">remove.bg</span> to clear image backgrounds. This creates a stunning 3D pop-out effect when using spilled corners on your Orb!
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors backdrop-blur-sm">
                                            <ExternalLink className="text-white" size={20} />
                                        </div>
                                    </div>
                                </button>

                                {/* Pro Tip Section */}
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <span className="bg-amber-400 text-white px-2 py-0.5 rounded text-[10px]">PRO TIP</span>
                                            Handling Cropped Images
                                        </h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex gap-6 items-start">
                                            <img
                                                src="/tip.png"
                                                alt="Tip: Extending cropped images"
                                                className="w-32 h-32 object-contain rounded-lg border border-slate-100 bg-slate-50 shadow-sm"
                                            />
                                            <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
                                                <p className="font-bold text-slate-700">Image cut off? No problem.</p>
                                                <p>
                                                    Sometimes an image is too zoomed in or cropped awkwardly for the orb. You can use Generative Fill tools (like in Photoshop or online AI editors) to "zoom out" and extend the artwork.
                                                </p>
                                                <p>
                                                    Mark the area you want to expand with a primary color (like red) and use the prompt below to generate the missing parts while keeping the original style.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-xl p-4 relative group">
                                            <div className="absolute top-3 right-3">
                                                <button
                                                    onClick={handleCopyPrompt}
                                                    className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                                                ${copied
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                                                        }
                                            `}
                                                >
                                                    {copied ? (
                                                        <>
                                                            <Check size={12} /> Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={12} /> Copy Prompt
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="text-xs font-mono text-emerald-400 mb-2 select-none opacity-50">GEN FILL PROMPT</div>
                                            <p className="font-mono text-xs text-slate-300 pr-24 leading-relaxed selection:bg-emerald-500/30 selection:text-emerald-200">
                                                {promptText}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <ConfigSection title="Pseudonym" icon={User}>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all placeholder:text-slate-300"
                                            placeholder="Enter your name..."
                                        />
                                    </div>
                                </ConfigSection>

                                <ConfigSection title="Signature" icon={Smile}>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {AVATARS.map((avatar, index) => {
                                            const isCustom = avatar === 'custom';
                                            const isSelected = isCustom ? !AVATARS.slice(0, -1).includes(userAvatar) : userAvatar === avatar.trim();
                                            const multiline = isMultiLine(avatar);

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => handleAvatarSelect(avatar)}
                                                    className={`p-4 rounded-xl text-sm font-medium transition-all border-2 flex items-center justify-center min-h-[64px] ${isSelected
                                                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md ring-2 ring-sky-200'
                                                        : 'border-slate-100 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-600 hover:shadow-sm'
                                                        }`}
                                                >
                                                    {isCustom ? (
                                                        <span className="italic opacity-50">Custom...</span>
                                                    ) : (
                                                        <span className={`font-mono text-xs ${multiline ? 'text-[4px] leading-none whitespace-pre text-left' : 'text-lg'}`}>{avatar.trim()}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Custom Avatar Input - Shown if Custom is selected or user types in it */}
                                    <div className={`mt-4 space-y-2 transition-all duration-300 ${!AVATARS.slice(0, -1).map(a => a.trim()).includes(userAvatar) ? 'opacity-100 translate-y-0' : 'opacity-50 grayscale'}`}>
                                        <label className="text-xs font-bold uppercase text-slate-400 ml-1">Custom ASCII Avatar (Multi-line supported)</label>
                                        <textarea
                                            value={AVATARS.slice(0, -1).map(a => a.trim()).includes(userAvatar) ? customAvatar : userAvatar}
                                            onChange={(e) => {
                                                setCustomAvatar(e.target.value);
                                                setUserAvatar(e.target.value);
                                            }}
                                            className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-mono text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all min-h-[120px] text-xs leading-tight whitespace-pre"
                                            placeholder="Paste your ASCII art here..."
                                        />
                                    </div>
                                </ConfigSection>

                                {/* Preview */}
                                <div className="mt-8 p-6 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl shadow-lg text-white">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-sky-100 mb-4 opacity-70 text-center">Banner Preview</h3>
                                    <div className="flex items-center gap-6 justify-center">
                                        {/* Auto-detect Layout wrapped in flexible container */}
                                        {isMultiLine(userAvatar) ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="text-2xl font-black tracking-tight drop-shadow-md opacity-90">
                                                    <span>{userName}</span>
                                                </div>
                                                <pre className="font-mono text-[4px] leading-none whitespace-pre text-white/90 drop-shadow-md">
                                                    {userAvatar}
                                                </pre>
                                            </div>
                                        ) : (
                                            <div className="text-3xl font-black tracking-tight drop-shadow-md">
                                                <span className="mr-2 opacity-90">{userAvatar}</span>
                                                <span>{userName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* External Link Banner */}
                                <button
                                    onClick={() => openUrl('https://emojicombos.com/')}
                                    className="w-full p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-200 group hover:shadow-xl hover:shadow-purple-300 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="text-left space-y-1">
                                            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                                Need more ASCII art?
                                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] uppercase tracking-wider font-bold">Recommended</span>
                                            </h3>
                                            <p className="text-indigo-50 text-xs font-medium max-w-sm leading-relaxed">
                                                Visit <span className="font-bold text-white underline decoration-white/50 underline-offset-2">EmojiCombos.com</span> to find the perfect text art collection or draw your own masterpiece.
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors backdrop-blur-sm">
                                            <ExternalLink className="text-white" size={20} />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
