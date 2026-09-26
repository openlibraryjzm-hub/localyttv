import React from 'react';
import { useTabStore } from '../store/tabStore';
import { useLayoutStore } from '../store/layoutStore';

const VIEW_OPTIONS = [
  { id: 'all', name: 'ALL' },
  { id: 'unsorted', name: 'UNSORTED' },
  { id: 'groups', name: 'GROUPS' },
];

/**
 * Playlists page view switcher: ALL | UNSORTED | GROUPS.
 * Replaces the previous tab/preset system. Same pill styling as before.
 */
const TabBar = () => {
  const { activeTabId, setActiveTab } = useTabStore();
  const { inspectMode } = useLayoutStore();

  const getInspectTitle = (label) => (inspectMode ? label : undefined);

  // Normalize: only allow all | unsorted | groups
  const viewId = VIEW_OPTIONS.some((o) => o.id === activeTabId) ? activeTabId : 'all';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 pb-1 no-scrollbar">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveTab(option.id)}
            title={getInspectTitle(option.name)}
            className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 font-bold text-xs uppercase tracking-wide cursor-pointer ${
              viewId === option.id
                ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabBar;
