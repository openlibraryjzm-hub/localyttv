import React from 'react';

const MainSettingsPage = () => {
    return (
        <div className="w-full h-full flex p-8 gap-8 items-start justify-center">
            {/* Left Side - Expanded Square (now taking more space) */}
            <div className="w-[37.5%] h-full flex items-start justify-end pt-2">
                {/* Increased max-width by 50% and matched height to app popout by using flexible height within max constraints */}
                <div className="w-full aspect-square max-w-[600px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[48px] shadow-2xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group">
                    <span className="text-white/20 font-black uppercase tracking-widest text-xl group-hover:text-white/40 transition-colors">Square</span>
                </div>
            </div>

            {/* Right Side - Enlarged AppBannerPopup Layout (Shrunk to accommodate larger square) */}
            <div className="flex-1 h-full pl-8 flex items-start pt-2">
                <div className="w-full aspect-[1.68/1] max-h-[85%] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[48px] shadow-2xl overflow-hidden flex flex-col">

                    {/* Top Section - 33.33% Height */}
                    <div className="h-1/3 w-full border-b border-white/10 flex items-center justify-center gap-16 relative bg-gradient-to-b from-white/5 to-transparent">

                        {/* Left Rectangle */}
                        <div className="w-64 h-24 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-lg transition-all hover:bg-white/10 hover:scale-105 cursor-pointer flex items-center justify-center group">
                            <span className="opacity-0 group-hover:opacity-100 text-white/40 font-bold uppercase tracking-widest transition-opacity">Option A</span>
                        </div>

                        {/* Central Large Orb */}
                        <div className="h-4/5 aspect-square rounded-full bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-600 shadow-[0_0_60px_rgba(14,165,233,0.5)] border-4 border-white/20 hover:scale-105 transition-all cursor-pointer flex items-center justify-center group relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {/* Glossy Reflection */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
                        </div>

                        {/* Right Rectangle */}
                        <div className="w-64 h-24 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-lg transition-all hover:bg-white/10 hover:scale-105 cursor-pointer flex items-center justify-center group">
                            <span className="opacity-0 group-hover:opacity-100 text-white/40 font-bold uppercase tracking-widest transition-opacity">Option B</span>
                        </div>
                    </div>

                    {/* Bottom Section - 66.67% Height */}
                    <div className="flex-1 w-full flex">

                        {/* Bottom Left - 50% Width */}
                        <div className="w-1/2 h-full border-r border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors p-8 flex items-center justify-center group cursor-pointer relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-white/20 font-black uppercase tracking-widest text-2xl group-hover:text-white/50 transition-colors z-10">Bottom Left</span>
                        </div>

                        {/* Bottom Right - 50% Width */}
                        <div className="w-1/2 h-full flex flex-col">

                            {/* Top Sub-section (33.33% of bottom right) */}
                            <div className="h-1/3 w-full border-b border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center group">
                                <span className="text-white/30 font-bold uppercase tracking-widest group-hover:text-white/60 transition-colors">Top Right Action</span>
                            </div>

                            {/* Bottom Sub-section (66.67% of bottom right) */}
                            <div className="flex-1 w-full hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center group bg-black/10">
                                <span className="text-white/30 font-bold uppercase tracking-widest group-hover:text-white/60 transition-colors">Main Right Action</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MainSettingsPage;
