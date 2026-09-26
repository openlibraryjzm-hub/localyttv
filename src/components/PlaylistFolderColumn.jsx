import React, { useEffect, useRef } from 'react';
import { Play, Shuffle, Grid3x3, RotateCcw, Info, X } from 'lucide-react';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import { getFolderColorById } from '../utils/folderColors';
import CardMenu from './NewCardMenu';

const PlaylistFolderColumn = ({
    playlist,
    folders,
    cardRect,
    onClose,
    onFolderSelect,
    onStickyToggle, // Optional: handler for sticking folders
    stuckFolders = new Set(),
    folderMetadata = {}
}) => {
    const columnRef = useRef(null);

    // Scroll into view or animation init
    useEffect(() => {
        if (columnRef.current) {
            columnRef.current.scrollTop = 0; // Start at top
        }

        // Lock body scroll? No, just let this overlay handle scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!cardRect) return null;

    return (
        <div
            className="absolute inset-0 z-50 flex flex-col"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose} // Click background to close
        >
            {/* Close button top right */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50"
            >
                <X size={24} />
            </button>

            {/* Scrollable Column Container */}
            {/* Positioned to align with the card horizontally (centered on card center) */}
            <div
                ref={columnRef}
                className="h-full overflow-y-auto overflow-x-hidden relative flex flex-col items-center py-20 gap-8 animate-in slide-in-from-bottom-10 duration-300"
                style={{ scrollbarWidth: 'none' }} // Hide scrollbar for cleaner look
            >
                {/* Placeholder for the "Source" playlist card spot - maybe we just show folders above/below? 
            The user said "same size as playlist card and for me to scroll between them vertically"
            "appear around it".
            Let's render the list of folders.
        */}

                {folders.length === 0 && (
                    <div className="text-white text-xl font-medium p-8 bg-slate-800/80 rounded-xl backdrop-blur-md border border-slate-700">
                        No colored folders in this playlist
                    </div>
                )}

                {folders.map((folder, index) => {
                    const folderColor = getFolderColorById(folder.folder_color);
                    const folderMetaKey = `${folder.playlist_id}:${folder.folder_color}`;
                    const customName = folderMetadata[folderMetaKey]?.name;
                    const displayFolderName = customName || folderColor.name;
                    const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
                    const isStuck = stuckFolders.has(folderKey);

                    const thumbnailUrl = folder.first_video
                        ? getThumbnailUrl(folder.first_video.video_id, 'max')
                        : null;

                    return (
                        <div
                            key={`${folder.playlist_id}-${folder.folder_color}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onFolderSelect) onFolderSelect(folder);
                            }}
                            className="group relative flex-shrink-0 transition-all duration-300 transform hover:scale-[1.02]"
                            style={{ width: '500px' }} // Same size as playlist card
                        >
                            <div
                                className="border-2 border-slate-700/50 rounded-xl p-2 bg-slate-100/90 hover:border-sky-500/80 shadow-2xl transition-all h-full flex flex-col relative overflow-hidden"
                            >
                                {/* Glow Background behind card */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at center, ${folderColor.hex}, transparent 70%)` }}
                                />

                                {/* Folder Name Display */}
                                <div className="mb-3 px-2">
                                    <h3 className="text-white font-bold text-xl drop-shadow-md truncate text-center">
                                        {displayFolderName}
                                    </h3>
                                </div>

                                {/* Thumbnail Area */}
                                <div className="rounded-lg overflow-hidden relative group mt-auto z-10 border-2 border-[#052F4A] shadow-inner" style={{
                                    width: '100%',
                                    paddingBottom: '56.25%', // 16:9
                                    backgroundColor: '#0f172a',
                                }}>
                                    {/* Colored left stripe */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-3 z-10 shadow-lg"
                                        style={{ backgroundColor: folderColor.hex }}
                                    />

                                    {thumbnailUrl ? (
                                        <img
                                            src={thumbnailUrl}
                                            alt={displayFolderName}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                            <Grid3x3 size={48} />
                                        </div>
                                    )}

                                    {/* Video Count Badge */}
                                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                                        {folder.video_count || 0} videos
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlaylistFolderColumn;
