import { create } from 'zustand';

export const usePaginationStore = create((set, get) => ({
  // Current page (1-indexed)
  currentPage: 1,
  // Total pages (calculated from total items / items per page)
  totalPages: 1,
  // Items per page
  itemsPerPage: 50,
  // Is user currently editing page input
  isEditingPage: false,
  // Value in page input field
  pageInputValue: '',
  // Flag to preserve scroll position on page change (for TopNav navigation)
  preserveScroll: false,
  
  setCurrentPage: (page) => set({ currentPage: page, preserveScroll: false }),
  
  // Set page while preserving scroll position (for TopNav)
  setCurrentPagePreserveScroll: (page) => set({ currentPage: page, preserveScroll: true }),
  
  // Clear the preserve scroll flag (called after scroll decision is made)
  clearPreserveScroll: () => set({ preserveScroll: false }),
  
  setTotalPages: (total) => set({ totalPages: total }),
  
  setItemsPerPage: (count) => set({ itemsPerPage: count }),
  
  setIsEditingPage: (editing) => set({ isEditingPage: editing }),
  
  setPageInputValue: (value) => set({ pageInputValue: value }),
  
  // Navigate to next page
  nextPage: () => set((state) => ({
    currentPage: Math.min(state.currentPage + 1, state.totalPages),
    preserveScroll: false
  })),
  
  // Navigate to previous page
  prevPage: () => set((state) => ({
    currentPage: Math.max(state.currentPage - 1, 1),
    preserveScroll: false
  })),
  
  // Navigate to first page
  firstPage: () => set({ currentPage: 1, preserveScroll: false }),
  
  // Navigate to last page
  lastPage: () => set((state) => ({ currentPage: state.totalPages, preserveScroll: false })),
  
  // Calculate and navigate to next quarter
  nextQuarter: () => set((state) => {
    const { currentPage, totalPages } = state;
    if (totalPages <= 4) return { currentPage: Math.min(currentPage + 1, totalPages), preserveScroll: false };
    
    const quarterMarks = [
      Math.max(1, Math.round(totalPages * 0.25)),
      Math.max(1, Math.round(totalPages * 0.5)),
      Math.max(1, Math.round(totalPages * 0.75)),
      totalPages
    ];
    const next = quarterMarks.find(q => q > currentPage);
    return { currentPage: next || totalPages, preserveScroll: false };
  }),
  
  // Calculate and navigate to previous quarter
  prevQuarter: () => set((state) => {
    const { currentPage, totalPages } = state;
    if (totalPages <= 4) return { currentPage: Math.max(currentPage - 1, 1), preserveScroll: false };
    
    const quarterMarks = [
      Math.max(1, Math.round(totalPages * 0.25)),
      Math.max(1, Math.round(totalPages * 0.5)),
      Math.max(1, Math.round(totalPages * 0.75)),
      totalPages
    ];
    const prev = [...quarterMarks].reverse().find(q => q < currentPage);
    return { currentPage: prev || 1, preserveScroll: false };
  }),
  
  // --- Preserve Scroll versions (for TopNav) ---
  nextPagePreserve: () => set((state) => ({
    currentPage: Math.min(state.currentPage + 1, state.totalPages),
    preserveScroll: true
  })),
  
  prevPagePreserve: () => set((state) => ({
    currentPage: Math.max(state.currentPage - 1, 1),
    preserveScroll: true
  })),
  
  firstPagePreserve: () => set({ currentPage: 1, preserveScroll: true }),
  
  lastPagePreserve: () => set((state) => ({ currentPage: state.totalPages, preserveScroll: true })),
  
  nextQuarterPreserve: () => set((state) => {
    const { currentPage, totalPages } = state;
    if (totalPages <= 4) return { currentPage: Math.min(currentPage + 1, totalPages), preserveScroll: true };
    
    const quarterMarks = [
      Math.max(1, Math.round(totalPages * 0.25)),
      Math.max(1, Math.round(totalPages * 0.5)),
      Math.max(1, Math.round(totalPages * 0.75)),
      totalPages
    ];
    const next = quarterMarks.find(q => q > currentPage);
    return { currentPage: next || totalPages, preserveScroll: true };
  }),
  
  prevQuarterPreserve: () => set((state) => {
    const { currentPage, totalPages } = state;
    if (totalPages <= 4) return { currentPage: Math.max(currentPage - 1, 1), preserveScroll: true };
    
    const quarterMarks = [
      Math.max(1, Math.round(totalPages * 0.25)),
      Math.max(1, Math.round(totalPages * 0.5)),
      Math.max(1, Math.round(totalPages * 0.75)),
      totalPages
    ];
    const prev = [...quarterMarks].reverse().find(q => q < currentPage);
    return { currentPage: prev || 1, preserveScroll: true };
  }),
  
  // Reset pagination (when changing playlists, etc.)
  resetPagination: () => set({ currentPage: 1, totalPages: 1, isEditingPage: false, pageInputValue: '' }),
}));
