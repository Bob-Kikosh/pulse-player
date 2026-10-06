import { create } from "zustand";

interface UiState {
  // The full-screen "Now playing" view
  isNowPlayingOpen: boolean;
  isQueueOpen: boolean;

  setNowPlayingOpen: (isOpen: boolean) => void;
  setQueueOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isNowPlayingOpen: false,
  isQueueOpen: false,

  setNowPlayingOpen: (isNowPlayingOpen) => set({ isNowPlayingOpen }),
  setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),
}));
