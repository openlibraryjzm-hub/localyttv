import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical, Trash2, FolderInput, PlaySquare, ArrowRightLeft, Star } from 'lucide-react'; // Import icons

const ModernVideoMenu = ({ options, onOptionClick, triggerClassName = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    // Toggle menu and calculate position
    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position bottom-right aligned with the button, but popping UP if close to bottom?
            // For now, let's try standard bottom-right alignment, but "drop up" if at bottom of screen.

            const windowHeight = window.innerHeight;
            const spaceBelow = windowHeight - rect.bottom;
            const menuHeight = 250; // Approx max height

            let top = rect.bottom + 8;
            const left = rect.right - 220; // Align right edge, width 220px

            // If close to bottom, align top to button top - menuHeight (drop up)
            if (spaceBelow < menuHeight) {
                top = rect.top - 8 - menuHeight; // This is a rough guess, ideally we measure the menu. 
                // Better strategy: dynamic positioning after render. But for now, let's stick to a safe default or simple logic.
                // Let's just strictly use bottom alignment for now unless extremely low.
            }

            // Simple fixed positioning
            setPosition({
                top: rect.bottom + 8,
                left: rect.right - 220 // Width of menu
            });
            setIsOpen(true);
        }
    };

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Handle scroll to close to avoid floating menu
            document.addEventListener('scroll', handleClickOutside, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleClickOutside, true);
        };
    }, [isOpen]);

    // Adjust position if off-screen (basic)
    useEffect(() => {
        if (isOpen && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // If menu goes off bottom, flip it upwards
            if (rect.bottom > viewportHeight - 20) {
                setPosition(prev => ({
                    ...prev,
                    top: prev.top - rect.height - 40 // Move above button
                }));
            }
        }
    }, [isOpen]);

    const handleItemClick = (e, option) => {
        e.stopPropagation();
        if (onOptionClick) {
            onOptionClick(option);
        }
        setIsOpen(false);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`p-2 rounded-full hover:bg-black/50 text-white/90 transition-all backdrop-blur-sm ${triggerClassName} ${isOpen ? 'bg-black/60 text-white' : ''}`}
                title="More options"
                data-card-action="true"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && ReactDOM.createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[9999] w-56 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right ring-1 ring-black/5"
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.map((option, index) => {
                        // Skip if no label (separator or bad data)
                        if (!option.label) return null;

                        return (
                            <button
                                key={index}
                                onClick={(e) => handleItemClick(e, option)}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors group
                    ${option.danger
                                        ? 'text-red-400 hover:bg-red-500/10'
                                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                                    }
                    ${index !== options.length - 1 ? 'border-b border-white/5' : ''}
                `}
                            >
                                <span className={`opacity-70 group-hover:opacity-100 transition-opacity ${option.danger ? 'text-red-400' : 'text-slate-400 group-hover:text-white'}`}>
                                    {option.icon ? option.icon : <div className="w-4 h-4" />}
                                </span>
                                <span className="font-medium">{option.label}</span>
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
};

export default ModernVideoMenu;
