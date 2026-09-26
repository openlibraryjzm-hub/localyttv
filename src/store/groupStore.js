import { create } from 'zustand';

// Load groups from localStorage
const loadGroups = () => {
    try {
        const stored = localStorage.getItem('playlistGroups');
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch {
        return [];
    }
};

// Save groups to localStorage
const saveGroups = (groups) => {
    try {
        localStorage.setItem('playlistGroups', JSON.stringify(groups));
    } catch (error) {
        console.error('Failed to save groups:', error);
    }
};

const useGroupStore = create((set, get) => ({
    groups: loadGroups(),
    activeGroupId: null, // Optional, depending on if we need a global "active" group concept

    setActiveGroup: (groupId) => {
        set({ activeGroupId: groupId });
    },

    createGroup: (name, description = '') => {
        const state = get();
        const newGroup = {
            id: `group-${Date.now()}`,
            name: name || `New Group`,
            description: description,
            playlistIds: [],
            createdAt: Date.now()
        };
        const updatedGroups = [...state.groups, newGroup];
        saveGroups(updatedGroups);
        set({ groups: updatedGroups });
        return newGroup.id;
    },

    updateGroup: (groupId, updates) => {
        const state = get();
        const updatedGroups = state.groups.map(group => {
            if (group.id === groupId) {
                return { ...group, ...updates };
            }
            return group;
        });
        saveGroups(updatedGroups);
        set({ groups: updatedGroups });
    },

    deleteGroup: (groupId) => {
        const state = get();
        const updatedGroups = state.groups.filter(group => group.id !== groupId);
        saveGroups(updatedGroups);
        set({
            groups: updatedGroups,
            activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
        });
    },

    addPlaylistToGroup: (groupId, playlistId) => {
        const state = get();
        const updatedGroups = state.groups.map(group => {
            if (group.id === groupId && !group.playlistIds.some(id => String(id) === String(playlistId))) {
                return { ...group, playlistIds: [...group.playlistIds, playlistId] };
            }
            return group;
        });
        saveGroups(updatedGroups);
        set({ groups: updatedGroups });
    },

    removePlaylistFromGroup: (groupId, playlistId) => {
        const state = get();
        const updatedGroups = state.groups.map(group => {
            if (group.id === groupId) {
                return { ...group, playlistIds: group.playlistIds.filter(id => String(id) !== String(playlistId)) };
            }
            return group;
        });
        saveGroups(updatedGroups);
        set({ groups: updatedGroups });
    }
}));

export { useGroupStore };
