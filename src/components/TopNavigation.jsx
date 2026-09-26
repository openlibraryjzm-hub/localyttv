import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationStore } from '../store/navigationStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useFolderStore } from '../store/folderStore';
import { THEMES } from '../utils/themes';
import { FOLDER_COLORS } from '../utils/folderColors';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';

const TopNavigation = () => {
    const { currentPage } = useNavigationStore();
    const { inspectMode } = useLayoutStore();
    const getGroupByColorId = usePlaylistGroupStore((s) => s.getGroupByColorId);
    // Consume previewPlaylistId to support "visiting" context vs "playing" context
    const { previewPlaylistId, currentPlaylistId, currentPlaylistTitle, allPlaylists } = usePlaylistStore();
    // Consume selectedFolder and showColoredFolders from folderStore
    const { selectedFolder, hoveredFolder, allFolderMetadata } = useFolderStore();

    const [currentThemeId] = useState('blue'); // Defaulting to blue theme for consistency
    const theme = THEMES[currentThemeId];

    // Helper to get inspect label
    const getInspectTitle = (label) => inspectMode ? label : undefined;

    // Determine Active Context (Preview takes precedence for "Visiting" state)
    // If previewPlaylistId is set, we are "visiting" that playlist.
    // If not, we fall back to currentPlaylistId (the one currently loaded/playing).
    const activePlaylistId = previewPlaylistId || currentPlaylistId;
    const activePlaylist = allPlaylists.find(p => p.id === activePlaylistId);

    // On Playlists page, show "Playlists" and bar controls in header; otherwise use playlist/folder context
    const isPlaylistsPage = currentPage === 'playlists';

    // Determine display content
    // Use currentPlaylistTitle only if we are in the "current" context (no preview)
    let displayTitle = isPlaylistsPage
        ? 'Playlists'
        : ((activePlaylistId === currentPlaylistId ? currentPlaylistTitle : null)
            || (activePlaylist ? activePlaylist.name : 'Select a Playlist'));

    let displayDescription = isPlaylistsPage ? '' : (activePlaylist ? activePlaylist.description : '');
    let bannerHex = 'rgba(255, 255, 255, 0.95)'; // Default to white
    let hasActiveContext = isPlaylistsPage || !!activePlaylist || !!activePlaylistId;
    let isUnsorted = false;
    let isColoredFolder = false;

    // Fast instant visual override for the priority system (hover > selected)
    const effectiveFolder = hoveredFolder !== undefined ? hoveredFolder : selectedFolder;

    // Determine color/folder context based on effectiveFolder (UI State)
    if (effectiveFolder !== null && effectiveFolder !== undefined) {
        isColoredFolder = true;
        if (effectiveFolder === 'unsorted') {
            displayTitle = `${displayTitle} - Unsorted`;
            bannerHex = '#000000'; // Unsorted folder color is black
            isUnsorted = true;
            hasActiveContext = true;
        } else {
            const color = FOLDER_COLORS.find(c => c.id === effectiveFolder);
            if (color) {
                let folderName = color.name;

                if (isPlaylistsPage) {
                    const group = getGroupByColorId(color.id);
                    if (group && group.name) {
                        folderName = group.name;
                    }
                } else {
                    // Check if custom name differs from default
                    const metadata = allFolderMetadata[color.id];
                    if (metadata && metadata.name) {
                        const customName = metadata.name.trim();
                        const normalize = (name) => name.replace(/\s+Folder$/i, '').trim().toLowerCase();
                        const defaultBase = normalize(color.name);
                        const customBase = normalize(customName);

                        if (customBase !== defaultBase && customBase.length > 0) {
                            folderName = customName;
                        }
                    }
                }

                displayTitle = folderName;
                bannerHex = color.hex; // Match folder color exactly
                hasActiveContext = true;
            }
        }
    } else if (activePlaylist) {
        // Leave as default white background for normal playlists
        bannerHex = 'rgba(255, 255, 255, 0.95)';
    }

    // Determine font styling based on the context
    let floatingTitleStyle = { color: '#052F4A' }; // Default playlist style
    if (isColoredFolder) {
        if (isUnsorted) {
            floatingTitleStyle = {
                color: 'black',
                textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
            };
        } else {
            floatingTitleStyle = {
                color: 'white',
                textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
            };
        }
    }

    // Simplified styles matching the native app theme color
    const containerStyle = {};

    const titleStyle = {
        color: '#052F4A'
    };

    const isContentEmpty = (!isPlaylistsPage && hasActiveContext) || isPlaylistsPage;

    if (isContentEmpty) {
        return null;
    }

    return (
        <>
            <div
                className={`relative w-full flex items-end justify-between pb-4 transition-all duration-300 min-h-[100px] overflow-hidden ${!hasActiveContext ? `${theme.menuBg} ${theme.menuBorder} backdrop-blur-md border rounded-xl px-8` : ''}`}
                style={containerStyle}
            >

                {/* Left side: Playlist/Folder Info */}
                <div className="relative z-10 flex flex-col justify-end min-w-0 flex-1 pl-8">
                    {(!isPlaylistsPage && hasActiveContext) || isPlaylistsPage ? (
                        null
                    ) : (
                        <>
                            <h1
                                className={`text-3xl font-bold tracking-tight truncate`}
                                style={titleStyle}
                            >
                                {displayTitle}
                            </h1>
                            {displayDescription && (
                                <p className="text-[#052F4A]/60 text-xs mt-0.5 font-medium line-clamp-1 max-w-2xl">
                                    {displayDescription}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Right side actions */}
                <div className="relative z-10 flex items-center gap-2 pl-4 pr-8 mb-1 shrink-0 min-w-0">
                </div>
            </div>

            {/* Floating Title Bar historically below, now moved to top-left */}
        </>
    );
};

export default TopNavigation;
