import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useNavigationStore } from '../store/navigationStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';

const PAGE_TITLES = {
  history: 'Watch History',
  pins: 'Pinned Videos',
  likes: 'Liked Videos',
  tasks: 'Tasks',
};

const BottomNavigation = ({ title }) => {
  const { history, currentPage, goBack, setCurrentPage } = useNavigationStore();
  const { setViewMode } = useLayoutStore();
  const { previewPlaylistId, clearPreview } = usePlaylistStore();

  const pageTitle = title || PAGE_TITLES[currentPage] || '';

  return (
    <div className="sticky top-0 z-40 w-full px-3 py-2 shrink-0 mb-3">
      <div className="border-2 border-[#052F4A] rounded-2xl px-4 py-2 bg-slate-100 shadow-md flex items-center justify-between gap-3 w-full">
        {/* Left side: Page Title */}
        <div className="flex items-center min-w-0 flex-1">
          {pageTitle && (
            <h2 className="text-xl font-black text-[#052F4A] tracking-tight truncate select-none">
              {pageTitle}
            </h2>
          )}
        </div>

        {/* Right side actions */}
        <div className="relative z-10 flex items-center gap-2 shrink-0 ml-auto">
          {(history.length > 0 || previewPlaylistId) && (
            <button
              type="button"
              onClick={() => {
                if (previewPlaylistId) clearPreview();
                if (history.length > 0) goBack();
                else if (previewPlaylistId) setCurrentPage('playlists');
              }}
              className="border-2 border-[#052F4A] rounded-xl px-2.5 py-1.5 bg-slate-200/60 hover:bg-sky-100 shadow-sm flex items-center gap-1 text-[#052F4A] font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer select-none shrink-0"
              title="Go Back"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
              <span>Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setViewMode('full')}
            className="border-2 border-[#052F4A] rounded-xl px-2.5 py-1.5 bg-slate-200/60 hover:bg-rose-100 shadow-sm flex items-center gap-1 text-[#052F4A] font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer select-none shrink-0"
            title="Close menu (Full screen)"
          >
            <X size={16} strokeWidth={2.5} />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;
