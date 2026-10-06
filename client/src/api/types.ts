import type { Playlist, Track, User } from "../types";

// The app talks to its backend only through this interface. There are two
// implementations: a real HTTP client and an in-browser one for the static demo.
export interface Api {
  // True when accounts live in this browser only
  readonly isDemo: boolean;

  getTracks(): Promise<Track[]>;

  register(username: string, password: string): Promise<User>;
  login(username: string, password: string): Promise<User>;
  logout(): Promise<void>;
  // The signed-in user, or null
  getSession(): Promise<User | null>;

  // Ids of the user's favorite tracks
  getFavorites(): Promise<string[]>;
  addFavorite(trackId: string): Promise<void>;
  removeFavorite(trackId: string): Promise<void>;

  getPlaylists(): Promise<Playlist[]>;
  createPlaylist(name: string): Promise<Playlist>;
  // Renames a playlist and/or replaces its track list
  updatePlaylist(id: string, changes: Partial<Omit<Playlist, "id">>): Promise<Playlist>;
  deletePlaylist(id: string): Promise<void>;
}

// An error with a message that is safe to show to the user
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
