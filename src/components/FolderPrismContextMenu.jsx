import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Maximize2, Minimize2, Edit2 } from 'lucide-react';

const FolderPrismContextMenu = ({
    isOpen,
    position,
    onClose,
    prismOnlyPopulated,
    setPrismOnlyPopulated,
    onRenameClick,
    clickedSegmentLabel,
    showRenameOption = true
}) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', handleClickOutside, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleClickOutside, true);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Ensure menu doesn't clip off the right or bottom of viewport
    let top = position.top;
    let left = position.left;
    const menuWidth = 240;
    if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
    }
    // Approximate height: multiple options + padding
    const menuHeight = 110;
    if (top + menuHeight > window.innerHeight - 8) {
        top = window.innerHeight - menuHeight - 8;
    }

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9998] flex flex-col bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
            style={{
                top: top,
                left: left,
                width: menuWidth,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="py-1.5 flex flex-col gap-0.5">
                {showRenameOption && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRenameClick();
                                onClose();
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-black/5 hover:text-black transition-colors"
                        >
                            <span className="text-slate-500 shrink-0">
                                <Edit2 size={14} strokeWidth={2.5} />
                            </span>
                            <span className="truncate">
                                Edit / Rename {clickedSegmentLabel ? clickedSegmentLabel : '...'}
                            </span>
                        </button>
                        <div className="h-px bg-black/10 mx-3 my-0.5" />
                    </>
                )}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setPrismOnlyPopulated(!prismOnlyPopulated);
                        onClose();
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-black/5 hover:text-black transition-colors"
                    title={prismOnlyPopulated ? 'Expand to show all colored folders' : 'Collapse to populated folders only'}
                >
                    <span className="text-slate-500 shrink-0">
                        {prismOnlyPopulated ? <Maximize2 size={14} strokeWidth={2.5} /> : <Minimize2 size={14} strokeWidth={2.5} />}
                    </span>
                    <span className="truncate">
                        {prismOnlyPopulated ? 'Expand to show all colored folders' : 'Show only populated folders'}
                    </span>
                </button>
            </div>
        </div>,
        document.body
    );
};

export default FolderPrismContextMenu;
