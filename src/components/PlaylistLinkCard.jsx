import React from 'react';
import { Trash2, ListVideo, Folder } from 'lucide-react';

const PlaylistLinkCard = ({ video, onClick, onRemove }) => {
    const isFolder = video.isFolderTracker || video.video_url?.startsWith('local:device_folder:');
    const displayPath = isFolder 
        ? video.video_url.replace('local:device_folder:', '') 
        : video.video_url;

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div
                className={`group relative aspect-video w-full max-w-[240px] mx-auto rounded-xl overflow-hidden transition-all flex items-center justify-center cursor-pointer bg-slate-100 border border-slate-200 shadow-md hover:shadow-lg focus:outline-none ring-2 ring-transparent focus:ring-sky-500`}
                onClick={() => onClick && onClick(video.video_url)}
            >
                {/* Tracker Thumbnail / Fallback */}
                {video.thumbnail_url ? (
                    <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center ${isFolder ? 'text-teal-400 bg-teal-50' : 'text-indigo-400 bg-indigo-50'}`}>
                        {isFolder ? <Folder size={48} className="opacity-50" /> : <ListVideo size={48} className="opacity-50" />}
                    </div>
                )}

                {/* Icon overlay indicator */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm p-1.5 rounded-lg">
                    {isFolder ? <Folder size={16} className="text-white" /> : <ListVideo size={16} className="text-white" />}
                </div>

                {/* Overlay Gradient for Text/Actions on hover */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-3">
                    <h3 className="font-bold text-white text-xs leading-tight line-clamp-2 w-full mb-1 drop-shadow-md">
                        {video.title}
                    </h3>
                    <p className={`text-[9px] uppercase tracking-widest font-bold drop-shadow-md ${isFolder ? 'text-teal-300' : 'text-indigo-300'}`}>
                        {isFolder ? 'Folder Tracker' : 'Playlist Tracker'}
                    </p>
                    
                    {displayPath && (
                        <p className="text-[8px] text-slate-300 mt-1 font-mono break-all line-clamp-2 px-1 max-w-full opacity-80" title={displayPath}>
                            {displayPath}
                        </p>
                    )}
                </div>

                {onRemove && (
                    <div className="absolute inset-x-0 bottom-[-10px] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center pb-2 pointer-events-none">
                        <div className="pointer-events-auto">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="p-2 rounded-full transition-colors bg-red-500/80 hover:bg-red-600 text-white shadow-sm border border-black/10"
                                title={isFolder ? "Remove Folder Tracker" : "Remove Playlist Tracker"}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistLinkCard;
