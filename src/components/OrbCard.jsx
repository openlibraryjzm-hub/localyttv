import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Check, Trash2, Image as ImageIcon, Palette } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

const OrbCard = ({ orb, allPlaylists, onUpdatePlaylists, minimal = false, onClick, currentPlaylistId }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number }
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const colorMenuRef = useRef(null);
    const colorButtonRef = useRef(null);
    const contextMenuRef = useRef(null);

    const { visualizerColor, fullscreenBanner, splitscreenBanner, updateOrbFavorite } = useConfigStore();

    // Close right-click menu when clicking outside or scrolling
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenu && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setContextMenu(null);
            }
        };
        const handleScroll = () => {
            setContextMenu(null);
        };
        if (contextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('contextmenu', handleClickOutside);
            document.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('contextmenu', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [contextMenu]);

    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY
        });
    };

    const handleAssignColor = (e) => {
        e.stopPropagation();
        updateOrbFavorite(orb.id, { visualizerColor });
        setContextMenu(null);
    };

    const handleClearColor = (e) => {
        e.stopPropagation();
        updateOrbFavorite(orb.id, { visualizerColor: null });
        setContextMenu(null);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (colorMenuRef.current && !colorMenuRef.current.contains(event.target) &&
                colorButtonRef.current && !colorButtonRef.current.contains(event.target)) {
                setIsColorMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAssignColorFromButton = (e) => {
        e.stopPropagation();
        updateOrbFavorite(orb.id, { visualizerColor });
        setIsColorMenuOpen(false);
    };

    const handleClearColorFromButton = (e) => {
        e.stopPropagation();
        updateOrbFavorite(orb.id, { visualizerColor: null });
        setIsColorMenuOpen(false);
    };

    const handleAssignBannerFromButton = (e) => {
        e.stopPropagation();
        updateOrbFavorite(orb.id, {
            fullscreenBanner,
            splitscreenBanner
        });
        setIsColorMenuOpen(false);
    };

    const handleClearBannerFromButton = (e) => {
        e.stopPropagation();
        updateOrbFavorite(orb.id, {
            fullscreenBanner: null,
            splitscreenBanner: null
        });
        setIsColorMenuOpen(false);
    };

    const togglePlaylist = (playlistId) => {
        const currentIds = orb.playlistIds || [];
        const newIds = currentIds.includes(playlistId)
            ? currentIds.filter(id => id !== playlistId)
            : [...currentIds, playlistId];
        onUpdatePlaylists(orb.id, newIds);
    };

    const handleRemoveFromCurrentPlaylist = (e) => {
        e.stopPropagation();
        if (!currentPlaylistId || !onUpdatePlaylists) return;

        if (window.confirm(`Remove "${orb.name}" from this playlist?`)) {
            const currentIds = orb.playlistIds || [];
            // Filter out current playlist ID (handle string/number mismatch)
            const newIds = currentIds.filter(id => String(id) !== String(currentPlaylistId));
            onUpdatePlaylists(orb.id, newIds);
        }
    };

    const uniqueId = `orb-card-${orb.id}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate active playlist names for display
    const activePlaylistNames = useMemo(() => {
        if (!orb.playlistIds || orb.playlistIds.length === 0) return "No Playlists";
        return allPlaylists
            .filter(p => orb.playlistIds.includes(p.id))
            .map(p => p.name)
            .join(", ");
    }, [orb.playlistIds, allPlaylists]);


    // --- Standard Card Render ---
    const visualizerBars = 113;

    // Calculate SVG path once for all bars to reduce DOM node count by 113x
    const visualizerPath = useMemo(() => {
        let d = "";
        for (let i = 0; i < visualizerBars; i++) {
            const angle = (i / visualizerBars) * Math.PI * 2;
            // Center is (100, 100). Inner point relative radius 80, outer 86.
            // Rotated starting from top (-90 degrees inherently if mapped this way)
            const x1 = 100 + 80 * Math.sin(angle);
            const y1 = 100 - 80 * Math.cos(angle);
            const x2 = 100 + 86 * Math.sin(angle);
            const y2 = 100 - 86 * Math.cos(angle);
            d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
        }
        return d;
    }, []);

    return (
        <div 
            className="w-full h-full flex items-center justify-center p-4"
            onContextMenu={handleContextMenu}
        >
            <div
                className={`group relative aspect-square w-[75%] max-w-[200px] mx-auto rounded-full overflow-visible transition-all flex items-center justify-center cursor-pointer`}
                onClick={onClick}
                onContextMenu={handleContextMenu}
            >
                {/* Dormant Visualizer Border */}
                <svg viewBox="0 0 200 200" className="absolute inset-[-15%] w-[130%] h-[130%] pointer-events-none transform -rotate-[90deg] z-0">
                    <path
                        d={visualizerPath}
                        stroke={orb.visualizerColor || "currentColor"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        className={orb.visualizerColor ? "opacity-90 group-hover:opacity-100 transition-all duration-300 drop-shadow-sm" : "text-black dark:text-white/80 opacity-80 group-hover:opacity-100 group-hover:dark:text-white transition-all duration-300 drop-shadow-sm"}
                    />
                </svg>

                {/* Circular mask for the background */}
                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-md group-hover:shadow-lg transition-shadow z-10">
                    {orb.customOrbImage ? (
                        <img
                            src={orb.customOrbImage}
                            alt={orb.name || "Orb Preset"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                        </div>
                    )}

                    {/* Overlay Gradient for Text/Actions on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-4">
                        <h3 className="font-bold text-white text-sm leading-tight truncate w-full mb-1 drop-shadow-md">
                            {orb.name || "Untitled Orb"}
                        </h3>
                        {activePlaylistNames !== "No Playlists" && (
                            <p className="text-[10px] text-white/80 truncate w-full mb-2 drop-shadow-md" title={activePlaylistNames}>
                                {activePlaylistNames}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions overlay container, set above the hidden layer to allow menu dropdown overflows */}
                <div className="absolute inset-x-0 bottom-[-10px] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center pb-2">
                    <div className="flex items-center gap-2 pointer-events-auto">
                        {/* Remove Button (Only if in a playlist context) */}
                        {currentPlaylistId && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromCurrentPlaylist(e);
                                }}
                                className="p-2 rounded-full transition-colors bg-red-500/80 hover:bg-red-600 text-white shadow-sm border border-black/10"
                                title="Remove from this playlist"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}

                        {/* Visualizer & Banner Menu Button */}
                        <div className="relative flex justify-center">
                            <button
                                ref={colorButtonRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsColorMenuOpen(!isColorMenuOpen);
                                }}
                                className={`p-2 rounded-full transition-colors backdrop-blur-md shadow-sm border border-white/20 ${isColorMenuOpen
                                    ? 'bg-sky-500 text-white'
                                    : (orb.visualizerColor || orb.fullscreenBanner)
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
                                        : 'bg-white/20 hover:bg-white/30 text-white'
                                    }`}
                                style={orb.visualizerColor && !isColorMenuOpen ? { backgroundColor: orb.visualizerColor, filter: 'brightness(0.95)' } : undefined}
                                title="Visualizer & Banner Settings"
                            >
                                <Palette size={14} className={orb.visualizerColor && !isColorMenuOpen ? 'text-black dark:text-white filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' : ''} />
                            </button>

                            {isColorMenuOpen && (
                                <div
                                    ref={colorMenuRef}
                                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden text-sm text-left animate-in fade-in slide-in-from-bottom-2 duration-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Visualizer Section */}
                                    <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                        <span className="font-bold text-xs uppercase text-slate-500 pl-2">Visualizer Color</span>
                                    </div>
                                    <div className="p-1 flex flex-col gap-1 border-b border-slate-100 dark:border-white/5">
                                        <button
                                            type="button"
                                            onClick={handleAssignColorFromButton}
                                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
                                        >
                                            <Palette size={14} className="text-slate-400 dark:text-slate-500" />
                                            <span>Assign current color</span>
                                        </button>
                                        {orb.visualizerColor && (
                                            <button
                                                type="button"
                                                onClick={handleClearColorFromButton}
                                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                                            >
                                                <Trash2 size={14} />
                                                <span>Clear assigned color</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Banner Section */}
                                    <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                        <span className="font-bold text-xs uppercase text-slate-500 pl-2">App Banner</span>
                                    </div>
                                    <div className="p-1 flex flex-col gap-1">
                                        <button
                                            type="button"
                                            onClick={handleAssignBannerFromButton}
                                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
                                        >
                                            <ImageIcon size={14} className="text-slate-400 dark:text-slate-500" />
                                            <span>Assign current banner</span>
                                        </button>
                                        {orb.fullscreenBanner && (
                                            <button
                                                type="button"
                                                onClick={handleClearBannerFromButton}
                                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                                            >
                                                <Trash2 size={14} />
                                                <span>Clear assigned banner</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Playlist Assignment Menu */}
                        <div className="relative flex justify-center">
                            <button
                                ref={buttonRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className={`p-2 rounded-full transition-colors backdrop-blur-md shadow-sm border border-white/20 ${isMenuOpen
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-white/20 hover:bg-white/30 text-white'
                                    }`}
                                title="Assign to Playlists"
                            >
                                {orb.playlistIds?.length > 0 ? <Check size={14} /> : <Plus size={14} />}
                            </button>

                            {isMenuOpen && (
                                <div
                                    ref={menuRef}
                                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden text-sm text-left"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                        <span className="font-bold text-xs uppercase text-slate-500 pl-2">Assign to Playlists</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-1">
                                        {allPlaylists.map(playlist => {
                                            const isSelected = orb.playlistIds?.includes(playlist.id);
                                            return (
                                                <button
                                                    key={playlist.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePlaylist(playlist.id);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${isSelected
                                                        ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    <span className="truncate">{playlist.name}</span>
                                                    {isSelected && <Check size={14} />}
                                                </button>
                                            );
                                        })}
                                        {allPlaylists.length === 0 && (
                                            <div className="px-3 py-4 text-center text-slate-400 italic text-xs">
                                                No playlists found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Right-Click Context Menu */}
            {contextMenu && (() => {
                let menuTop = contextMenu.y;
                let menuLeft = contextMenu.x;
                const menuWidth = 224;
                const menuHeight = orb.visualizerColor ? 120 : 80;

                if (menuLeft + menuWidth > window.innerWidth - 8) {
                    menuLeft = window.innerWidth - menuWidth - 8;
                }
                if (menuTop + menuHeight > window.innerHeight - 8) {
                    menuTop = window.innerHeight - menuHeight - 8;
                }

                return ReactDOM.createPortal(
                    <div
                        ref={contextMenuRef}
                        className="fixed z-[9999] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 p-1 w-56 text-sm text-left"
                        style={{
                            top: menuTop,
                            left: menuLeft,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 rounded-t-lg">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Orb Preset Options</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleAssignColor}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
                        >
                            <Palette size={14} className="text-slate-400 dark:text-slate-500" />
                            <span>Assign current color</span>
                        </button>
                        {orb.visualizerColor && (
                            <button
                                type="button"
                                onClick={handleClearColor}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                            >
                                <Trash2 size={14} />
                                <span>Clear assigned color</span>
                            </button>
                        )}
                    </div>,
                    document.body
                );
            })()}
        </div>
    );
};

export default OrbCard;
