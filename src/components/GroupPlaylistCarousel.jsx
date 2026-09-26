import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Layers, LayoutGrid, LayoutList, Minus, Pencil, Trash2 } from 'lucide-react';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';

/**
 * Group Playlist Carousel - Horizontal scrollable row of playlist cards.
 * Used on Playlists Page (GROUPS view). Bounded box, top bar (name + mode buttons + rename + delete), scrollbar near cards.
 * Mode is per-carousel (playlistGroupStore.groupCarouselModes[groupId]). Top nav "apply to all" updates every group at once.
 * Modes: 'large', 'small' (~3 visible), 'bar' (thin bar, no thumbnails).
 * When effectiveSizeOverride is set (All vs colored-folder prism context), it overrides stored mode for layout: 'small' on All page, 'large' when viewing a single colored folder.
 */
const GroupPlaylistCarousel = ({ children, title = 'Featured playlists', groupId, onRename, onDelete, mode: modeProp, effectiveSizeOverride, enableGlobalScrollLock = false, onMouseEnter, onMouseLeave }) => {
    const scrollContainerRef = useRef(null);

    const storedMode = usePlaylistGroupStore((s) => (groupId != null ? s.groupCarouselModes?.[groupId] ?? 'large' : 'large'));
    const setGroupCarouselMode = usePlaylistGroupStore((s) => s.setGroupCarouselMode);
    let mode = groupId != null ? storedMode : (modeProp ?? 'large');
    if (effectiveSizeOverride === 'large' || effectiveSizeOverride === 'small') {
        mode = effectiveSizeOverride;
    }

    const count = React.Children.count(children);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const isBar = mode === 'bar';
            const scrollAmount = isBar ? 120 : scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const isBarMode = mode === 'bar';
    const isSmallMode = mode === 'small';

    // Implement horizontal scroll via mouse wheel
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                // Do not block scroll on overlays, popups, or menus
                const isOverlay = e.target.closest('.fixed, [role="dialog"], .absolute.z-50, [data-card-menu="true"]');
                if (isOverlay) return;

                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        const targetEl = enableGlobalScrollLock ? window : container;

        targetEl.addEventListener('wheel', handleWheel, { passive: false });
        return () => targetEl.removeEventListener('wheel', handleWheel);
    }, [enableGlobalScrollLock]);

    const topBarCompact = isBarMode || isSmallMode;
    const topBarLight = !isBarMode; // small and large carousels use white box + light top bar

    // Disable the top bar for colored folders
    const topBar = null;

    const boxClassName = isBarMode
        ? 'w-full mb-3 rounded-xl border border-white/10 bg-slate-800/40 shadow-md overflow-hidden'
        : isSmallMode
            ? 'w-full mb-1.5 rounded-2xl border border-slate-200 bg-transparent overflow-hidden'
            : 'w-full outline-none border-none bg-transparent overflow-hidden';

    // Empty carousel
    if (count === 0) {
        return (
            <div className="px-4" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                <div className={boxClassName}>
                    {topBar}
                    {!isBarMode && (
                        <div className="min-h-[120px] flex items-center justify-center bg-slate-50">
                            <p className="text-sm text-slate-500">No playlists in this carousel</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Bar mode: only top bar (with inline scroll buttons); hidden strip with fixed-width slots so scroll works
    if (isBarMode) {
        return (
            <div className="px-4" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                <div className={`${boxClassName} relative`}>
                    {topBar}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-4 overflow-x-auto overflow-y-hidden w-full overscroll-x-contain opacity-0 pointer-events-none absolute left-0 bottom-0 h-0 min-h-0 overflow-hidden"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                        aria-hidden
                    >
                        {React.Children.map(children, (_, index) => (
                            <div key={`bar-slot-${index}`} className="flex-shrink-0 w-[120px]" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 1+ items: horizontal scroll row. Card size by mode.
    const cardWrapperClass = isSmallMode
        ? 'w-[min(180px,calc(33vw-1rem))] min-w-[140px] max-w-full flex-shrink-0'
        : 'w-[min(520px,calc(50vw-2rem))] min-w-[380px] max-w-full flex-shrink-0';
    const gapClass = isSmallMode ? 'gap-4' : 'gap-10';

    return (
        <div className="px-4" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div className={boxClassName}>
                {topBar}
                <div className="relative min-w-0">
                    <div
                        ref={scrollContainerRef}
                        className={`group-carousel-scroll flex ${gapClass} overflow-x-auto overflow-y-hidden px-1 min-w-0 overscroll-x-contain ${isSmallMode ? 'pt-1 pb-1' : 'pt-3 pb-2'} ${enableGlobalScrollLock ? 'scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' : ''}`}
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {React.Children.map(children, (child, index) => (
                            <div key={child?.key ?? `carousel-item-${index}`} className={cardWrapperClass}>
                                {React.isValidElement(child)
                                    ? React.cloneElement(child, { size: mode === 'small' ? 'small' : 'large', inCarousel: true })
                                    : child}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupPlaylistCarousel;
