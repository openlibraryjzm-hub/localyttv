import React, { useState } from 'react';

/**
 * DrumstickRating Component
 * 
 * A hoverable rating component that displays 1-5 drumstick icons.
 * Users can click to rate, and the rating persists.
 * 
 * @param {number} rating - Current rating (0-5, where 0 is unrated)
 * @param {function} onRate - Callback function when user selects a rating
 * @param {boolean} disabled - Whether the rating is disabled
 */
const DrumstickRating = ({ rating = 0, onRate, disabled = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (newRating) => {
        if (!disabled && onRate) {
            // If clicking the same rating, unrate (set to 0)
            onRate(newRating === rating ? 0 : newRating);
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <div
            className="flex items-center gap-0.5 cursor-default"
            onMouseLeave={() => setHoverRating(0)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
        >
            {[1, 2, 3, 4, 5].map((drumstick) => (
                <button
                    key={drumstick}
                    onClick={() => handleClick(drumstick)}
                    onMouseEnter={() => !disabled && setHoverRating(drumstick)}
                    disabled={disabled}
                    className={`
            transition-all duration-150
            ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            ${drumstick <= displayRating ? 'opacity-100' : 'opacity-30'}
          `}
                    title={`Rate ${drumstick} drumstick${drumstick > 1 ? 's' : ''}`}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={`
              ${drumstick <= displayRating ? 'text-amber-500' : 'text-gray-400'}
              transition-colors duration-150
            `}
                    >
                        {/* Drumstick icon - simplified chicken leg shape */}
                        <path d="M18 8c0-2.21-1.79-4-4-4s-4 1.79-4 4c0 1.2.54 2.27 1.38 3L9 15c-.55 1.65-.9 3.35-.9 5.1 0 .5.4.9.9.9h6c.5 0 .9-.4.9-.9 0-1.75-.35-3.45-.9-5.1l-2.38-4c.84-.73 1.38-1.8 1.38-3zm-4-2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

export default DrumstickRating;
