import React, { useState, useMemo } from 'react';
import { FOLDER_COLORS } from '../utils/folderColors';
import { X, Search } from 'lucide-react';

const AutoTagModal = ({ isOpen, onClose, items, videoFolderAssignments, folderMetadata, onConfirm, isProcessing, progress }) => {
    const [selectedHandle, setSelectedHandle] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Extract handles and group videos
    const handleGroups = useMemo(() => {
        const groups = {};

        items.forEach(video => {
            // Parse handle logic from TweetCard
            const authorMatch = video.author?.match(/^(.+?)\s*\(@(.+?)\)$/);
            const handle = authorMatch ? `@${authorMatch[2]}` : null;

            if (handle) {
                // Check if video is already assigned to ANY folder
                const isAssigned = videoFolderAssignments[video.id] && videoFolderAssignments[video.id].length > 0;

                if (!isAssigned) {
                    if (!groups[handle]) {
                        groups[handle] = {
                            handle,
                            displayName: authorMatch[1],
                            videos: [],
                            count: 0
                        };
                    }
                    groups[handle].videos.push(video);
                    groups[handle].count++;
                }
            }
        });

        // Convert to array and sort by count desc
        return Object.values(groups).sort((a, b) => b.count - a.count);
    }, [items, videoFolderAssignments]);

    // Filter handles by search
    const filteredHandles = useMemo(() => {
        if (!searchTerm) return handleGroups;
        const lowerSearch = searchTerm.toLowerCase();
        return handleGroups.filter(g =>
            g.handle.toLowerCase().includes(lowerSearch) ||
            g.displayName.toLowerCase().includes(lowerSearch)
        );
    }, [handleGroups, searchTerm]);

    const handleConfirm = () => {
        if (selectedHandle && selectedFolder) {
            const group = handleGroups.find(g => g.handle === selectedHandle);
            if (group) {
                onConfirm(selectedHandle, group.videos, selectedFolder);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-700 max-h-[65vh] flex flex-col overflow-hidden relative">


                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
                    <div>
                        <h3 className="text-xl font-bold text-white">Auto-Tag by Handle</h3>
                        <p className="text-sm text-slate-400 mt-1">Select a handle and a destination folder to automatically tag videos.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column: Handles */}
                    <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-900/50">
                        <div className="p-4 border-b border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search handles..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredHandles.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 italic">No handles found.</div>
                            ) : (
                                filteredHandles.map(group => (
                                    <button
                                        key={group.handle}
                                        onClick={() => setSelectedHandle(group.handle)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between group ${selectedHandle === group.handle
                                            ? 'bg-sky-500/10 border border-sky-500/50'
                                            : 'hover:bg-slate-800 border border-transparent'
                                            }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className={`font-semibold truncate ${selectedHandle === group.handle ? 'text-sky-400' : 'text-slate-200'}`}>
                                                {group.displayName}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">{group.handle}</div>
                                        </div>
                                        <div className={`ml-3 px-2 py-0.5 rounded-full text-xs font-bold ${selectedHandle === group.handle
                                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                            : 'bg-slate-700 text-slate-300'
                                            }`}>
                                            {group.count}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Folders */}
                    <div className="w-1/2 flex flex-col bg-slate-800/20">
                        <div className="p-4 border-b border-slate-800">
                            <h4 className="font-semibold text-slate-300">Target Folder</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 gap-3">
                                {FOLDER_COLORS.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => setSelectedFolder(color.id)}
                                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${selectedFolder === color.id
                                            ? 'border-white bg-white/5 scale-[1.02] shadow-xl'
                                            : 'border-transparent hover:bg-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full mb-2 shadow-lg"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                        <span className={`text-xs font-bold ${selectedFolder === color.id ? 'text-white' : 'text-slate-400'}`}>
                                            {folderMetadata?.[color.id]?.name || color.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
                    <div className="flex-1">
                        {isProcessing && (
                            <div className="flex items-center gap-3 text-sky-400 animate-pulse">
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-bold font-mono">
                                    PROCESSING {progress?.current || 0} / {progress?.total || 0}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isProcessing ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedHandle || !selectedFolder || isProcessing}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${selectedHandle && selectedFolder && !isProcessing
                                ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20 translate-y-0'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <span>Confirm Auto-Tag</span>
                            {selectedHandle && (
                                <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px]">
                                    {handleGroups.find(g => g.handle === selectedHandle)?.count}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoTagModal;
