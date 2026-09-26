import React from 'react';

/**
 * Card thumbnail component with consistent styling and error handling
 */
const CardThumbnail = ({
  src,
  alt,
  fallbackIcon,
  overlay,
  badges = [], // Array of { component, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }
  className = '',
  progress = 0, // 0 to 100
  transparentPortrait = false, // Added prop for transparent portrait backgrounds
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [isPortrait, setIsPortrait] = React.useState(false);
  const hasCheckedRef = React.useRef(false);

  // Reset checked flag if the src changes (e.g. card is recycled/re-used)
  React.useEffect(() => {
    hasCheckedRef.current = false;
  }, [src]);

  const handleImageLoad = (e) => {
    if (hasCheckedRef.current) return;
    const { naturalWidth, naturalHeight } = e.target;
    hasCheckedRef.current = true;
    if (naturalWidth && naturalHeight && naturalHeight > naturalWidth) {
      setIsPortrait(true);
    }
  };

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        overflow: 'hidden'
      }}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: isPortrait ? 'contain' : 'cover',
            backgroundColor: isPortrait && !transparentPortrait ? '#000000' : 'transparent',
            display: 'block'
          }}
          onLoad={handleImageLoad}
          onError={() => setImageError(true)}
        />
      ) : (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {fallbackIcon || (
            <svg
              className="w-12 h-12 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </div>
      )}

      {/* Badges positioned around thumbnail */}
      {badges.map((badge, index) => (
        <div
          key={index}
          className={`absolute z-10 ${positionClasses[badge.position] || 'top-2 right-2'}`}
          data-card-action="true"
          style={{ position: 'absolute' }}
        >
          {badge.component}
        </div>
      ))}

      {/* Overlay (e.g., play button on hover) */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
          className="group-hover:bg-black/40"
        >
          {overlay}
        </div>
      )}
      {/* Progress Bar */}
      {progress > 0 && (
        <div
          className="absolute left-0 w-full z-[5] bottom-0"
          style={{
            height: '4px',
            backgroundColor: 'rgba(0,0,0,0.3)', // Subtle track
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              height: '100%',
              backgroundColor: '#ef4444', // Red-500
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CardThumbnail;

