import React, { useState, useRef, useEffect } from 'react';
import { Home, Filter, CalendarDays, BarChart2, Clock, ArrowUp, ArrowDown, Plus, RotateCcw, Tag, ChevronLeft, ChevronRight, ListPlus, Eye } from 'lucide-react';
import useLongPress from '../hooks/useLongPress';

// Sub-component for filter buttons to handle long-press correctly
const FilterButton = ({ 
  onClick, 
  onLongPress, 
  className, 
  style, 
  title, 
  children 
}) => {
  const longPress = useLongPress(onLongPress, onClick);
  return (
    <button
      {...longPress}
      onContextMenu={onLongPress}
      className={className}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
};
import { useNavigationStore } from '../store/navigationStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useFolderStore } from '../store/folderStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { FOLDER_COLORS } from '../utils/folderColors';

const DRUMSTICK = '🍗';

const SORT_OPTIONS = [
  { mode: 'shuffle', label: 'Default / Shuffle', Icon: Home },
  { mode: 'chronological', label: 'Sort by date', Icon: CalendarDays },
  { mode: 'addedToApp', label: 'Added to app', Icon: ListPlus },
  { mode: 'progress', label: 'Sort by progress', Icon: BarChart2 },
  { mode: 'lastViewed', label: 'Sort by last viewed', Icon: Clock },
  { mode: 'watchCount', label: 'Watch Count', Icon: Eye },
];

/**
 * Icon-based sort and rating filter bar for the Videos page sticky toolbar.
 * - Home = default (shuffle)
 * - Funnel = dropdown with Date, Progress, Last viewed + horizontal drumstick rating filter (1–5)
 * - Plus = dropdown with Add, Refresh, Bulk Tag actions
 */
const VideoSortFilters = ({
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  selectedRatings,
  onToggleRating,
  isLight = true, // true when All selected (white bar), false when Unsorted/folder (colored bar)
  className = '',
  onAddClick,
  onRefreshClick,
  onRefreshRightClick,
  onBulkTagClick,
  onBulkTagRightClick,
  bulkTagMode,
  currentPage = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const actionDropdownRef = useRef(null);

  const { currentPage: navCurrentPage } = useNavigationStore();
  const getGroupByColorId = usePlaylistGroupStore((s) => s.getGroupByColorId);
  const { previewPlaylistId, currentPlaylistId, currentPlaylistTitle, allPlaylists } = usePlaylistStore();
  const { selectedFolder, hoveredFolder, allFolderMetadata } = useFolderStore();

  const activePlaylistId = previewPlaylistId || currentPlaylistId;
  const activePlaylist = allPlaylists.find(p => p.id === activePlaylistId);
  const isPlaylistsPage = navCurrentPage === 'playlists';

    // No longer displaying text/titles per user request

  let bannerHex = '#ffffff';
  let isUnsorted = false;
  let isColoredFolder = false;

  const effectiveFolder = hoveredFolder !== undefined ? hoveredFolder : selectedFolder;

  if (effectiveFolder !== null && effectiveFolder !== undefined) {
    isColoredFolder = true;
    if (effectiveFolder === 'unsorted') {
      // Don't append " - Unsorted", just keep the playlist name
      bannerHex = '#000000';
      isUnsorted = true;
    } else {
      const color = FOLDER_COLORS.find(c => c.id === effectiveFolder);
      if (color) {
        bannerHex = color.hex;
      }
    }
  } else if (activePlaylist) {
    bannerHex = '#ffffff';
  }

  const isDropdownActive = dropdownOpen || actionDropdownOpen;

  const cycleDirection = () => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
  const isShuffleActive = sortBy === 'shuffle';
  const isSortDropdownActive = ['chronological', 'addedToApp', 'progress', 'lastViewed', 'watchCount'].includes(sortBy);
  const hasRatingFilter = selectedRatings.length > 0;
  const isFunnelActive = isSortDropdownActive || hasRatingFilter;

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
    if (sortBy === mode) {
      cycleDirection();
    } else {
      setSortBy(mode);
      setSortDirection('desc');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(e.target)) {
        setActionDropdownOpen(false);
      }
    };
    if (dropdownOpen || actionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, actionDropdownOpen]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>

      {/* Full Bar Glow */}
      <div className={`absolute -inset-x-4 inset-y-0 z-0 pointer-events-none transition-opacity duration-300 ${isDropdownActive ? 'opacity-0' : 'opacity-100'}`}>
        <div
          className="absolute inset-0 pointer-events-none blur-[20px] opacity-70 transition-colors duration-300"
          style={{ backgroundColor: bannerHex }}
        />
        <div
          className="absolute inset-0 pointer-events-none blur-[10px] opacity-85 transition-colors duration-300"
          style={{ backgroundColor: bannerHex }}
        />
      </div>

      {/* Title + Buttons Wrapper */}
      <div className={`relative flex items-center min-h-[32px] pl-1 pr-1 w-full`}>

        {/* The 3 buttons layer */}
        <div className={`flex items-center gap-1 transition-opacity duration-300 relative z-20 opacity-100`}>
          {/* Funnel = dropdown with Date, Progress, Last viewed */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => { setDropdownOpen((o) => !o); setActionDropdownOpen(false); }}
              className={`${btnBase} ${isFunnelActive ? btnActive : btnInactive}`}
              style={ICON_WHITE_OUTLINE}
              title="Sort & rating filter"
            >
              <Filter size={20} strokeWidth={2.5} />
            </button>
            {dropdownOpen && (
              <div
                className={`absolute left-0 top-full pt-2 z-50 min-w-[200px] rounded-lg border-2 shadow-lg py-1 ${isLight ? 'bg-white border-black/20' : 'bg-slate-800 border-white/20'
                  }`}
              >
                {SORT_OPTIONS.map(({ mode, label, Icon }) => {
                  const active = sortBy === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { handleSortOptionClick(mode); }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm rounded-md transition-colors ${active
                        ? isLight
                          ? 'bg-black/10 font-medium'
                          : 'bg-white/10 font-medium'
                        : isLight
                          ? 'hover:bg-gray-100 text-black/80'
                          : 'hover:bg-white/10 text-white/80'
                        }`}
                      title={active ? 'Click to cycle direction' : label}
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={14} strokeWidth={2.5} />
                        {label}
                      </span>
                      {active && mode !== 'shuffle' && <Arrow up={sortDirection === 'asc'} />}
                    </button>
                  );
                })}



                {/* Rating filter: horizontal row of 1–5 drumsticks */}
                <div className={`px-3 py-2 border-t ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                  <div className="text-xs font-medium mb-1.5 opacity-70">Rating filter</div>
                  <div className="flex items-center justify-between gap-0.5">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const selected = selectedRatings.includes(rating);
                      return (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => onToggleRating(rating)}
                          className={`w-8 h-8 rounded flex items-center justify-center text-lg leading-none transition-all
                        ${selected
                              ? 'opacity-100 scale-110'
                              : isLight
                                ? 'opacity-40 hover:opacity-70 text-gray-600'
                                : 'opacity-40 hover:opacity-70 text-white/80'
                            }`}
                          title={`Rating ${rating} (toggle)`}
                        >
                          {DRUMSTICK}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Videos / Subscriptions Button */}
          <button
            type="button"
            onClick={() => onAddClick?.()}
            className={`${btnBase} ${btnInactive}`}
            style={ICON_WHITE_OUTLINE}
            title="Add Videos"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>

          {/* Bulk Tag Button */}
          <FilterButton
            onClick={() => onBulkTagClick?.()}
            onLongPress={(e) => {
              if (e && e.preventDefault) e.preventDefault();
              onBulkTagRightClick?.(e);
            }}
            className={`${btnBase} ${bulkTagMode ? btnActive : btnInactive}`}
            style={ICON_WHITE_OUTLINE}
            title="Tap: Bulk Tag / Long-press: Auto-Tag"
          >
            <Tag size={20} strokeWidth={2.5} />
          </FilterButton>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center shrink-0 ml-1">
              <button
                type="button"
                onClick={onPrevPage}
                disabled={currentPage <= 1}
                className={`transition-all flex items-center justify-center ${currentPage <= 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-85 hover:opacity-100 hover:scale-110'}`}
                style={ICON_WHITE_OUTLINE}
                title="Previous page"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>

              <span
                className="text-xs font-bold min-w-[1.5rem] text-center"
                style={ICON_WHITE_OUTLINE}
              >
                {currentPage}
              </span>

              <button
                type="button"
                onClick={onNextPage}
                disabled={currentPage >= totalPages}
                className={`transition-all flex items-center justify-center ${currentPage >= totalPages ? 'opacity-30 cursor-not-allowed' : 'opacity-85 hover:opacity-100 hover:scale-110'}`}
                style={ICON_WHITE_OUTLINE}
                title="Next page"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div> {/* Close The 3 buttons layer */}
      </div> {/* Close Title + Buttons Wrapper */}

    </div>
  );
};

export default VideoSortFilters;
