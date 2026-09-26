import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { useNavigationStore } from '../store/navigationStore';
import { Plus, LayoutGrid, Check, X } from 'lucide-react';
import GroupCard from './GroupCard';
import PageBanner from './PageBanner';
import { useConfigStore } from '../store/configStore';
import { getAllPlaylists } from '../api/playlistApi';

const GroupsPage = ({ onVideoSelect }) => {
    const { groups, createGroup, deleteGroup, updateGroup } = useGroupStore();
    const { setCurrentPage } = useNavigationStore();
    const { customPageBannerImage, bannerHeight, bannerBgSize } = useConfigStore();

    const [showUploader, setShowUploader] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [editingGroup, setEditingGroup] = useState(null);

    // Basic states
    const [loading, setLoading] = useState(true);
    const [allPlaylistsCache, setAllPlaylistsCache] = useState([]);

    useEffect(() => {
        // Just a small fake load to show transition
        const cachePlaylists = async () => {
            setLoading(true);
            try {
                const playlists = await getAllPlaylists();
                setAllPlaylistsCache(playlists);
            } catch (err) {
                console.error("Failed to fetch playlists for GroupsPage", err);
            }
            setTimeout(() => setLoading(false), 300);
        };
        cachePlaylists();
    }, [groups]); // Recache lightly if needed, but groups change won't affect playlist metadata mostly

    const handleGroupClick = (group) => {
        // If they click a group, maybe we want to filter playlists by this group?
        // The requirement says "groups hold playlists, just as playlists hold videos"
        // Currently, there's no native "Group contents view". We can just act like a Tab and filter Playlists page maybe?
        // Actually, maybe we can implement a "GroupDetail" view or just route to `playlists` but with active tab = group?
        // For experimental testing, let's just log it or route them to a specific group view. 
        // Since we don't have a specific group display yet, let's log.
        console.log("Clicked group", group);
    };

    const handleEditClick = (group) => {
        setEditingGroup(group);
        setNewGroupName(group.name);
        setNewGroupDesc(group.description || '');
        setShowUploader(true);
    };

    const handleDeleteClick = (group) => {
        if (window.confirm(`Are you sure you want to delete group "${group.name}"?`)) {
            deleteGroup(group.id);
        }
    };

    const handleCreateOrUpdate = (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        if (editingGroup) {
            updateGroup(editingGroup.id, { name: newGroupName, description: newGroupDesc });
        } else {
            createGroup(newGroupName, newGroupDesc);
        }

        setShowUploader(false);
        setEditingGroup(null);
        setNewGroupName('');
        setNewGroupDesc('');
    };

    return (
        <div className="flex-1 overflow-y-auto page-transition custom-scrollbar relative pl-0 pt-[112px]">
            <PageBanner
                title="Groups"
                subtitle="Organize your playlists into custom collections"
                icon={<LayoutGrid className="w-8 h-8 opacity-80" />}
                customImage={customPageBannerImage?.groups}
                height={bannerHeight}
                bgSize={bannerBgSize}
            />

            <div className="max-w-[2000px] mx-auto p-8 pt-4 pb-24">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="font-medium text-white">{groups.length}</span> Groups
                    </div>

                    <button
                        onClick={() => {
                            setEditingGroup(null);
                            setNewGroupName('');
                            setNewGroupDesc('');
                            setShowUploader(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} />
                        Create Group
                    </button>
                </div>

                {/* Create/Edit Modal */}
                {showUploader && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                                <h2 className="text-xl font-bold text-white">
                                    {editingGroup ? 'Edit Group' : 'Create New Group'}
                                </h2>
                                <button onClick={() => setShowUploader(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateOrUpdate} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Group Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            placeholder="e.g. Action Movies"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                                        <textarea
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-24"
                                            placeholder="What is this group for?"
                                            value={newGroupDesc}
                                            onChange={(e) => setNewGroupDesc(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowUploader(false)}
                                        className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newGroupName.trim()}
                                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors font-medium shadow-lg shadow-blue-500/20"
                                    >
                                        <Check size={18} />
                                        {editingGroup ? 'Save Changes' : 'Create Group'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Groups Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                            <p>Loading groups...</p>
                        </div>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                        <LayoutGrid size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-slate-400">No groups yet</p>
                        <p className="text-sm mt-1">Create a group to organize your playlists.</p>
                        <button
                            onClick={() => setShowUploader(true)}
                            className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-sm font-medium"
                        >
                            Get Started
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 lg:gap-6 auto-rows-max relative z-10 pb-8">
                        {groups.map((group, index) => (
                            <GroupCard
                                key={group.id}
                                group={group}
                                index={index}
                                onGroupClick={handleGroupClick}
                                onEditClick={handleEditClick}
                                onDeleteClick={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupsPage;
