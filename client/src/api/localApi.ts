import tracks from "../data/tracks.json";
import type { Playlist, User } from "../types";
import { ApiError } from "./types";
import type { Api } from "./types";

const USERS_KEY = "pulse.demo.users";
const SESSION_KEY = "pulse.demo.session";
// Imitates a network round trip so loading states are visible in the demo
const LATENCY_MS = 250;

interface StoredUser {
  username: string;
  salt: string;
  passwordHash: string;
  favorites: string[];
  // Missing in accounts created before playlists existed
  playlists?: Playlist[];
}

type Users = Record<string, StoredUser>;

function readUsers(): Users {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}") as Users;
  } catch {
    return {};
  }
}

function writeUsers(users: Users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);

  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", data)));
}

function delay<T>(value: T) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

// Usernames are case-insensitive: "Alex" and "alex" are the same account
const toKey = (username: string) => username.trim().toLowerCase();

function requireUser(): { users: Users; user: StoredUser } {
  const users = readUsers();
  const user = users[localStorage.getItem(SESSION_KEY) ?? ""];

  if (!user) throw new ApiError("Please sign in first", 401);

  return { users, user };
}

// Backend replacement for the static demo: accounts and favorites are kept
// in localStorage, so the app works without a server.
export function createLocalApi(): Api {
  return {
    isDemo: true,

    getTracks: () => delay(tracks),

    async register(username, password) {
      const users = readUsers();
      const key = toKey(username);

      if (users[key]) throw new ApiError("This username is already taken", 409);

      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));

      users[key] = {
        username: username.trim(),
        salt,
        passwordHash: await hashPassword(password, salt),
        favorites: [],
      };

      writeUsers(users);
      localStorage.setItem(SESSION_KEY, key);

      return delay<User>({ username: users[key].username });
    },

    async login(username, password) {
      const key = toKey(username);
      const user = readUsers()[key];

      if (!user || user.passwordHash !== (await hashPassword(password, user.salt))) {
        throw new ApiError("Wrong username or password", 401);
      }

      localStorage.setItem(SESSION_KEY, key);

      return delay<User>({ username: user.username });
    },

    async logout() {
      localStorage.removeItem(SESSION_KEY);
    },

    async getSession() {
      const user = readUsers()[localStorage.getItem(SESSION_KEY) ?? ""];

      return user ? { username: user.username } : null;
    },

    async getFavorites() {
      return delay(requireUser().user.favorites);
    },

    async addFavorite(trackId) {
      const { users, user } = requireUser();

      if (!user.favorites.includes(trackId)) user.favorites.push(trackId);

      writeUsers(users);
    },

    async removeFavorite(trackId) {
      const { users, user } = requireUser();

      user.favorites = user.favorites.filter((id) => id !== trackId);

      writeUsers(users);
    },

    async getPlaylists() {
      return delay(requireUser().user.playlists ?? []);
    },

    async createPlaylist(name) {
      const { users, user } = requireUser();
      const playlist: Playlist = { id: crypto.randomUUID(), name, trackIds: [] };

      user.playlists = [...(user.playlists ?? []), playlist];
      writeUsers(users);

      return playlist;
    },

    async updatePlaylist(id, changes) {
      const { users, user } = requireUser();
      const playlist = user.playlists?.find((item) => item.id === id);

      if (!playlist) throw new ApiError("Playlist not found", 404);

      Object.assign(playlist, changes);
      writeUsers(users);

      return playlist;
    },

    async deletePlaylist(id) {
      const { users, user } = requireUser();

      user.playlists = user.playlists?.filter((item) => item.id !== id);
      writeUsers(users);
    },
  };
}
