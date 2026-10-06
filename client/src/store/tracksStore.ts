import { create } from "zustand";

import { api } from "../api";
import type { Track } from "../types";

interface TracksState {
  tracks: Track[];
  status: "loading" | "ready" | "error";
  load: () => Promise<void>;
}

export const useTracksStore = create<TracksState>((set) => ({
  tracks: [],
  status: "loading",

  load: async () => {
    set({ status: "loading" });

    try {
      set({ tracks: await api.getTracks(), status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },
}));

export function findTrack(id: string | null) {
  return useTracksStore.getState().tracks.find((track) => track.id === id);
}
