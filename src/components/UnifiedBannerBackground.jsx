import React from 'react';

/**
 * A GPU-accelerated background layer for the Unified Banner system.
 * Uses transform: translate3d for smooth 60fps scrolling without main-thread jank.
 * 
 * Supports two layered images for creative banner designs.
 * 
 * @param {string} image - The background image URL (Layer 1)
 * @param {string} bgSize - The background-size property (e.g., '100% auto')
 * @param {number|string} yOffset - The vertical offset for stitching ('top', 'center', or negative px value)
 * @param {boolean} isGif - If true, disables animation
 * @param {boolean} scrollEnabled - If false, disables scrolling animation (defaults to true)
 * @param {number} imageScale - Scale percentage for Layer 1 (100 = 100%, 150 = 150%, etc.)
 * @param {number} imageXOffset - X position percentage for Layer 1 (0 = left, 50 = center, 100 = right)
 * @param {number} imageYOffset - Y position percentage for Layer 1 (0 = top, 50 = center, 100 = bottom)
 * @param {string} image2 - Second image URL (Layer 2, rendered on top)
 * @param {number} image2Scale - Scale percentage for Layer 2
 * @param {number} image2XOffset - X position percentage for Layer 2
 * @param {number} image2YOffset - Y position percentage for Layer 2
 */
const UnifiedBannerBackground = ({ 
    image, 
    bgSize, 
    yOffset, 
    isGif = false, 
    scrollEnabled = true, 
    imageScale = 100, 
    imageXOffset = 50, 
    imageYOffset = 50,
    image2 = null,
    image2Scale = 100,
    image2XOffset = 50,
    image2YOffset = 50
}) => {
    if (!image && !image2) return null;

    // Layer 1 styles
    const scaledSize = `auto ${imageScale}%`;
    const xPosition = `${imageXOffset}%`;
    const yPosition = `${imageYOffset}%`;

    const backgroundStyle = image ? {
        backgroundImage: `url(${image})`,
        backgroundSize: scaledSize,
        backgroundPositionX: 'left',
        backgroundPositionY: yPosition,
        backgroundRepeat: 'repeat-x',
    } : {};

    // Layer 2 styles
    const scaledSize2 = `auto ${image2Scale}%`;
    const xPosition2 = `${image2XOffset}%`;
    const yPosition2 = `${image2YOffset}%`;

    const backgroundStyle2 = image2 ? {
        backgroundImage: `url(${image2})`,
        backgroundSize: scaledSize2,
        backgroundPositionX: xPosition2,
        backgroundPositionY: yPosition2,
        backgroundRepeat: 'no-repeat',
    } : {};

    // Disable animation for GIFs or when scrollEnabled is false
    if (isGif || !scrollEnabled) {
        return (
            <>
                {/* Layer 1 */}
                {image && (
                    <div
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            ...backgroundStyle,
                            backgroundPositionX: xPosition,
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                )}
                {/* Layer 2 (on top) */}
                {image2 && (
                    <div
                        className="absolute inset-0 z-[1] pointer-events-none"
                        style={backgroundStyle2}
                    />
                )}
            </>
        );
    }

    return (
        <>
            {/* Layer 1 - Animated */}
            {image && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-0 left-0 h-full w-[200%] flex animate-gpu-scroll">
                        <div className="w-1/2 h-full" style={backgroundStyle} />
                        <div className="w-1/2 h-full" style={backgroundStyle} />
                    </div>
                </div>
            )}
            {/* Layer 2 - Static overlay (on top) */}
            {image2 && (
                <div
                    className="absolute inset-0 z-[1] pointer-events-none"
                    style={backgroundStyle2}
                />
            )}
        </>
    );
};

export default React.memo(UnifiedBannerBackground);
