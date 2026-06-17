import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  isMobileOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}));
