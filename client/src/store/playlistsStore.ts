import toast from "react-hot-toast";
import { create } from "zustand";

import { api } from "../api";
import type { Playlist } from "../types";
import { useAuthStore } from "./authStore";

interface PlaylistsState {
  playlists: Playlist[];
  isLoading: boolean;

  // Resolves to the new playlist, or null when the visitor is not signed in or the request failed
  create: (name: string) => Promise<Playlist | null>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<boolean>;
  // Adds the track, or removes it if it is already in the playlist
  toggleTrack: (id: string, trackId: string) => Promise<void>;
  removeTrack: (id: string, trackId: string) => Promise<void>;
}

function requireUser() {
  if (useAuthStore.getState().user) return true;

  toast("Sign in to create playlists");
  useAuthStore.getState().openModal();

  return false;
}

export const usePlaylistsStore = create<PlaylistsState>((set, get) => {
  // Applies a change right away and rolls it back if the server rejects it
  const update = async (id: string, changes: Partial<Omit<Playlist, "id">>) => {
    const previous = get().playlists;

    set({
      playlists: previous.map((playlist) => (playlist.id === id ? { ...playlist, ...changes } : playlist)),
    });

    try {
      await api.updatePlaylist(id, changes);
    } catch {
      set({ playlists: previous });
      toast.error("Could not update the playlist");
    }
  };

  return {
    playlists: [],
    isLoading: false,

    create: async (name) => {
      if (!requireUser()) return null;

      try {
        const playlist = await api.createPlaylist(name);

        set(({ playlists }) => ({ playlists: [...playlists, playlist] }));

        return playlist;
      } catch {
        toast.error("Could not create the playlist");
        return null;
      }
    },

    rename: (id, name) => update(id, { name }),

    remove: async (id) => {
      try {
        await api.deletePlaylist(id);
        set(({ playlists }) => ({ playlists: playlists.filter((playlist) => playlist.id !== id) }));

        return true;
      } catch {
        toast.error("Could not delete the playlist");
        return false;
      }
    },

    toggleTrack: async (id, trackId) => {
      const playlist = get().playlists.find((item) => item.id === id);

      if (!playlist) return;

      const isIncluded = playlist.trackIds.includes(trackId);

      await update(id, {
        trackIds: isIncluded
          ? playlist.trackIds.filter((item) => item !== trackId)
          : [...playlist.trackIds, trackId],
      });

      toast.success(isIncluded ? `Removed from “${playlist.name}”` : `Added to “${playlist.name}”`);
    },

    removeTrack: async (id, trackId) => {
      const playlist = get().playlists.find((item) => item.id === id);

      if (!playlist) return;

      await update(id, { trackIds: playlist.trackIds.filter((item) => item !== trackId) });
    },
  };
});

// Playlists belong to the account: load them on sign-in, drop them on sign-out
useAuthStore.subscribe((state, previous) => {
  if (state.user?.username === previous.user?.username) return;

  if (!state.user) {
    usePlaylistsStore.setState({ playlists: [], isLoading: false });
    return;
  }

  usePlaylistsStore.setState({ isLoading: true });

  api
    .getPlaylists()
    .then((playlists) => usePlaylistsStore.setState({ playlists }))
    .catch(() => toast.error("Could not load playlists"))
    .finally(() => usePlaylistsStore.setState({ isLoading: false }));
});
