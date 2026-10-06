import type { Playlist, Track, User } from "../types";
import { ApiError } from "./types";
import type { Api } from "./types";

const TOKEN_KEY = "pulse.token";
const TIMEOUT_MS = 10_000;

interface AuthResponse {
  token: string;
  user: User;
}

// Client for the Express server from the "server" folder
export function createHttpApi(baseUrl: string): Api {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    const token = localStorage.getItem(TOKEN_KEY);

    if (init.body) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new ApiError("The server is not responding. Please try again later", 0);
    }

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : "Request failed";

      throw new ApiError(message, response.status);
    }

    return data as T;
  }

  async function authenticate(path: string, username: string, password: string) {
    const { token, user } = await request<AuthResponse>(path, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    localStorage.setItem(TOKEN_KEY, token);

    return user;
  }

  return {
    isDemo: false,

    getTracks: () => request<Track[]>("/tracks"),

    register: (username, password) => authenticate("/register", username, password),
    login: (username, password) => authenticate("/login", username, password),

    async logout() {
      localStorage.removeItem(TOKEN_KEY);
    },

    async getSession() {
      if (!localStorage.getItem(TOKEN_KEY)) return null;

      try {
        return await request<User>("/profile");
      } catch (error) {
        // An expired or invalid token simply means "not signed in"
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          return null;
        }

        throw error;
      }
    },

    getFavorites: () => request<string[]>("/favorites"),

    async addFavorite(trackId) {
      await request(`/favorites/${encodeURIComponent(trackId)}`, { method: "PUT" });
    },

    async removeFavorite(trackId) {
      await request(`/favorites/${encodeURIComponent(trackId)}`, { method: "DELETE" });
    },

    getPlaylists: () => request<Playlist[]>("/playlists"),

    createPlaylist: (name) =>
      request<Playlist>("/playlists", { method: "POST", body: JSON.stringify({ name }) }),

    updatePlaylist: (id, changes) =>
      request<Playlist>(`/playlists/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      }),

    async deletePlaylist(id) {
      await request(`/playlists/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}
