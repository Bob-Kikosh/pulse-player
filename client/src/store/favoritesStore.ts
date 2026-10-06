import toast from "react-hot-toast";
import { create } from "zustand";

import { api } from "../api";
import { useAuthStore } from "./authStore";
import { usePlayerStore } from "./playerStore";

interface FavoritesState {
  ids: string[];
  isLoading: boolean;
  toggle: (trackId: string) => Promise<void>;
}

// Tracks with a request in flight, to ignore double clicks
const pending = new Set<string>();

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  isLoading: false,

  toggle: async (trackId) => {
    if (!useAuthStore.getState().user) {
      toast("Sign in to save favorites");
      useAuthStore.getState().openModal();
      return;
    }

    if (pending.has(trackId)) return;

    pending.add(trackId);

    const wasFavorite = get().ids.includes(trackId);
    const setFavorite = (isFavorite: boolean) =>
      set(({ ids }) => ({
        ids: isFavorite ? [...ids.filter((id) => id !== trackId), trackId] : ids.filter((id) => id !== trackId),
      }));

    // Update the UI right away and roll back if the request fails
    setFavorite(!wasFavorite);

    if (!wasFavorite) usePlayerStore.getState().burstLike();

    try {
      await (wasFavorite ? api.removeFavorite(trackId) : api.addFavorite(trackId));
    } catch {
      setFavorite(wasFavorite);
      toast.error("Could not update favorites");
    } finally {
      pending.delete(trackId);
    }
  },
}));

// Favorites belong to the account: load them on sign-in, drop them on sign-out
useAuthStore.subscribe((state, previous) => {
  if (state.user?.username === previous.user?.username) return;

  if (!state.user) {
    useFavoritesStore.setState({ ids: [], isLoading: false });
    return;
  }

  useFavoritesStore.setState({ isLoading: true });

  api
    .getFavorites()
    .then((ids) => useFavoritesStore.setState({ ids }))
    .catch(() => toast.error("Could not load favorites"))
    .finally(() => useFavoritesStore.setState({ isLoading: false }));
});
