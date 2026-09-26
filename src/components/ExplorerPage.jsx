import React from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { Trash2, Plus } from 'lucide-react';
import BottomNavigation from './BottomNavigation';

const ExplorerPage = ({ onVideoSelect }) => {
  const { setCurrentPage } = useNavigationStore();
  const { pages, setTotalPages, setActivePage, deletePage } = usePlaylistGroupStore();

  const handlePageClick = (pageNum) => {
    setActivePage(pageNum);
    setCurrentPage('playlists');
  };

  const handleAddPage = (e) => {
    e.stopPropagation();
    setTotalPages(pages.length + 1); 
  };

  const handleDeletePage = (e, pageId) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to remove Page ${pageId}?`);
    if (confirmed) {
      deletePage(pageId);
    }
  };

  const count = pages.length;
  const maxPageId = Math.max(...pages);
  
  // Calculate best "engulfing" dimensions
  let cols;
  if (count <= 3) cols = count;
  else if (count <= 8) cols = Math.ceil(count / 2);
  else cols = Math.ceil(Math.sqrt(count));

  const rows = Math.ceil(count / cols);
  
  // Distribute pages into rows for the engulfing effect
  const pagesByRow = [];
  for (let i = 0; i < rows; i++) {
    const start = i * cols;
    const end = Math.min(start + cols, count);
    if (start < count) {
      pagesByRow.push(pages.slice(start, end));
    }
  }

  const isGiant = count <= 3;

  const getFontSize = (text) => {
    const len = String(text).length;
    if (isGiant) {
      if (len <= 2) return 'text-[14rem]';
      return 'text-[9rem]';
    } else {
      if (len <= 2) return 'text-8xl';
      return 'text-5xl';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-sky-400 via-sky-300 to-sky-100 text-sky-900 font-sans overflow-hidden select-none border-l border-sky-200/50 relative">
      
      {/* Navigation Bar */}
      <BottomNavigation />

      {/* Decorative Light Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-sky-200/40 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container - Filling the space */}
      <div className="flex-1 w-full flex items-stretch justify-stretch overflow-hidden min-h-0 relative z-10">
        
        {/* Sleek Glassmorphic Grid */}
        <div 
          className="bg-sky-900/10 flex flex-col gap-[2px] border border-white/60 shadow-[0_30px_60px_rgba(0,0,0,0.08)] backdrop-blur-2xl w-full h-full"
        >
          {pagesByRow.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-1 gap-[2px]">
              {row.map((pageId) => {
                return (
                  <div 
                    key={pageId}
                    onClick={() => handlePageClick(pageId)}
                    className="group relative flex-1 bg-white/30 flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden hover:bg-white/50 border border-white/10"
                  >
                    {pageId > 1 && (
                      <button
                        onClick={(e) => handleDeletePage(e, pageId)}
                        className="absolute top-4 right-4 p-2 text-sky-900/10 hover:text-rose-500 transition-colors z-20"
                        title={`Delete Page ${pageId}`}
                      >
                        <Trash2 size={20} />
                      </button>
                    )}

                    <h2 className={`${getFontSize(pageId)} font-thin text-sky-900/30 tracking-tighter transition-all duration-700 group-hover:text-sky-900 group-hover:scale-105 group-hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.8)] whitespace-nowrap px-4`} title={pageId}>
                       {pageId}
                    </h2>

                  {/* Glass highlight on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Integrated New Page Button inside the last square */}
                  {pageId === maxPageId && (
                    <button 
                      onClick={handleAddPage}
                      className="absolute bottom-6 right-6 bg-white/40 hover:bg-white/70 border border-white/60 text-sky-900 shadow-lg transition-all p-3 flex items-center gap-2 group backdrop-blur-xl rounded-xl z-20"
                      title="Add New Page"
                    >
                      <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">New Page</span>
                    </button>
                  )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default ExplorerPage;
