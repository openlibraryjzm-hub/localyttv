import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { saveImageToCache } from '../api/platformBridge';

const EditPlaylistModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [customAscii, setCustomAscii] = useState('');

    // Page Banner State
    const [bannerImage, setBannerImage] = useState(null);
    const [bannerScale, setBannerScale] = useState(100);
    const [bannerXOffset, setBannerXOffset] = useState(50);
    const [bannerYOffset, setBannerYOffset] = useState(50);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setCustomAscii(initialData.customAscii || '');

            // Initialize banner settings
            setBannerImage(initialData.bannerImage || null);
            setBannerScale(initialData.bannerScale ?? 100);
            setBannerXOffset(initialData.bannerXOffset ?? 50);
            setBannerYOffset(initialData.bannerYOffset ?? 50);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const cachedUrl = await saveImageToCache(reader.result, 'banner');
                setBannerImage(cachedUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBanner = () => {
        setBannerImage(null);
        setBannerScale(100);
        setBannerXOffset(50);
        setBannerYOffset(50);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            await onSave({
                name,
                description,
                customAscii,
                bannerImage,
                bannerScale,
                bannerXOffset,
                bannerYOffset
            });
            onClose();
        } catch (error) {
            console.error('Failed to update playlist:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[50vw] z-[10000] flex items-end justify-end p-8 bg-transparent pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100 max-h-[80vh] flex flex-col pointer-events-auto ring-1 ring-black/5">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">Edit Details</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                            placeholder="Name"
                            autoFocus
                        />
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-white shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit} // Bind click to submit handler as it's outside form
                        disabled={isSaving || !name.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPlaylistModal;
