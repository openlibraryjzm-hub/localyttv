import React, { useMemo } from 'react';
import { FOLDER_COLORS } from '../utils/folderColors';
import { useFolderStore } from '../store/folderStore';
import { usePlaylistStore } from '../store/playlistStore';
import useLongPress from '../hooks/useLongPress';

// Sub-component for color segment to handle long-press
const ColorButton = ({ 
  onClick, 
  onLongPress, 
  className, 
  style, 
  children 
}) => {
  const longPress = useLongPress(onLongPress, onClick);
  return (
    <button
      {...longPress}
      onContextMenu={onLongPress}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
};

/**
 * BulkTagColorGrid - Shows a grid of 16 colors for folder tagging
 */
const BulkTagColorGrid = ({
  videoId,
  currentFolders = [],
  selectedFolders = new Set(),
  onColorClick,
  playlistId = null,
  folderMetadata = {},
  onRenameFolder,
  folderCounts: folderCountsProp
}) => {
  const videoFolderAssignments = useFolderStore(state => state.videoFolderAssignments);
  const currentPlaylistItems = usePlaylistStore(state => state.currentPlaylistItems);
  const previewPlaylistItems = usePlaylistStore(state => state.previewPlaylistItems);

  const activeItems = previewPlaylistItems || currentPlaylistItems || [];

  const folderCounts = useMemo(() => {
    if (folderCountsProp) return folderCountsProp;
    const counts = {};
    if (videoFolderAssignments && activeItems.length > 0) {
      const cleanIds = new Set(activeItems.map(v => v.id));
      Object.entries(videoFolderAssignments).forEach(([itemId, folders]) => {
        if (cleanIds.has(Number(itemId)) && Array.isArray(folders)) {
          folders.forEach(folderId => {
            counts[folderId] = (counts[folderId] || 0) + 1;
          });
        }
      });
    }
    return counts;
  }, [folderCountsProp, videoFolderAssignments, activeItems]);

  // Helper to get display name for a folder color
  const getDisplayName = (color) => {
    const metadata = folderMetadata[color.id];
    if (metadata && metadata.name) {
      const defaultName = color.name;
      const customName = metadata.name.trim();

      const normalize = (name) => name.replace(/\s+Folder$/i, '').trim().toLowerCase();
      const defaultBase = normalize(defaultName);
      const customBase = normalize(customName);

      if (customBase !== defaultBase && customBase.length > 0) {
        return customName;
      }
    }
    return null;
  };

  return (
    <div
      className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20"
      data-card-action="true"
      onClick={(e) => e.stopPropagation()}
      style={{ overflow: 'visible' }}
    >
      <div className="grid grid-cols-4 grid-rows-4 h-full w-full gap-0" style={{ overflow: 'visible' }}>
        {FOLDER_COLORS.map((color) => {
          const isSelected = selectedFolders.has(color.id);
          const isCurrentlyAssigned = currentFolders.includes(color.id);
          const customName = getDisplayName(color);
          const count = folderCounts[color.id] || 0;

          return (
            <div key={color.id} className="relative w-full h-full group" style={{ overflow: 'visible' }}>
              <ColorButton
                onClick={(e) => {
                  e.stopPropagation();
                  if (onColorClick) {
                    onColorClick(color.id);
                  }
                }}
                onLongPress={(e) => {
                  if (e && e.preventDefault) e.preventDefault();
                  const current = getDisplayName(color) || color.name;
                  const newName = window.prompt(`Rename "${current}" folder:`, current);
                  if (newName !== null && newName.trim() !== "" && onRenameFolder) {
                    onRenameFolder(color.id, newName.trim());
                  }
                }}
                className={`
                  w-full h-full transition-all relative cursor-pointer
                  ${isSelected
                    ? 'ring-2 ring-white ring-inset'
                    : 'hover:opacity-90'
                  }
                  ${isCurrentlyAssigned ? 'opacity-100' : 'opacity-70'}
                `}
                style={{ backgroundColor: color.hex }}
              >
                {/* Item Count Display (Top-Right) */}
                <div 
                  className="absolute top-0.5 right-1 text-[11px] font-black text-white leading-none pointer-events-none select-none z-20"
                  style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 1)' }}
                  title={`${count} video${count === 1 ? '' : 's'} in ${customName || color.name}`}
                >
                  {count}
                </div>

                {/* Assigned Tick Mark (Bottom-Left to avoid count collision) */}
                {isSelected && (
                  <svg
                    className="w-5 h-5 text-white absolute bottom-0.5 left-0.5 z-10 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}

                {/* Custom name overlay */}
                {customName && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 15 }}>
                    <div className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg" style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 1)',
                      whiteSpace: 'nowrap',
                      maxWidth: '90%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {customName}
                    </div>
                  </div>
                )}
              </ColorButton>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BulkTagColorGrid;
