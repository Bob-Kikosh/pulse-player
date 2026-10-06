import { create } from "zustand";

import { api } from "../api";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  // True until the saved session has been checked
  isChecking: boolean;
  isModalOpen: boolean;

  restoreSession: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  openModal: () => void;
  closeModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isChecking: true,
  isModalOpen: false,

  restoreSession: async () => {
    try {
      set({ user: await api.getSession() });
    } catch {
      // The server is unreachable: the app still works for guests
    } finally {
      set({ isChecking: false });
    }
  },

  login: async (username, password) => {
    set({ user: await api.login(username, password), isModalOpen: false });
  },

  register: async (username, password) => {
    set({ user: await api.register(username, password), isModalOpen: false });
  },

  logout: async () => {
    await api.logout();
    set({ user: null });
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
