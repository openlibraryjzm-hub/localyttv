import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Plus, Tag } from 'lucide-react';
import { FOLDER_COLORS } from '../utils/folderColors';
import useLongPress from '../hooks/useLongPress';

// Sub-component for individual prism buttons to handle long-press correctly
const PrismButton = ({ 
  onClick, 
  onLongPress, 
  onMouseEnter, 
  onMouseLeave, 
  className, 
  style, 
  title, 
  children 
}) => {
  const longPress = useLongPress(onLongPress, onClick);
  return (
    <button
      {...longPress}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onLongPress}
      className={className}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
};
import PlaylistSortFilters from './PlaylistSortFilters';
import { useNavigationStore } from '../store/navigationStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useFolderStore } from '../store/folderStore';
import FolderPrismContextMenu from './FolderPrismContextMenu';
import EditPlaylistModal from './EditPlaylistModal';

/**
 * Sticky toolbar for the Playlists page: VideoSortFilters + Add/Refresh/Bulk tag + folder prism + Back/Close.
 * Prism: All (white) + Unsorted (black) + 16 folder colors. Segments for colors that have a group carousel (by folderColorId).
 */
const PlaylistBar = ({
  playlists = [],
  onAddClick,
  groupColorIds = [],
  allPlaylistCount = 0,
  unsortedCount = 0,
  selectedFolder,
  onFolderSelect,
  currentPage = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  onAddPage,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  showHidden,
  setShowHidden,
  contentFilter,
  setContentFilter,
}) => {
  const { history, goBack, setCurrentPage } = useNavigationStore();
  const { setViewMode } = useLayoutStore();
  const { previewPlaylistId, clearPreview } = usePlaylistStore();
  const { setHoveredFolder } = useFolderStore();
  const { groups, getGroupByColorId, renameGroup, addGroup } = usePlaylistGroupStore();

  const [prismMenuOpen, setPrismMenuOpen] = useState(false);
  const [prismMenuPosition, setPrismMenuPosition] = useState({ top: 0, left: 0 });
  const [prismMenuContextFolder, setPrismMenuContextFolder] = useState(null);
  const [prismMenuContextLabel, setPrismMenuContextLabel] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const ICON_WHITE_OUTLINE = {
    color: 'white',
    filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)'
  };

  const [isStuck, setIsStuck] = useState(false);
  const stickySentinelRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 0);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );
    if (stickySentinelRef.current) observer.observe(stickySentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const [prismOnlyPopulated, setPrismOnlyPopulated] = useState(true);
  const groupColorIdSet = useMemo(() => new Set(groupColorIds), [groupColorIds]);
  const validPlaylistIdSet = useMemo(() => new Set((playlists || []).map(p => Number(p.id))), [playlists]);

  // All + Unsorted (black, if any) + colors that have a group carousel (by folderColorId) with >= 1 items
  const prismPopulatedSegments = useMemo(() => {
    const segments = [{ type: 'all', id: null, count: allPlaylistCount, label: null, hex: null }];
    if (unsortedCount >= 1) segments.push({ type: 'unsorted', id: 'unsorted', count: unsortedCount, label: null, hex: '#000000' });
    FOLDER_COLORS.forEach((color) => {
      const group = groups.find(g => g.folderColorId === color.id && (g.page || 1) === currentPage);
      const count = group ? (group.playlistIds || []).filter(id => validPlaylistIdSet.has(Number(id))).length : 0;
      if (count >= 1) {
        segments.push({ type: 'color', id: color.id, count, label: group ? group.name : color.name, hex: color.hex });
      }
    });
    return segments;
  }, [groups, currentPage, allPlaylistCount, unsortedCount, validPlaylistIdSet]);

  const handleUpdateGroupName = (data) => {
    const group = groups.find(g => g.folderColorId === prismMenuContextFolder && (g.page || 1) === currentPage);
    if (group) {
      renameGroup(group.id, data.name);
    } else if (prismMenuContextFolder !== null && prismMenuContextFolder !== 'unsorted') {
      addGroup(data.name, prismMenuContextFolder, currentPage);
    }
  };

  const modalInitialData = useMemo(() => {
    if (prismMenuContextFolder === null) return { name: 'All' };
    if (prismMenuContextFolder === 'unsorted') return { name: 'Unsorted' };
    const group = groups.find(g => g.folderColorId === prismMenuContextFolder && (g.page || 1) === currentPage);
    if (group) return { name: group.name };
    const color = FOLDER_COLORS.find(c => c.id === prismMenuContextFolder);
    return { name: color ? color.name : '' };
  }, [groups, prismMenuContextFolder, currentPage]);

  return (
    <>
      <div ref={stickySentinelRef} className="absolute h-px w-full -mt-px pointer-events-none opacity-0" />
      <div
        className={`sticky top-0 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-visible bg-black
          ${isStuck
            ? 'mx-0 rounded-none mb-4 pt-2 pb-2'
            : 'mx-0 rounded-none mb-4 mt-0 pt-1 pb-0'
          }
        `}
        style={{
          marginTop: '0px',
        }}
      >
        <div className={`px-4 flex items-center justify-between transition-all duration-300 relative z-10 ${isStuck ? 'h-[52px]' : 'py-0.5'}`}>

          <div className={`relative flex items-center min-h-[32px] pl-1 pr-1 shrink-0 mr-2`}>

            {/* The Buttons */}
            <div className={`flex items-center gap-1 transition-opacity duration-300 relative z-20 opacity-100`}>
              <PlaylistSortFilters
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
                showHidden={showHidden}
                setShowHidden={setShowHidden}
                contentFilter={contentFilter}
                setContentFilter={setContentFilter}
                isLight={false}
                className="shrink-0"
              />

              <button
                type="button"
                onClick={() => onAddClick?.()}
                className="p-1.5 transition-all shrink-0 flex items-center justify-center opacity-85 hover:opacity-100 hover:scale-110"
                style={ICON_WHITE_OUTLINE}
                title="Add Playlist"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>

              <button
                type="button"
                className="p-1.5 transition-all shrink-0 flex items-center justify-center opacity-85 hover:opacity-100 hover:scale-110"
                style={ICON_WHITE_OUTLINE}
                title="Bulk Tag"
              >
                <Tag size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex items-center min-w-0 flex-1 mr-0 relative z-20">
            <div
              className="flex items-center h-7 min-w-0 flex-1 border-2 border-black rounded-lg overflow-hidden cursor-context-menu"
              onContextMenu={(e) => {
                e.preventDefault();
                setPrismMenuPosition({ top: e.clientY, left: e.clientX });
                const group = groups.find(g => g.folderColorId === selectedFolder && (g.page || 1) === currentPage);
                const label = selectedFolder === null ? 'All' : selectedFolder === 'unsorted' ? 'Unsorted' : (group ? group.name : FOLDER_COLORS.find(c => c.id === selectedFolder)?.name || 'Folder');
                setPrismMenuContextFolder(selectedFolder);
                setPrismMenuContextLabel(label);
                setPrismMenuOpen(true);
              }}
              title={prismOnlyPopulated ? 'Right-click: show all segments' : 'Right-click: only segments with items'}
            >
              {prismOnlyPopulated ? (
                prismPopulatedSegments.map((seg, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === prismPopulatedSegments.length - 1;
                  const isSelected = selectedFolder === seg.id;
                  const isAll = seg.type === 'all';
                  const isUnsorted = seg.type === 'unsorted';
                  const outlineClass = isSelected
                    ? (isAll ? 'after:ring-2 after:ring-inset after:ring-black/20' : 'after:ring-2 after:ring-inset after:ring-white')
                    : (isUnsorted ? 'after:ring-1 after:ring-inset after:ring-white/80' : '');
                  const hasAfter = isSelected || isUnsorted;
                  const bg = isAll ? 'bg-white text-black' : isUnsorted ? 'bg-black text-white' : '';
                  const segLabel = isAll ? 'All' : isUnsorted ? 'Unsorted' : (seg.label || 'Carousel');
                  return (
                    <PrismButton
                      key={seg.type + (seg.id ?? 'all')}
                      onClick={() => onFolderSelect(seg.id)}
                      onLongPress={(e) => {
                        if (e && e.preventDefault) e.preventDefault();
                        setPrismMenuContextFolder(seg.id);
                        setPrismMenuContextLabel(segLabel);
                        setPrismMenuPosition({ top: e.clientY, left: e.clientX });
                        setPrismMenuOpen(true);
                      }}
                      onMouseEnter={() => setHoveredFolder(seg.id)}
                      onMouseLeave={() => setHoveredFolder(undefined)}
                      className={`h-full flex-1 min-w-0 flex items-center justify-center transition-all tabular-nums px-0.5 text-[10px] font-bold leading-none ${isSelected
                        ? 'opacity-100 z-10'
                        : 'opacity-90 hover:opacity-100'
                        } ${hasAfter ? 'relative after:content-[""] after:absolute after:inset-0 ' + outlineClass : ''} ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''} ${bg}`}
                      style={seg.hex ? { backgroundColor: seg.hex } : undefined}
                      title={isAll ? `Show All (${seg.count})` : isUnsorted ? `Unsorted (${seg.count})` : `${seg.label} (${seg.count})`}
                    >
                      <span className={seg.hex ? 'text-white drop-shadow-md' : ''}>{seg.count}</span>
                    </PrismButton>
                  );
                })
              ) : (
                <>
                  <PrismButton
                    onClick={() => onFolderSelect(null)}
                    onLongPress={(e) => {
                      if (e && e.preventDefault) e.preventDefault();
                      setPrismMenuContextFolder(null);
                      setPrismMenuContextLabel('All');
                      setPrismMenuPosition({ top: e.clientY, left: e.clientX });
                      setPrismMenuOpen(true);
                    }}
                    onMouseEnter={() => setHoveredFolder(null)}
                    onMouseLeave={() => setHoveredFolder(undefined)}
                    className={`h-full min-w-[2.25rem] flex-1 flex items-center justify-center transition-all rounded-l-md tabular-nums px-px max-w-[3rem] ${selectedFolder === null
                      ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-black/20'
                      : 'opacity-90 hover:opacity-100'
                      } bg-white text-black text-[10px] font-bold leading-none`}
                    title={`Show All (${allPlaylistCount} playlists)`}
                  >
                    {allPlaylistCount}
                  </PrismButton>
                  <PrismButton
                    onClick={() => onFolderSelect('unsorted')}
                    onLongPress={(e) => {
                      if (e && e.preventDefault) e.preventDefault();
                      setPrismMenuContextFolder('unsorted');
                      setPrismMenuContextLabel('Unsorted');
                      setPrismMenuPosition({ top: e.clientY, left: e.clientX });
                      setPrismMenuOpen(true);
                    }}
                    onMouseEnter={() => setHoveredFolder('unsorted')}
                    onMouseLeave={() => setHoveredFolder(undefined)}
                    className={`h-full min-w-[2.25rem] flex-1 flex items-center justify-center transition-all tabular-nums px-px max-w-[3rem] relative after:content-[""] after:absolute after:inset-0 ${selectedFolder === 'unsorted'
                      ? 'opacity-100 z-10 after:ring-2 after:ring-inset after:ring-white'
                      : 'opacity-90 hover:opacity-100 after:ring-1 after:ring-inset after:ring-white/80'
                      } bg-black text-white text-[10px] font-bold leading-none`}
                    title={`Unsorted (${unsortedCount} playlists)`}
                  >
                    {unsortedCount}
                  </PrismButton>
                  {FOLDER_COLORS.map((color, index) => {
                    const isSelected = selectedFolder === color.id;
                    const isLast = index === FOLDER_COLORS.length - 1;
                    const group = groups.find(g => g.folderColorId === color.id && (g.page || 1) === currentPage);
                    const count = group ? group.playlistIds.length : 0;
                    const label = group ? group.name : color.name;
                    return (
                      <PrismButton
                        key={color.id}
                        onClick={() => onFolderSelect(color.id)}
                        onLongPress={(e) => {
                          if (e && e.preventDefault) e.preventDefault();
                          setPrismMenuContextFolder(color.id);
                          setPrismMenuContextLabel(label);
                          setPrismMenuPosition({ top: e.clientY, left: e.clientX });
                          setPrismMenuOpen(true);
                        }}
                        onMouseEnter={() => setHoveredFolder(color.id)}
                        onMouseLeave={() => setHoveredFolder(undefined)}
                        className={`h-full flex-1 min-w-0 flex items-center justify-center transition-all tabular-nums px-0.5 ${isSelected
                          ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white'
                          : 'opacity-90 hover:opacity-100'
                          } ${isLast ? 'rounded-r-md' : ''}`}
                        style={{ backgroundColor: color.hex }}
                        title={`${label} (${count})`}
                      >
                        {count > 0 && (
                          <span className="text-[10px] font-bold text-white drop-shadow-md truncate max-w-full">
                            {count}
                          </span>
                        )}
                      </PrismButton>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto relative z-20">
            {(history.length > 0 || previewPlaylistId) && (
              <button
                type="button"
                onClick={() => {
                  if (previewPlaylistId) clearPreview();
                  if (history.length > 0) goBack();
                  else if (previewPlaylistId) setCurrentPage('playlists');
                }}
                className="flex items-center justify-center w-7 h-7 bg-transparent transition-all hover:scale-110 active:scale-90 shrink-0 opacity-85 hover:opacity-100"
                style={ICON_WHITE_OUTLINE}
                title="Go Back"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className="flex items-center justify-center w-7 h-7 bg-transparent transition-all hover:scale-110 active:scale-90 shrink-0 opacity-85 hover:opacity-100"
              style={ICON_WHITE_OUTLINE}
              title="Close menu (Full screen)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <FolderPrismContextMenu
        isOpen={prismMenuOpen}
        position={prismMenuPosition}
        onClose={() => setPrismMenuOpen(false)}
        prismOnlyPopulated={prismOnlyPopulated}
        setPrismOnlyPopulated={setPrismOnlyPopulated}
        onRenameClick={() => {
          setShowEditModal(true);
        }}
        clickedSegmentLabel={prismMenuContextLabel}
        showRenameOption={prismMenuContextFolder !== null && prismMenuContextFolder !== 'unsorted'}
      />
      <EditPlaylistModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdateGroupName}
        initialData={modalInitialData}
      />
    </>
  );
};

export default PlaylistBar;
