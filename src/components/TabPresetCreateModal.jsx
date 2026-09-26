import React, { useState } from 'react';
import { useTabStore } from '../store/tabStore';
import { useTabPresetStore } from '../store/tabPresetStore';

const TabPresetCreateModal = ({ onClose }) => {
    const { createPreset } = useTabPresetStore();
    const { tabs } = useTabStore();
    const [newPresetName, setNewPresetName] = useState('');
    const [selectedTabIds, setSelectedTabIds] = useState(new Set());

    const handleCreatePreset = () => {
        if (newPresetName.trim() && selectedTabIds.size > 0) {
            createPreset(newPresetName.trim(), Array.from(selectedTabIds));
            onClose();
        }
    };

    const handleToggleTab = (tabId) => {
        setSelectedTabIds(prev => {
            const updated = new Set(prev);
            if (updated.has(tabId)) {
                updated.delete(tabId);
            } else {
                updated.add(tabId);
            }
            return updated;
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-white mb-4">
                    Create Preset
                </h3>

                {/* Preset Name Input */}
                <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Preset name"
                    className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 mb-4"
                    autoFocus
                />

                {/* Tab Selection */}
                <div className="flex-1 overflow-y-auto mb-4">
                    <p className="text-slate-400 text-sm mb-2">Select tabs to include:</p>
                    <div className="space-y-2">
                        {tabs.filter(tab => tab.id !== 'all').map((tab) => {
                            const isSelected = selectedTabIds.has(tab.id);
                            return (
                                <div
                                    key={tab.id}
                                    onClick={() => handleToggleTab(tab.id)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                                        ? 'bg-sky-600/20 border border-sky-500'
                                        : 'bg-slate-700 hover:bg-slate-600 border border-transparent'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                        ? 'bg-sky-500 border-sky-500'
                                        : 'border-slate-500'
                                        }`}>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-white text-sm">{tab.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreatePreset}
                        disabled={!newPresetName.trim() || selectedTabIds.size === 0}
                        className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TabPresetCreateModal;
