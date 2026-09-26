import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical, Pin, Star, Folder, ChevronRight, ChevronLeft } from 'lucide-react';
import BulkTagColorGrid from './BulkTagColorGrid';
import DrumstickRating from './DrumstickRating';

/**
 * VideoCardThreeDotMenu - Standard vertical 3-dot menu for video cards.
 * Consolidates: Pins, Folder assignment (BulkTagColorGrid via side popout), 
 * Drumstick rating, and standard actions in a traditional vertical list.
 */
const VideoCardThreeDotMenu = forwardRef(({
  video,
  playlistId,
  // Pin
  isPinned,
  isPriority,
  isFollower,
  onTogglePin,
  onTogglePriorityPin,
  onRemovePin,
  // Folder (BulkTagColorGrid: click = assign/unassign, supports rename)
  videoFolders = [],
  folderMetadata = {},
  onStarColorLeftClick,
  onRenameFolder,
  // Rating
  drumstickRating = 0,
  onDrumstickRate,
  // Menu actions (Sticky, Delete, Move, Copy, Set Cover)
  menuOptions = [],
  onMenuOptionClick,
  triggerClassName = '',
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [folderGridOpen, setFolderGridOpen] = useState(false);
  const [gridPosition, setGridPosition] = useState({ top: 0, left: 0 });
  const [gridSide, setGridSide] = useState('right');

  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const folderBtnRef = useRef(null);
  const folderGridRef = useRef(null);

  useImperativeHandle(ref, () => ({
    openAt: (clientX, clientY) => {
      setIsOpen(true);
      // Wait for next render so menuRef is populated, then position will auto-adjust via useEffect,
      // but we need an initial projection.
      setPosition({ top: clientY, left: clientX });
    }
  }));

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      setFolderGridOpen(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 240;

      // Vertical menu: place below trigger, align right edges
      let left = rect.right - menuWidth;
      let top = rect.bottom + 6;

      // Clamp to viewport initial projection
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

      setPosition({ top, left });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If clicking inside the expanded grid, do not close anything
      if (
        folderGridOpen &&
        folderGridRef.current &&
        folderGridRef.current.contains(event.target)
      ) {
        return;
      }

      // If clicking outside the main menu and button, close everything
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
        (!buttonRef.current || !buttonRef.current.contains(event.target))
      ) {
        setIsOpen(false);
        setFolderGridOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleClickOutside, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleClickOutside, true);
    };
  }, [isOpen, folderGridOpen]);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let top = position.top;
    let left = position.left;
    let changed = false;

    // Auto-adjust vertical positioning to avoid clipping bottom
    if (rect.bottom > window.innerHeight - 8) {
      if (buttonRef.current) {
        const btnRect = buttonRef.current.getBoundingClientRect();
        // Pop up above the button instead
        top = btnRect.top - rect.height - 6;
        changed = true;
      }
    }

    if (top < 8) { top = 8; changed = true; }
    if (rect.right > window.innerWidth - 8) { left = window.innerWidth - rect.width - 8; changed = true; }
    if (left < 8) { left = 8; changed = true; }

    if (changed) {
      setPosition({ top, left });
    }
  }, [isOpen]);

  const toggleFolderGrid = (e) => {
    e.stopPropagation();
    if (!folderGridOpen && folderBtnRef.current && menuRef.current) {
      const btnRect = folderBtnRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const gridWidth = 196; // 180px + 8px*2 padding
      const gridHeight = 196;

      let left = menuRect.right + 4; // Spawns to the right normally
      let side = 'right';

      if (left + gridWidth > window.innerWidth - 8) {
        // Not enough space on the right, spawn on the left instead
        left = menuRect.left - gridWidth - 4;
        side = 'left';
      }

      let top = btnRect.top;
      if (top + gridHeight > window.innerHeight - 8) {
        top = window.innerHeight - gridHeight - 8;
      }

      setGridPosition({ top, left });
      setGridSide(side);
      setFolderGridOpen(true);
    } else {
      setFolderGridOpen(false);
    }
  };

  const handleMenuAction = (e, option) => {
    e.stopPropagation();
    if (onMenuOptionClick) onMenuOptionClick(option);
    setIsOpen(false);
    setFolderGridOpen(false);
  };

  const stickyOption = menuOptions.find(o => o.action === 'toggleSticky');
  const otherOptions = menuOptions.filter(o => o.action !== 'toggleSticky');

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`p-2 rounded-full hover:bg-black/50 text-white/90 transition-all backdrop-blur-sm ${triggerClassName} ${isOpen ? 'bg-black/60 text-white' : ''}`}
        title="More options"
        data-card-action="true"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && ReactDOM.createPortal(
        <>
          <div
            ref={menuRef}
            className="fixed z-[9998] flex flex-col bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
            style={{
              top: position.top,
              left: position.left,
              width: 240,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Pins */}
            <div className="px-3 py-2.5 border-b border-black/10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Pin</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPinned || isPriority) onRemovePin?.(video.id);
                    else onTogglePin?.(video);
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1
                    ${isPinned || isPriority ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' : 'bg-black/5 text-slate-700 hover:bg-black/10'}`}
                  title={isPinned || isPriority ? 'Unpin' : 'Pin'}
                >
                  <Pin size={12} fill={isPinned || isPriority ? 'currentColor' : 'none'} strokeWidth={2} />
                  {isPinned || isPriority ? 'Unpin' : 'Pin'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePriorityPin?.(video);
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1
                    ${isPriority ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-black/5 text-slate-700 hover:bg-black/10'}`}
                  title="Priority pin"
                >
                  <Star size={12} fill={isPriority ? 'currentColor' : 'none'} strokeWidth={2} />
                  Priority
                </button>
                {(isPinned || isPriority) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin?.(video);
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors
                      ${isFollower ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-black/5 text-slate-700 hover:bg-black/10'}`}
                    title="Follower pin"
                  >
                    Follower
                  </button>
                )}
              </div>
            </div>

            {/* 2. Rating */}
            {playlistId && video?.id && (
              <div className="px-3 py-2.5 border-b border-black/10">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Rating</div>
                <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
                  <DrumstickRating rating={drumstickRating} onRate={onDrumstickRate} disabled={false} />
                </div>
              </div>
            )}

            {/* 3. Actions */}
            <div className="py-1.5 flex flex-col gap-0.5">
              {stickyOption && (
                <button
                  type="button"
                  onClick={(e) => handleMenuAction(e, stickyOption)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-black/5 hover:text-black transition-colors"
                  title={stickyOption.label}
                >
                  <span className="text-slate-500 shrink-0">{stickyOption.icon ?? <div className="w-4 h-4" />}</span>
                  <span className="truncate">{stickyOption.label}</span>
                </button>
              )}

              {otherOptions.map((option, index) => {
                if (!option.label) return null;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => handleMenuAction(e, option)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors
                      ${option.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-black/5 hover:text-black'}`}
                    title={option.label}
                  >
                    <span className={`shrink-0 ${option.danger ? 'text-red-500' : 'text-slate-500'}`}>
                      {option.icon ?? <div className="w-4 h-4" />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-black/10 mx-3 my-0.5" />

            {/* 4. Colored Folders */}
            <div className="py-1.5 flex flex-col gap-0.5">
              <button
                ref={folderBtnRef}
                onClick={toggleFolderGrid}
                className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors ${folderGridOpen ? 'bg-black/5 text-black' : 'text-slate-700 hover:bg-black/5 hover:text-black'}`}
                title="Colored Folders"
              >
                <div className="flex items-center gap-2">
                  <Folder size={14} className="text-slate-500 shrink-0" />
                  <span className="truncate">Colored Folders...</span>
                </div>
                {gridSide === 'left' && folderGridOpen ? (
                  <ChevronLeft size={16} className="text-slate-500 shrink-0" />
                ) : (
                  <ChevronRight size={16} className={`text-slate-500 shrink-0 transition-transform ${folderGridOpen && gridSide === 'right' ? 'rotate-90' : ''}`} />
                )}
              </button>
            </div>
          </div>

          {/* Side Popout for Folder Grid */}
          {folderGridOpen && (
            <div
              ref={folderGridRef}
              className="fixed z-[9999] p-2 bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
              style={{
                top: gridPosition.top,
                left: gridPosition.left,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-[180px] h-[180px] rounded-lg overflow-hidden pointer-events-auto">
                <BulkTagColorGrid
                  videoId={video.id}
                  currentFolders={videoFolders}
                  selectedFolders={new Set(videoFolders)}
                  onColorClick={(colorId) => onStarColorLeftClick?.(video, colorId)}
                  playlistId={playlistId}
                  folderMetadata={folderMetadata}
                  onRenameFolder={onRenameFolder}
                />
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
});

export default VideoCardThreeDotMenu;
