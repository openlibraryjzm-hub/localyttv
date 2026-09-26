import React, { useState } from 'react';
import { FOLDER_COLORS } from '../utils/folderColors';
import { Pencil } from 'lucide-react';
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
 * BulkTagColorGrid - Shows a grid of 16 colors on hover for bulk tagging
 * Appears when hovering over a video thumbnail in bulk tag mode
 */
const BulkTagColorGrid = ({
  videoId,
  currentFolders = [],
  selectedFolders = new Set(),
  onColorClick,
  playlistId = null,
  folderMetadata = {},
  onRenameFolder
}) => {
  // Helper to get display name for a folder color
  const getDisplayName = (color) => {
    const metadata = folderMetadata[color.id];
    if (metadata && metadata.name) {
      // Check if custom name differs from default
      const defaultName = color.name;
      const customName = metadata.name.trim();

      // Normalize both names for comparison (remove " Folder" suffix, case-insensitive)
      const normalize = (name) => name.replace(/\s+Folder$/i, '').trim().toLowerCase();
      const defaultBase = normalize(defaultName);
      const customBase = normalize(customName);

      // Return custom name if it's different from default
      if (customBase !== defaultBase && customBase.length > 0) {
        return customName;
      }
    }
    return null; // Return null if no custom name or it matches default
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
          const displayName = customName || color.name;

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
                  w-full h-full transition-all relative
                  ${isSelected
                    ? 'ring-2 ring-white ring-inset'
                    : 'hover:opacity-90'
                  }
                  ${isCurrentlyAssigned ? 'opacity-100' : 'opacity-70'}
                `}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <svg
                    className="w-6 h-6 text-white absolute inset-0 m-auto z-10"
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
              {/* Edit button - only show on desktop hover */}
              <button
                className="absolute top-0.5 right-0.5 p-0.5 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-bl md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  const current = getDisplayName(color) || color.name;
                  const newName = window.prompt(`Rename "${current}" folder:`, current);
                  if (newName !== null && newName.trim() !== "" && onRenameFolder) {
                    onRenameFolder(color.id, newName.trim());
                  }
                }}
                title="Rename Folder"
              >
                <Pencil size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BulkTagColorGrid;

