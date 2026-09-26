import React, { useState, useRef, useEffect } from 'react';
import { Home, Filter, CalendarDays, Hash, Type, ArrowUp, ArrowDown, Eye, EyeOff, Layers, Package, PackageOpen, Dices } from 'lucide-react';

const SORT_OPTIONS = [
    { mode: 'shuffle', label: 'Default / Shuffle', Icon: Home },
    { mode: 'amount', label: 'Sort by item count', Icon: Hash },
    { mode: 'date', label: 'Sort by date created', Icon: CalendarDays },
    { mode: 'name', label: 'Sort alphabetically', Icon: Type },
    { mode: 'scramble', label: 'Scramble playlists', Icon: Dices },
];

/**
 * Icon-based sort filter bar for the Playlists page sticky toolbar.
 * - Home = default (shuffle)
 * - Funnel = dropdown with Item Count, Date Created, Alphabetical, plus view filters
 */
const PlaylistSortFilters = ({
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    showHidden,
    setShowHidden,
    contentFilter,
    setContentFilter,
    isLight = true, // true when All selected (white bar), false when Unsorted/folder (colored bar)
    className = '',
    onOpenChange,
}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const cycleDirection = () => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    const isShuffleActive = sortBy === 'shuffle';
    const isSortDropdownActive = ['amount', 'date', 'name'].includes(sortBy) || sortBy?.startsWith('scramble');
    const isFunnelActive = isSortDropdownActive;

    const ICON_WHITE_OUTLINE = {
        color: 'white',
        filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)'
    };

    const btnBase = 'p-1.5 transition-all shrink-0 flex items-center justify-center';
    const btnInactive = 'opacity-85 hover:opacity-100 hover:scale-110';
    const btnActive = 'opacity-100 scale-110';

    const Arrow = ({ up }) => {
        const Icon = up ? ArrowUp : ArrowDown;
        return <Icon size={10} strokeWidth={2.5} className="opacity-90" />;
    };

    const handleSortOptionClick = (mode) => {
        if (mode === 'shuffle') {
            setSortBy('shuffle');
            return;
        }
        if (mode === 'scramble') {
            setSortBy(`scramble_${Date.now()}`);
            setSortDirection('desc');
            return;
        }

        if (sortBy === mode) {
            cycleDirection();
        } else {
            setSortBy(mode);
            setSortDirection('desc'); // Default to descending when selecting a new option.
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
                if (typeof onOpenChange === 'function') onOpenChange(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen, onOpenChange]);

    const handleDropdownToggle = () => {
        const next = !dropdownOpen;
        setDropdownOpen(next);
        if (typeof onOpenChange === 'function') onOpenChange(next);
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {/* Funnel = dropdown with sort options */}
            <div className="relative shrink-0" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={handleDropdownToggle}
                    className={`${btnBase} ${isFunnelActive ? btnActive : btnInactive}`}
                    style={ICON_WHITE_OUTLINE}
                    title="Filter and sort playlists"
                >
                    <Filter size={20} strokeWidth={2.5} />
                </button>
                {dropdownOpen && (
                    <div
                        className={`absolute left-0 top-full pt-2 z-50 min-w-[200px] rounded-lg border-2 shadow-lg py-1 ${isLight ? 'bg-white border-black/20 text-black/90' : 'bg-slate-800 border-white/20 text-white/90'
                            }`}
                    >
                        <div className="px-3 py-1 mb-1 text-xs font-semibold uppercase opacity-50 tracking-wider">
                            Sort By
                        </div>
                        {SORT_OPTIONS.map(({ mode, label, Icon }) => {
                            const active = sortBy === mode || (mode === 'scramble' && sortBy?.startsWith('scramble'));
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => handleSortOptionClick(mode)}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${active
                                        ? isLight
                                            ? 'bg-black/10 font-medium'
                                            : 'bg-white/10 font-medium'
                                        : isLight
                                            ? 'hover:bg-gray-100'
                                            : 'hover:bg-white/10'
                                        }`}
                                    title={active ? (mode === 'scramble' ? 'Click to reshuffle' : 'Click to cycle direction') : label}
                                >
                                    <span className="flex items-center gap-2">
                                        <Icon size={14} strokeWidth={2.5} />
                                        {label}
                                    </span>
                                    {active && mode !== 'shuffle' && mode !== 'scramble' && <Arrow up={sortDirection === 'asc'} />}
                                </button>
                            );
                        })}

                        <div className={`h-px w-full my-1 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />
                        <div className="px-3 py-1 mb-1 text-xs font-semibold uppercase opacity-50 tracking-wider">
                            Visibility Filters
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowHidden(!showHidden)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                {showHidden ? <Eye size={14} strokeWidth={2.5} /> : <EyeOff size={14} strokeWidth={2.5} />}
                                {showHidden ? "Hide hidden playlists" : "Show hidden playlists"}
                            </span>
                        </button>

                        <div className={`h-px w-full my-1 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />
                        <div className="px-3 py-1 mb-1 text-xs font-semibold uppercase opacity-50 tracking-wider">
                            Content Filters
                        </div>
                        {[
                            { mode: 'all', label: 'All Playlists', Icon: Layers },
                            { mode: 'populated', label: 'Populated Only', Icon: Package },
                            { mode: 'empty', label: 'Empty Only', Icon: PackageOpen },
                        ].map(({ mode, label, Icon }) => {
                            const active = contentFilter === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setContentFilter(mode)}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${active
                                        ? isLight
                                            ? 'bg-black/10 font-medium'
                                            : 'bg-white/10 font-medium'
                                        : isLight
                                            ? 'hover:bg-gray-100'
                                            : 'hover:bg-white/10'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Icon size={14} strokeWidth={2.5} />
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistSortFilters;
