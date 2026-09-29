import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutStore } from './store/layoutStore';
import { useConfigStore } from './store/configStore';
import WindowControls from './components/WindowControls';
import FullscreenVideoInfo from './components/FullscreenVideoInfo';

import './LayoutShell.css';

const DEFAULT_BANNER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23000000'/%3E%3Cpath d='M0 20 L20 0 L40 20 L20 40 Z' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E";

const LayoutShell = ({
  topController,
  mainPlayer,
  sideMenu,
  miniHeader,
  animatedMenu,
  spacerMenu,
  menuSpacerMenu,
  secondPlayer
}) => {

  const { viewMode, menuQuarterMode, showDebugBounds } = useLayoutStore();
  const {
    fullscreenBanner,
    splitscreenBanner,
    playerBorderPattern,
    fullscreenPlayerWidthPercent,
    bannerNavBannerId,
    bannerPresets
  } = useConfigStore();

  // Resolve Effective Banners (Normal vs Nav Mode)
  let effectiveLeftBanner = fullscreenBanner;
  let effectiveRightBanner = splitscreenBanner;

  // Only apply navigation override if a preset is selected AND we're not in the editor
  // We detect "in editor" by the presence of stashedBanners
  const stashedBanners = useConfigStore(state => state.stashedBanners);

  if (bannerNavBannerId && !stashedBanners) {
    const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
    if (preset) {
      if (preset.fullscreenBanner) effectiveLeftBanner = preset.fullscreenBanner;
      if (preset.splitscreenBanner) effectiveRightBanner = preset.splitscreenBanner;
    }
  }

  // Helper: Generate Banner Style
  const renderHalfBanner = (config, side) => {
    if (!config) return null;

    const {
      image: bannerImage,
      verticalPosition,
      scale,
      scrollEnabled,
      horizontalOffset,
      flipped
    } = config;

    const isGif = bannerImage?.startsWith('data:image/gif');

    return (
      <div
        key={`${side}-banner`}
        className="layout-shell__banner-bg"
        style={{
          backgroundImage: `url("${bannerImage || DEFAULT_BANNER_IMAGE}")`,
          ...(isGif || !scrollEnabled ? { animation: 'none' } : {}),
          backgroundPosition: `${horizontalOffset ?? 0}% ${verticalPosition ?? 0}%`,
          backgroundRepeat: bannerImage ? 'repeat-x' : 'repeat',
          backgroundSize: bannerImage ? `${(scale ?? 100) / 2}vw auto` : '40px 40px', // Maintain fixed pattern sizing for default grid
          height: '200px',
          width: '50vw',
          left: side === 'left' ? '0' : '50vw',
          zIndex: 15,
          pointerEvents: 'none',
          transform: flipped ? 'scaleX(-1)' : 'none'
        }}
      />
    );
  };

  return (
    <div className={`layout-shell layout-shell--${viewMode} ${menuQuarterMode ? 'layout-shell--menu-quarter' : ''} ${showDebugBounds ? 'layout-shell--debug' : ''}`}>
      {/* Fixed Player Controller - Always at top */}
      <div
        id="top-controller-anchor"
        className={`layout-shell__top-controller ${showDebugBounds ? 'debug-bounds debug-bounds--top-controller' : ''}`}
        data-debug-label="Top Controller"
        data-tauri-drag-region
      >
        {/* Dual Banner System: Left and Right halves */}
        {renderHalfBanner(effectiveLeftBanner, 'left')}
        {renderHalfBanner(effectiveRightBanner, 'right')}

        <WindowControls />

        {!showDebugBounds && (
          <div className="layout-shell__top-controller-wrapper">
            {topController || (
              <div className="placeholder placeholder--top-controller">
                <span className="placeholder__label">Top Controller</span>
                <span className="placeholder__subtitle">Orb Controller Slot</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Pattern Separator - Acts as top border for player/menu below */}
        <div className={`layout-shell__separator pattern-${playerBorderPattern || 'diagonal'}`} />
      </div>


      {/* Radial Menu - Positioned at top controller level, left side */}
      {animatedMenu && (
        <div style={{
          position: 'fixed',
          top: '0', // Start at top of screen
          left: '0',
          width: '50vw', // Left half of screen
          height: '200px', // Same height as top controller
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '20px',
          zIndex: 1001, // Above top controller (z-index 100)
          pointerEvents: 'auto'
        }}>
          {animatedMenu}
        </div>
      )}

      {/* Main Content Area */}
      <div
        className="layout-shell__content"
        style={
          viewMode === 'full' && fullscreenPlayerWidthPercent != null
            ? { '--fullscreen-player-width': `${Math.min(100, Math.max(20, fullscreenPlayerWidthPercent))}%` }
            : undefined
        }
      >

        {/* Empty Spacer - Only in Quarter mode for top-left empty space */}
        {viewMode === 'quarter' && (
          <div
            className={`layout-shell__spacer ${showDebugBounds ? 'debug-bounds debug-bounds--spacer' : ''}`}
            data-debug-label="Spacer"
            style={{
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {spacerMenu || (showDebugBounds && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '12px'
              }}>
                Spacer (no menu)
              </div>
            ))}
          </div>
        )}

        {/* Empty Spacer for Menu Quarter Mode - top-right empty space */}
        {menuQuarterMode && (
          <div
            className={`layout-shell__menu-spacer ${showDebugBounds ? 'debug-bounds debug-bounds--menu-spacer' : ''}`}
            data-debug-label="Menu Spacer"
            style={{
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {menuSpacerMenu || (showDebugBounds && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '12px'
              }}>
                Menu Spacer (no menu)
              </div>
            ))}
          </div>
        )}

        {/* Main Player Slot */}
        <div
          className={`layout-shell__player layout-shell__player--${viewMode} pattern-${playerBorderPattern || 'diagonal'} ${showDebugBounds ? 'debug-bounds debug-bounds--player' : ''}`}
          data-debug-label="Main Player"
          style={{ position: 'relative', overflow: showDebugBounds ? 'visible' : undefined }}
        >
          {!showDebugBounds && (
            <>
              {mainPlayer || (
                <div className="placeholder placeholder--player">
                  <span className="placeholder__label">Main Player</span>
                  <span className="placeholder__subtitle">{viewMode.toUpperCase()} View</span>
                </div>
              )}
            </>
          )}

          {/* Second Player - Bottom Left Quarter */}
          {((viewMode === 'full' || viewMode === 'half') || showDebugBounds) && (
            <div
              className={`layout-shell__second-player layout-shell__second-player--${viewMode} ${showDebugBounds ? 'debug-bounds debug-bounds--second-player' : ''}`}
              data-debug-label="Second Player"
              style={{
                position: 'absolute',
                bottom: '0px',
                left: '0px',
                right: 'auto',
                top: 'auto',
                width: '50%',
                height: '50%',
                zIndex: showDebugBounds ? 10000 : 10,
                ...(showDebugBounds && {
                  backgroundColor: 'rgba(251, 191, 36, 0.5)',
                  border: '6px solid #fbbf24'
                })
              }}
            >
              {showDebugBounds ? (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  zIndex: 1001
                }}>
                  Second Player (no content)
                </div>
              ) : (
                <>
                  {secondPlayer || (
                    <div className="placeholder placeholder--second-player">
                      <span className="placeholder__label">Second Player</span>
                      <span className="placeholder__subtitle">Bottom Left Quarter</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen only: video info panel in right margin (author, year, view count) */}
        {/* Side Menu - Only visible in half/quarter modes */}
        {/* Unified right column: crossfade between FullscreenVideoInfo and side menu for smoother transition */}
        <div className="layout-shell__right-column">
          <AnimatePresence mode="wait">
            {viewMode === 'full' && !showDebugBounds && (
              <motion.div
                key="fullscreen-video-info"
                className="layout-shell__fullscreen-video-info-mount"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FullscreenVideoInfo />
              </motion.div>
            )}
            {(viewMode === 'half' || viewMode === 'quarter') && (
              <motion.div
                key="side-menu"
                className="layout-shell__side-menu-mount"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
              >
                <div
                  className={`layout-shell__side-menu ${showDebugBounds ? 'debug-bounds debug-bounds--side-menu' : ''}`}
                  data-debug-label="Side Menu"
                >
                  {/* Mini Header Slot */}
                  <div
                    className={`layout-shell__mini-header ${showDebugBounds ? 'debug-bounds debug-bounds--mini-header' : ''}`}
                    data-debug-label="Mini Header"
                  >
                    {!showDebugBounds && (
                      <>
                        {miniHeader || (
                          <div className="placeholder placeholder--mini-header">
                            <span className="placeholder__label">Mini Header</span>
                            <span className="placeholder__subtitle">Navigation Bar</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Side Menu Content */}
                  <div
                    className={`layout-shell__side-menu-content ${showDebugBounds ? 'debug-bounds debug-bounds--side-menu-content' : ''}`}
                    data-debug-label="Side Menu Content"
                  >
                    {!showDebugBounds && (
                      sideMenu || (
                        <div className="placeholder placeholder--side-menu">
                          <span className="placeholder__label">Side Menu</span>
                          <span className="placeholder__subtitle">Playlists, File Nav, etc.</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LayoutShell;

