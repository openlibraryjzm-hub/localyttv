
export const THEMES = {
    blue: {
        name: 'Cool Blue',
        bg: 'from-sky-400 via-sky-200 to-sky-100',
        menuBg: 'bg-sky-100/95',
        menuBorder: 'border-sky-400/40',
        tabActive: 'bg-white text-sky-600',
        tabInactive: 'bg-sky-200 text-sky-700 border-sky-300',
        accent: 'text-sky-700',
        accentBg: 'bg-sky-600',
        orbBorder: 'border-sky-500',
        bottomBar: 'bg-sky-200/60 border-sky-300'
    },
    midnight: {
        name: 'Midnight',
        bg: 'from-slate-950 via-slate-900 to-black',
        menuBg: 'bg-slate-900/90',
        menuBorder: 'border-slate-700',
        tabActive: 'bg-white text-slate-900',
        tabInactive: 'bg-slate-800 text-slate-500 border-slate-700',
        accent: 'text-sky-400',
        accentBg: 'bg-sky-500',
        orbBorder: 'border-slate-700',
        bottomBar: 'bg-slate-800/50 border-slate-700'
    }
};

/**
 * Convert color (hex, rgb, array) to rgba string with custom alpha
 */
export const hexToRgba = (color, alpha = 1.0) => {
    if (!color) return `rgba(255, 255, 255, ${alpha})`;
    if (Array.isArray(color)) {
        const [r, g, b] = color;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    const clean = String(color).trim().toLowerCase().replace('#', '');
    if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16);
        const g = parseInt(clean[1] + clean[1], 16);
        const b = parseInt(clean[2] + clean[2], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (clean.length === 6) {
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (clean.startsWith('rgb')) {
        const parts = clean.match(/\d+/g);
        if (parts && parts.length >= 3) {
            return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
        }
    }
    return color;
};

/**
 * Checks if color is pure white or near white
 */
export const isWhiteColor = (color) => {
    if (!color) return true;
    if (Array.isArray(color)) {
        return color[0] >= 240 && color[1] >= 240 && color[2] >= 240;
    }
    const clean = String(color).trim().toLowerCase().replace('#', '');
    if (clean === 'fff' || clean === 'ffffff') return true;
    if (clean.startsWith('rgb')) {
        const parts = clean.match(/\d+/g);
        if (parts && parts.length >= 3) {
            return parseInt(parts[0]) >= 240 && parseInt(parts[1]) >= 240 && parseInt(parts[2]) >= 240;
        }
    }
    return false;
};

/**
 * Checks if color is pure black or near black
 */
export const isBlackColor = (color) => {
    if (!color) return false;
    if (Array.isArray(color)) {
        return color[0] <= 30 && color[1] <= 30 && color[2] <= 30;
    }
    const clean = String(color).trim().toLowerCase().replace('#', '');
    if (clean === '000' || clean === '000000') return true;
    if (clean.startsWith('rgb')) {
        const parts = clean.match(/\d+/g);
        if (parts && parts.length >= 3) {
            return parseInt(parts[0]) <= 30 && parseInt(parts[1]) <= 30 && parseInt(parts[2]) <= 30;
        }
    }
    return false;
};

/**
 * Returns static duo-tone gradient styling for the top controller menu titles.
 * High-Contrast Duo-Tone Gradient:
 * - No animation: static, calm, elegant.
 * - Gradient spreads smoothly across the entire title text.
 * - Blends between the theme's high-contrast readable base (white on OLED black, black on pure white, deep sapphire on sky)
 *   and the active visualizer accent color.
 */
export const getGradientTitleStyle = (color, theme = 'black') => {
    const resolvedColor = color || '#ffffff';
    const isWhite = isWhiteColor(resolvedColor);
    const isBlack = isBlackColor(resolvedColor);

    let readableColor = '#ffffff';
    if (theme === 'white') {
        readableColor = '#000000';
    } else if (theme === 'sky') {
        readableColor = '#031b2e';
    }

    // If default monochrome (white visualizer on black, or black visualizer on white)
    if (isWhite || (theme === 'white' && isBlack)) {
        return {
            color: readableColor,
            WebkitTextFillColor: readableColor,
            backgroundImage: 'none',
            WebkitBackgroundClip: 'unset',
            backgroundClip: 'unset',
        };
    }

    // Simple Left-to-Right Duo-Tone Gradient across the entire title text
    return {
        backgroundImage: `linear-gradient(90deg, ${readableColor} 0%, ${resolvedColor} 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    };
};

export const getConductionStyle = getGradientTitleStyle;
export const getNeonTitleStyle = getGradientTitleStyle;
