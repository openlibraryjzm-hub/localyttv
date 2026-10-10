import React, { useState } from 'react';
import { Heart } from 'lucide-react';

/**
 * DrumstickRating Component (Heart Rating UI)
 * 
 * A hoverable rating component that displays 1-5 heart icons.
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
            className="flex items-center gap-0.5 cursor-default select-none"
            onMouseLeave={() => setHoverRating(0)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
        >
            {[1, 2, 3, 4, 5].map((heart) => (
                <button
                    key={heart}
                    type="button"
                    onClick={() => handleClick(heart)}
                    onMouseEnter={() => !disabled && setHoverRating(heart)}
                    disabled={disabled}
                    className={`
                        transition-all duration-150 p-0.5
                        ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                    `}
                    title={heart === rating ? 'Click to set No Rating (clear rating)' : `Rate ${heart} heart${heart > 1 ? 's' : ''}`}
                >
                    <Heart
                        size={16}
                        className={`
                            ${heart <= displayRating 
                                ? 'text-rose-500 fill-rose-500 opacity-100' 
                                : 'text-gray-400 fill-transparent opacity-40 hover:opacity-70'}
                            transition-colors duration-150
                        `}
                    />
                </button>
            ))}
        </div>
    );
};

export default DrumstickRating;
