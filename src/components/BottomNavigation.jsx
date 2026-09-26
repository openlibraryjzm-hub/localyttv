import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigationStore } from '../store/navigationStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { THEMES } from '../utils/themes';

const BottomNavigation = () => {
    const { history, goBack, setCurrentPage } = useNavigationStore();
    const { setViewMode } = useLayoutStore();
    const { previewPlaylistId, clearPreview } = usePlaylistStore();

    // We can use the blue theme like TopNavigation does by default, or just generic styling
    const currentThemeId = 'blue';
    const theme = THEMES[currentThemeId];

    return (
        <div className={`sticky top-0 z-40 w-full flex items-center justify-end p-2 transition-all duration-300 overflow-visible shrink-0 ${theme.menuBg} ${theme.menuBorder} backdrop-blur-md border border-x-0 border-t-0 rounded-none mb-4 shadow-sm`}>
            {/* Right side actions */}
            <div className="relative z-10 flex items-center gap-1.5 shrink-0 ml-auto pr-4">
                {(history.length > 0 || previewPlaylistId) && (
                    <button
                        type="button"
                        onClick={() => {
                            if (previewPlaylistId) clearPreview();
                            if (history.length > 0) goBack();
                            else if (previewPlaylistId) setCurrentPage('playlists');
                        }}
                        className="flex items-center justify-center w-7 h-7 rounded-full shadow-sm border border-black/20 bg-white hover:bg-gray-100 text-black transition-all hover:scale-105 active:scale-90 shrink-0"
                        title="Go Back"
                    >
                        <ChevronLeft size={18} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setViewMode('full')}
                    className="flex items-center justify-center w-7 h-7 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-md border border-rose-400 active:scale-90 shrink-0"
                    title="Close menu (Full screen)"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default BottomNavigation;
