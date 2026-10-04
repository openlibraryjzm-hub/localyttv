import React, { useState, useEffect } from 'react';
import { Sparkles, Monitor, Database, X, Download, Zap, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'yttv_download_prompt_dismissed';

const WebDownloadPrompt = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleExpand = () => {
    setIsDismissed(false);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const handleDownloadClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // Collapsed Narrow Capsule (Pill mode)
  if (isDismissed) {
    return (
      <div className="absolute top-3 right-4 z-[99999] pointer-events-auto no-drag">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExpand}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-[#052F4A] text-[#052F4A] text-xs font-bold rounded-full shadow-lg transition-all cursor-pointer group"
            title="Click to view Desktop App perks"
          >
            <Zap size={15} className="text-[#052F4A] fill-[#052F4A]/20 group-hover:scale-110 transition-transform" />
            <span className="text-[12.5px]">Get Free Desktop App (30x Speed)</span>
            <ChevronDown size={15} className="text-[#052F4A]/70 group-hover:text-[#052F4A]" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded Horizontal Card (Fixed box size, increased text size to fill internal margins)
  return (
    <div className="absolute top-3 right-4 z-[99999] pointer-events-auto no-drag h-[168px] w-[640px] max-w-[calc(100vw-360px)]">
      <div className="relative h-full bg-slate-100/95 backdrop-blur-md border-2 border-[#052F4A] rounded-2xl p-3.5 shadow-2xl text-[#052F4A] flex items-stretch gap-4 overflow-hidden animate-in fade-in slide-in-from-top-2">
        {/* Left Column: CTA & Headline */}
        <div className="w-[38%] flex flex-col justify-between pr-3 border-r border-[#052F4A]/25">
          <div>
            <div className="flex items-center gap-1 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11.5px] font-black bg-[#052F4A] text-white tracking-wide">
                <Sparkles size={13} /> 100% FREE APP
              </span>
            </div>
            <p className="text-[13px] font-bold text-[#052F4A] leading-snug">
              The web version is a demo — desktop is where the real magic lives.
            </p>
          </div>

          <div className="relative">
            {/* CTA Button */}
            <button
              onClick={handleDownloadClick}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#052F4A] hover:bg-[#0a456c] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
            >
              <Download size={14} strokeWidth={2.5} />
              <span>Get Free Desktop App</span>
            </button>

            {/* Toast Feedback */}
            {showToast && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#052F4A] text-white text-[10px] font-bold rounded-md shadow-xl whitespace-nowrap z-50">
                Download page link coming soon!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3 Horizontal Larger Commentary Points */}
        <div className="w-[62%] flex flex-col justify-between relative pl-0.5">
          {/* Top Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-1 -right-1 p-1 text-[#052F4A]/60 hover:text-[#052F4A] hover:bg-[#052F4A]/10 rounded-full transition-colors cursor-pointer"
            title="Dismiss to capsule"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          <div className="space-y-2.5 pr-4">
            {/* Point 1: Visualizer */}
            <div className="flex items-start gap-2.5">
              <Zap size={17} className="text-[#052F4A] shrink-0 mt-0.5 fill-[#052F4A]/20" />
              <div className="text-[12.5px] leading-tight">
                <span className="font-extrabold text-[#052F4A]">Visualizer Feels Like Pure Magic: </span>
                <span className="text-[#052F4A]/90 font-medium">WASAPI audio capture eliminates browser latency (ultra smooth on 240Hz).</span>
              </div>
            </div>

            {/* Point 2: Immersion */}
            <div className="flex items-start gap-2.5">
              <Monitor size={17} className="text-[#052F4A] shrink-0 mt-0.5" />
              <div className="text-[12.5px] leading-tight">
                <span className="font-extrabold text-[#052F4A]">Total Immersion: </span>
                <span className="text-[#052F4A]/90 font-medium">Dedicated full-screen app window free from browser tab clutter.</span>
              </div>
            </div>

            {/* Point 3: Storage */}
            <div className="flex items-start gap-2.5">
              <Database size={17} className="text-[#052F4A] shrink-0 mt-0.5" />
              <div className="text-[12.5px] leading-tight">
                <span className="font-extrabold text-[#052F4A]">Truly Unconstrained: </span>
                <span className="text-[#052F4A]/90 font-medium">Local SQLite DB with zero browser quota limits or clearing risks.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebDownloadPrompt;
