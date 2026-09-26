import React from 'react';
import { Trash2 } from 'lucide-react';

const ChannelCard = ({ video, onClick, onRemove }) => {
    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div
                className={`group relative aspect-square w-[75%] max-w-[200px] mx-auto rounded-full overflow-hidden transition-all flex items-center justify-center cursor-pointer bg-slate-100 border border-slate-200 shadow-md hover:shadow-lg focus:outline-none ring-2 ring-transparent focus:ring-sky-500`}
                onClick={() => onClick && onClick(video.video_url)}
            >
                {/* Channel Icon */}
                {video.thumbnail_url ? (
                    <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-200">
                        <span className="text-4xl font-bold uppercase">{video.title?.charAt(0) || 'C'}</span>
                    </div>
                )}

                {/* Overlay Gradient for Text/Actions on hover */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-3">
                    <h3 className="font-bold text-white text-xs leading-tight truncate w-full mb-1 drop-shadow-md">
                        {video.title}
                    </h3>
                    <p className="text-[9px] text-sky-300 uppercase tracking-widest font-bold drop-shadow-md">Channel</p>
                    {video.video_url && (
                        <p className="text-[8px] text-slate-300 mt-1 font-mono truncate px-1 max-w-full opacity-80" title={video.video_url}>
                            {video.video_url.replace('https://www.youtube.com/', '').replace('youtube.com/', '')}
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
                                title="Remove Channel"
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

export default ChannelCard;
