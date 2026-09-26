import React, { useMemo, useState } from 'react';
import { usePinStore } from '../store/pinStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useLayoutStore } from '../store/layoutStore';
import { useNavigationStore } from '../store/navigationStore';
import VideoCard from './VideoCard';

import StickyVideoCarousel, { SplatterIcon } from './StickyVideoCarousel';
import { ChevronDown, ChevronUp, ListTodo, ChevronRight } from 'lucide-react';
import BottomNavigation from './BottomNavigation';

const PinsPage = ({ onVideoSelect }) => {
    const { pinnedVideos, priorityPinIds } = usePinStore();
    const { currentVideoIndex, currentPlaylistItems } = usePlaylistStore();
    const { inspectMode } = useLayoutStore();
    const { setCurrentPage } = useNavigationStore();
    const [isPriorityExpanded, setIsPriorityExpanded] = useState(true);

    // Helper to get inspect label
    const getInspectTitle = (label) => inspectMode ? label : undefined;

    // Split videos into Priority and Regular
    const { priorityVideos, regularVideos } = useMemo(() => {
        if (!pinnedVideos) return { priorityVideos: [], regularVideos: [] };

        const priority = [];
        const regular = [];

        // Use Set for fast lookup if we had many IDs, but array includes is fine for small lists
        const priorityIds = priorityPinIds || [];

        // Distribute videos
        pinnedVideos.forEach(video => {
            if (priorityIds.includes(video.id)) {
                priority.push(video);
            } else {
                regular.push(video);
            }
        });

        // Sort priority videos by their order in priorityPinIds (most recent first)
        priority.sort((a, b) => {
            return priorityIds.indexOf(a.id) - priorityIds.indexOf(b.id);
        });

        // Sort regular videos by pinnedAt timestamp (newest first)
        regular.sort((a, b) => {
            const timeA = a.pinnedAt || 0;
            const timeB = b.pinnedAt || 0;
            return timeB - timeA;
        });

        return { priorityVideos: priority, regularVideos: regular };
    }, [pinnedVideos, priorityPinIds]);

    const formatDate = (timestamp) => {
        const date = timestamp ? new Date(timestamp) : new Date(); // Default to now if missing
        // Verify valid date
        if (isNaN(date.getTime())) return formatDate(Date.now());

        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();

        const suffix = (d) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };

        return `${day}${suffix(day)} ${month}, ${year}`;
    };

    // Group regular videos by date
    const groupedRegularVideos = useMemo(() => {
        if (!regularVideos.length) return {};
        const groups = {};

        regularVideos.forEach(video => {
            // Use pinnedAt or default to today if 0/undefined
            const dateStr = formatDate(video.pinnedAt || Date.now());
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(video);
        });

        return groups;
    }, [regularVideos]);

    const renderContent = () => {
        if (!pinnedVideos || pinnedVideos.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <h3 className="text-xl font-medium mb-2">No Pinned Videos</h3>
                    <p>Pin videos from any playlist to access them quickly here.</p>
                </div>
            );
        }

        // Get top 10 priority pins for carousel
        const carouselVideos = priorityVideos.slice(0, 10);

        return (
            <div className="flex flex-col gap-8 pb-12">
                {/* Priority Pins Carousel */}
                {carouselVideos.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {/* Collapsible Header */}
                        <div
                            className="flex items-center justify-between cursor-pointer bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors group select-none"
                            onClick={() => setIsPriorityExpanded(!isPriorityExpanded)}
                        >
                            <div className="flex items-center gap-2">
                                <SplatterIcon className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-bold text-[#052F4A] group-hover:text-amber-400 transition-colors">Priority Pins - History</h3>
                                {!isPriorityExpanded && (
                                    <span className="text-xs text-slate-400 bg-black/20 px-2 py-0.5 rounded-full ml-2">
                                        {carouselVideos.length} items
                                    </span>
                                )}
                            </div>
                            <div className="text-slate-400 group-hover:text-[#052F4A] transition-colors">
                                {isPriorityExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        {isPriorityExpanded && (
                            <div className="mt-2">
                                <StickyVideoCarousel title={null}>
                                    {carouselVideos.map((video, index) => {
                                        const isCurrentlyPlaying = currentPlaylistItems?.[currentVideoIndex]?.id === video.id;
                                        return (
                                            <VideoCard
                                                key={video.id || `priority-${index}`}
                                                video={video}
                                                index={index}
                                                originalIndex={index}
                                                isSelected={false}
                                                isCurrentlyPlaying={isCurrentlyPlaying}
                                                videoFolders={[]} // Pinned view doesn't show folder context usually
                                                onVideoSelect={onVideoSelect}
                                                onVideoClick={() => onVideoSelect(video.video_url)}
                                            />
                                        );
                                    })}
                                </StickyVideoCarousel>
                            </div>
                        )}
                    </div>
                )}

                {/* Regular Pins Groups */}
                {Object.keys(groupedRegularVideos).length > 0 && (
                    <div className="flex flex-col gap-8">
                        {Object.entries(groupedRegularVideos).map(([date, videos], groupIndex) => (
                            <div key={`group-${date}`} className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 border-b border-black/10 pb-2">
                                    <h3 className="text-xl font-bold text-[#052F4A]">{date}</h3>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                                        {videos.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {videos.map((video, index) => {
                                        const isCurrentlyPlaying = currentPlaylistItems?.[currentVideoIndex]?.id === video.id;
                                        return (
                                            <VideoCard
                                                key={video.id || `pinned-${groupIndex}-${index}`}
                                                video={video}
                                                index={index}
                                                originalIndex={index}
                                                isSelected={false}
                                                isCurrentlyPlaying={isCurrentlyPlaying}
                                                videoFolders={[]}
                                                onVideoSelect={onVideoSelect}
                                                onVideoClick={() => onVideoSelect(video.video_url)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <BottomNavigation />
                <div className="p-4 pt-0">
                    {/* Link to Tasks page */}
                    <button
                        type="button"
                        onClick={() => setCurrentPage('tasks')}
                        className="flex items-center gap-2 mb-6 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-black/10 text-[#052F4A] font-medium transition-colors w-full sm:w-auto"
                    >
                        <ListTodo size={20} />
                        <span>Tasks</span>
                        <ChevronRight size={18} className="opacity-70" />
                    </button>

                    {renderContent()}
                </div>
            </div>
        </div>
    );

};

export default PinsPage;
