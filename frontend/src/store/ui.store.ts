import { create } from 'zustand';

interface UIState {
  isProfileSidebarOpen: boolean;
  openProfileSidebar: () => void;
  closeProfileSidebar: () => void;
  toggleProfileSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isProfileSidebarOpen: false,
  openProfileSidebar: () => set({ isProfileSidebarOpen: true }),
  closeProfileSidebar: () => set({ isProfileSidebarOpen: false }),
  toggleProfileSidebar: () => set((state) => ({ isProfileSidebarOpen: !state.isProfileSidebarOpen })),
}));
