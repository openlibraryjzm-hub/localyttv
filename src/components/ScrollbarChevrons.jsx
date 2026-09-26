import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ScrollbarChevrons - Compact scroll navigation controls
 * 
 * Displays a tightly packed vertical strip with:
 * - Up chevron (double-click to scroll to top)
 * - Dot that tracks scroll position (aligned with scrollbar thumb)
 * - Down chevron (double-click to scroll to bottom)
 * 
 * Positioned to the left of the scrollbar.
 * 
 * @param {string} containerSelector - CSS selector for the scroll container to control
 * @param {number} scrollbarWidth - Width of the scrollbar (default: 10px to match App.css)
 */
const ScrollbarChevrons = ({ containerSelector = '.overflow-y-auto', scrollbarWidth = 10 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [containerRef, setContainerRef] = useState(null);
    const [position, setPosition] = useState({ top: 0, right: 0, height: 0 });
    const [thumbInfo, setThumbInfo] = useState({ thumbRatio: 0.5, thumbCenter: 0.5 }); // thumbCenter is 0-1 ratio
    const observerRef = useRef(null);
    const rafRef = useRef(null);

    // Find the scroll container
    const findContainer = useCallback(() => {
        const root = document.querySelector('.layout-shell__side-menu-content');
        if (!root) return null;
        return root.querySelector(containerSelector);
    }, [containerSelector]);

    // Check if container is scrollable
    const checkScrollability = useCallback((container) => {
        if (!container) return false;
        return container.scrollHeight > container.clientHeight;
    }, []);

    // Calculate scrollbar thumb position and size
    // Returns the center position of the thumb as a ratio (0 to 1)
    const calculateThumbInfo = useCallback((container) => {
        if (!container) return { thumbRatio: 0.5, thumbCenter: 0.5 };
        
        const viewportHeight = container.clientHeight;
        const contentHeight = container.scrollHeight;
        const scrollTop = container.scrollTop;
        
        if (contentHeight <= viewportHeight) {
            return { thumbRatio: 1, thumbCenter: 0.5 };
        }
        
        // Thumb size ratio (how much of the track the thumb takes up)
        const thumbRatio = viewportHeight / contentHeight;
        
        // Track length available for thumb movement (excluding thumb size)
        const trackLength = 1 - thumbRatio;
        
        // Scroll progress (0 to 1)
        const maxScroll = contentHeight - viewportHeight;
        const scrollProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;
        
        // Thumb top position as ratio (0 to trackLength)
        const thumbTop = scrollProgress * trackLength;
        
        // Thumb center position as ratio (0 to 1)
        const thumbCenter = thumbTop + (thumbRatio / 2);
        
        return { thumbRatio, thumbCenter };
    }, []);

    // Update position based on container's bounding rect
    const updatePosition = useCallback(() => {
        const container = findContainer();
        if (!container) return;

        const rect = container.getBoundingClientRect();
        setPosition({
            top: rect.top,
            right: window.innerWidth - rect.right,
            height: rect.height,
        });
        setThumbInfo(calculateThumbInfo(container));
    }, [findContainer, calculateThumbInfo]);

    // Find and observe the scroll container
    useEffect(() => {
        const updateVisibility = () => {
            const container = findContainer();
            setContainerRef(container);
            const scrollable = checkScrollability(container);
            setIsVisible(scrollable);
            if (scrollable) {
                updatePosition();
            }
        };

        // Initial check
        updateVisibility();

        // Set up mutation observer to detect DOM changes
        observerRef.current = new MutationObserver(() => {
            updateVisibility();
        });

        const root = document.querySelector('.layout-shell__side-menu-content');
        if (root) {
            observerRef.current.observe(root, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }

        // Listen for resize and scroll events
        const handleUpdate = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                updateVisibility();
            });
        };

        // Listen specifically for scroll on the container
        const handleScroll = () => {
            const container = findContainer();
            if (container) {
                setThumbInfo(calculateThumbInfo(container));
            }
        };

        window.addEventListener('resize', handleUpdate);
        
        // Attach scroll listener to the container when found
        const container = findContainer();
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }

        // Poll for container changes
        const pollInterval = setInterval(() => {
            updateVisibility();
            // Re-attach scroll listener if container changed
            const newContainer = findContainer();
            if (newContainer && newContainer !== container) {
                if (container) container.removeEventListener('scroll', handleScroll);
                newContainer.addEventListener('scroll', handleScroll, { passive: true });
            }
        }, 500);

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', handleUpdate);
            const currentContainer = findContainer();
            if (currentContainer) currentContainer.removeEventListener('scroll', handleScroll);
            clearInterval(pollInterval);
        };
    }, [containerSelector, findContainer, checkScrollability, updatePosition, calculateThumbInfo]);

    const scrollToTop = () => {
        if (containerRef) {
            containerRef.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const scrollToBottom = () => {
        if (containerRef) {
            containerRef.scrollTo({ top: containerRef.scrollHeight, behavior: 'smooth' });
        }
    };

    if (!isVisible) return null;

    // Sizing
    const controlWidth = 18;
    const buttonSize = 14;
    const chevronSize = 10;
    const dotSize = 6;
    const gapFromScrollbar = -4; // Tight positioning next to scrollbar
    const chevronDotGap = 4; // Tight gap between chevrons and dot
    
    // Calculate compact group dimensions
    // Group: [chevron] - 4px - [dot] - 4px - [chevron]
    const groupHeight = (buttonSize * 2) + (chevronDotGap * 2) + dotSize;
    
    // Calculate where the scrollbar thumb center is in pixels
    const thumbCenterY = thumbInfo.thumbCenter * position.height;
    
    // Position the group so the dot (center of group) aligns with thumb center
    const groupTopY = thumbCenterY - (groupHeight / 2);
    
    // Clamp so the group stays within the container bounds
    const clampedGroupTop = Math.max(0, Math.min(position.height - groupHeight, groupTopY));

    return createPortal(
        <div 
            className="scrollbar-chevrons"
            style={{
                position: 'fixed',
                top: `${position.top + clampedGroupTop}px`,
                right: `${position.right + scrollbarWidth + gapFromScrollbar}px`,
                height: `${groupHeight}px`,
                width: `${controlWidth}px`,
                pointerEvents: 'none',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: `${chevronDotGap}px`,
                transition: 'top 0.1s ease-out',
            }}
        >
            {/* Top Chevron - Scroll to Top */}
            <button
                className="scrollbar-chevron scrollbar-chevron--up"
                onDoubleClick={scrollToTop}
                title="Double-click to scroll to top"
                style={{
                    width: `${buttonSize}px`,
                    height: `${buttonSize}px`,
                    padding: 0,
                    border: 'none',
                    background: 'rgba(5, 47, 74, 0.5)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                }}
            >
                <svg 
                    width={chevronSize} 
                    height={chevronSize} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="rgba(224, 242, 254, 0.9)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </button>

            {/* Dot - tracks scrollbar thumb center */}
            <div
                className="scrollbar-chevrons__dot"
                style={{
                    width: `${dotSize}px`,
                    height: `${dotSize}px`,
                    background: 'rgba(59, 130, 246, 0.8)',
                    borderRadius: '50%',
                    boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)',
                    flexShrink: 0,
                }}
            />

            {/* Bottom Chevron - Scroll to Bottom */}
            <button
                className="scrollbar-chevron scrollbar-chevron--down"
                onDoubleClick={scrollToBottom}
                title="Double-click to scroll to bottom"
                style={{
                    width: `${buttonSize}px`,
                    height: `${buttonSize}px`,
                    padding: 0,
                    border: 'none',
                    background: 'rgba(5, 47, 74, 0.5)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                }}
            >
                <svg 
                    width={chevronSize} 
                    height={chevronSize} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="rgba(224, 242, 254, 0.9)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
        </div>,
        document.body
    );
};

export default ScrollbarChevrons;
