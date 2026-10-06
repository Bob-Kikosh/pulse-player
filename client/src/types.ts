export interface Track {
  id: string;
  title: string;
  artist: string;
  // Path to the audio file, relative to the app root
  src: string;
  // Seconds
  duration: number;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  // Precomputed waveform, values from 0 to 1
  peaks: number[];
}

export interface User {
  username: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export type RepeatMode = "off" | "all" | "one";
