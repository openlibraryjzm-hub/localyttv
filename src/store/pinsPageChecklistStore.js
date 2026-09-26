import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/storageUtils';

/**
 * Pins Page Checklist Store
 * Bullet-point checkboxes on the Pins page, grouped by date.
 * Persisted to localStorage.
 */
export const usePinsPageChecklistStore = create(
  persist(
    (set, get) => ({
      items: [], // { id, text, checked, createdAt }

      addItem: (text, createdAt = Date.now()) => {
        if (!text?.trim()) return;
        const id = `cl-${createdAt}-${Math.random().toString(36).slice(2, 9)}`;
        set({
          items: [
            ...get().items,
            { id, text: text.trim(), checked: false, createdAt },
          ],
        });
      },

      toggleChecked: (id) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          ),
        });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      setItemText: (id, text) => {
        if (!text?.trim()) return;
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, text: text.trim() } : item
          ),
        });
      },
    }),
    {
      name: 'pins-page-checklist-storage',
      storage: createJSONStorage(() => idbStorage)
    }
  )
);
