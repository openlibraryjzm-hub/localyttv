import React, { useMemo, useState, useRef, useEffect } from 'react';
import { usePinsPageChecklistStore } from '../store/pinsPageChecklistStore';
import { useNavigationStore } from '../store/navigationStore';
import { Circle, CheckCircle, Plus, MoreVertical, Pencil, Trash2, Copy, ChevronLeft } from 'lucide-react';

const formatDate = (timestamp) => {
    const date = timestamp ? new Date(timestamp) : new Date();
    if (isNaN(date.getTime())) return formatDate(Date.now());
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const suffix = (d) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };
    return `${day}${suffix(day)} ${month}, ${year}`;
};

const TasksPage = () => {
    const { items: checklistItems, addItem, toggleChecked, removeItem, setItemText } = usePinsPageChecklistStore();
    const { setCurrentPage } = useNavigationStore();
    const [newChecklistText, setNewChecklistText] = useState('');
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState('');
    const menuRef = useRef(null);
    const editInputRef = useRef(null);

    const groupedChecklist = useMemo(() => {
        if (!checklistItems?.length) return {};
        const groups = {};
        const sorted = [...checklistItems].sort((a, b) => b.createdAt - a.createdAt);
        sorted.forEach((item) => {
            const dateStr = formatDate(item.createdAt);
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(item);
        });
        return groups;
    }, [checklistItems]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (editingId && editInputRef.current) editInputRef.current.focus();
    }, [editingId]);

    const handleAddChecklistItem = () => {
        addItem(newChecklistText);
        setNewChecklistText('');
    };

    const startEdit = (item) => {
        setMenuOpenId(null);
        setEditingId(item.id);
        setEditDraft(item.text);
    };

    const saveEdit = (id) => {
        const trimmed = editDraft.trim();
        if (trimmed) setItemText(id, trimmed);
        setEditingId(null);
        setEditDraft('');
    };

    const handleDelete = (id) => {
        setMenuOpenId(null);
        removeItem(id);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).catch(() => {});
    };

    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="flex flex-col gap-6 max-w-2xl">
                    <div className="flex items-center gap-3 border-b border-black/10 pb-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage('pins')}
                            className="flex items-center gap-1.5 text-[#052F4A] hover:text-amber-600 font-medium transition-colors"
                        >
                            <ChevronLeft size={20} />
                            Back to Pins
                        </button>
                    </div>
                    <div className="flex items-center gap-3 border-b border-black/10 pb-2">
                        <h2 className="text-xl font-bold text-[#052F4A]">Tasks</h2>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newChecklistText}
                            onChange={(e) => setNewChecklistText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                            placeholder="Add a task..."
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white/80 text-[#052F4A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                        <button
                            type="button"
                            onClick={handleAddChecklistItem}
                            disabled={!newChecklistText.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/20 text-[#052F4A] hover:bg-amber-500/30 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </div>

                    {Object.keys(groupedChecklist).length === 0 ? (
                        <p className="text-slate-500 text-sm">No tasks yet. Add one above.</p>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {Object.entries(groupedChecklist).map(([date, items]) => (
                                <div key={`checklist-${date}`} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 border-b border-black/10 pb-1.5">
                                        <h3 className="text-lg font-bold text-[#052F4A]">{date}</h3>
                                        <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                                            {items.length}
                                        </span>
                                    </div>
                                    <ul className="list-none space-y-1.5 pl-0">
                                        {items.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex items-center gap-3 group py-1.5 px-2 rounded hover:bg-white/5 min-h-[40px]"
                                            >
                                                {editingId === item.id ? (
                                                    <input
                                                        ref={editInputRef}
                                                        type="text"
                                                        value={editDraft}
                                                        onChange={(e) => setEditDraft(e.target.value)}
                                                        onBlur={() => saveEdit(item.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveEdit(item.id);
                                                            if (e.key === 'Escape') {
                                                                setEditingId(null);
                                                                setEditDraft(item.text);
                                                            }
                                                        }}
                                                        className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-300 bg-white text-[#052F4A] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                                    />
                                                ) : (
                                                    <span
                                                        className={`flex-1 min-w-0 text-[#052F4A] ${item.checked ? 'line-through opacity-70' : ''}`}
                                                    >
                                                        {item.text}
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleChecked(item.id)}
                                                        className="p-0.5 rounded text-slate-500 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                                        aria-label={item.checked ? 'Uncheck' : 'Mark done'}
                                                    >
                                                        {item.checked ? (
                                                            <CheckCircle size={22} className="text-amber-600" strokeWidth={2} />
                                                        ) : (
                                                            <Circle size={22} className="border-2 border-current" />
                                                        )}
                                                    </button>
                                                    <div className="relative" ref={menuOpenId === item.id ? menuRef : null}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
                                                            className="p-1 rounded text-slate-500 hover:text-[#052F4A] hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                                            aria-label="Options"
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>
                                                        {menuOpenId === item.id && (
                                                            <div className="absolute right-0 top-full mt-1 py-1 min-w-[120px] rounded-lg bg-white border border-slate-200 shadow-lg z-50">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEdit(item)}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#052F4A] hover:bg-slate-100"
                                                                >
                                                                    <Pencil size={14} />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { copyToClipboard(item.text); setMenuOpenId(null); }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#052F4A] hover:bg-slate-100"
                                                                >
                                                                    <Copy size={14} />
                                                                    Copy
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 size={14} />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TasksPage;
