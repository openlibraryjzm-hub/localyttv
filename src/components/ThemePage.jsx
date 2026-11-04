import React, { useState } from 'react';
import { Check, Sparkles, Palette } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import BottomNavigation from './BottomNavigation';

const THEMES = [
  {
    id: 'black',
    name: 'OLED Black',
    tagline: 'Pure black canvas with crisp white typography',
    description: 'Minimalist 2-color duo-tone. Video letterboxes merge seamlessly into the background with zero distractions.',
    canvasHex: '#000000',
    foregroundHex: '#ffffff',
    visualizerHex: '#ffffff',
  },
  {
    id: 'sky',
    name: 'Sky Blue Radial',
    tagline: 'Luminous cyan spotlight plunging to deep midnight abyss',
    description: 'Harsh high-contrast radial duo-tone. Brilliant cyan spotlight core sharply dropping off into pitch-dark midnight void navy.',
    canvasHex: 'radial-gradient(ellipse at 50% 30%, #e0f2fe 0%, #38bdf8 25%, #0369a1 55%, #030f1c 95%)',
    foregroundHex: '#052F4A',
    visualizerHex: '#38bdf8',
  },
  {
    id: 'white',
    name: 'Pure White Radial',
    tagline: 'Snow white spotlight plunging to deep obsidian graphite',
    description: 'Harsh monochromatic radial duo-tone. Blinding snow white core plunging abruptly into a deep obsidian graphite/charcoal perimeter.',
    canvasHex: 'radial-gradient(ellipse at 50% 30%, #ffffff 0%, #cbd5e1 30%, #475569 65%, #090d16 100%)',
    foregroundHex: '#000000',
    visualizerHex: '#cbd5e1',
  },
];

export default function ThemePage() {
  const { appTheme, setAppTheme, visualizerColor, setVisualizerColor } = useConfigStore();
  const [syncVisualizer, setSyncVisualizer] = useState(true);

  const handleSelectTheme = (theme) => {
    setAppTheme(theme.id);
    if (syncVisualizer) {
      setVisualizerColor(theme.visualizerHex);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-black select-none">
      {/* Top Header */}
      <BottomNavigation title="Theme Customization" />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center">
        <div className="w-full max-w-4xl flex flex-col gap-6">
          {/* Subtitle / Philosophy */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Palette size={22} className="text-white/80" />
              Color Themes
            </h1>
            <p className="text-sm font-medium text-white/60">
              Curated 2-color duo-tone systems built strictly with canvas and foreground tones.
            </p>
          </div>

          {/* Sync Visualizer Toggle Capsule */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-white/80" />
              <div>
                <p className="text-sm font-bold text-white">Sync Audio Visualizer</p>
                <p className="text-xs text-white/60">Automatically match the visualizer color to the active theme</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSyncVisualizer(!syncVisualizer)}
              className="w-11 h-6 rounded-full transition-colors relative cursor-pointer"
              style={{
                backgroundColor: syncVisualizer ? 'var(--theme-fg)' : 'var(--theme-fg-subtle)',
              }}
            >
              <div
                className={`w-4 h-4 rounded-full transition-transform absolute top-1 ${
                  syncVisualizer ? 'translate-x-6' : 'translate-x-1'
                }`}
                style={{
                  backgroundColor: syncVisualizer ? 'var(--theme-bg)' : 'var(--theme-fg)',
                }}
              />
            </button>
          </div>

          {/* Theme Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {THEMES.map((theme) => {
              const isSelected = appTheme === theme.id || (!appTheme && theme.id === 'black');

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between border-2 ${
                    isSelected
                      ? 'border-white bg-zinc-900/80 shadow-2xl scale-[1.01]'
                      : 'border-white/10 hover:border-white/30 bg-zinc-900/40 hover:bg-zinc-900/60'
                  }`}
                >
                  {/* Top Row: Name and Checkmark Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">
                        {theme.name}
                      </h3>
                      <p className="text-xs font-semibold text-white/60 mt-0.5">
                        {theme.tagline}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-2'
                          : 'border border-white/20 group-hover:border-white/40'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: 'var(--theme-fg)',
                              color: 'var(--theme-bg)',
                              boxShadow: '0 0 0 2px var(--theme-fg-subtle)',
                            }
                          : undefined
                      }
                    >
                      {isSelected && <Check size={14} strokeWidth={3.5} />}
                    </div>
                  </div>

                  {/* Miniature Visual Mockup */}
                  <div
                    className="w-full h-32 rounded-xl p-3 flex flex-col justify-between shadow-inner overflow-hidden mb-4 border"
                    style={{
                      background: theme.canvasHex,
                      borderColor:
                        theme.id === 'black'
                          ? 'rgba(255,255,255,0.1)'
                          : theme.id === 'white'
                          ? 'rgba(0,0,0,0.15)'
                          : 'rgba(5,47,74,0.15)',
                    }}
                  >
                    {/* Mock Controller Header */}
                    <div className="flex items-center justify-between">
                      <div
                        className="h-2 w-16 rounded-full"
                        style={{ backgroundColor: theme.foregroundHex, opacity: 0.9 }}
                      />
                      <div className="flex gap-1.5 items-center">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.foregroundHex, opacity: 0.8 }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.foregroundHex, opacity: 0.4 }}
                        />
                      </div>
                    </div>

                    {/* Mock Floating Mini Video Card */}
                    <div
                      className="p-2 rounded-lg flex gap-2.5 items-center"
                      style={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${theme.foregroundHex}`,
                        opacity: 0.85,
                      }}
                    >
                      <div
                        className="w-10 h-6 rounded"
                        style={{ backgroundColor: theme.foregroundHex, opacity: 0.25 }}
                      />
                      <div className="flex flex-col gap-1 flex-1">
                        <div
                          className="h-2 w-24 rounded"
                          style={{ backgroundColor: theme.foregroundHex, opacity: 0.9 }}
                        />
                        <div
                          className="h-1.5 w-14 rounded"
                          style={{ backgroundColor: theme.foregroundHex, opacity: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Mock Orbital Nodes */}
                    <div className="flex items-center justify-center gap-2">
                      {[0.4, 0.7, 1.0, 0.8, 0.5].map((op, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: theme.foregroundHex,
                            opacity: op,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Description & Palette Indicator */}
                  <div className="flex flex-col gap-2.5">
                    <p className="text-xs text-white/70 leading-relaxed font-medium">
                      {theme.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Palette:</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ background: theme.canvasHex }}
                          title={`Canvas`}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: theme.foregroundHex }}
                          title={`Foreground: ${theme.foregroundHex}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
