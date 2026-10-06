import { useEffect } from "react";

import { usePlayerStore } from "../store/playerStore";
import { useCurrentTrack } from "./usePlayer";

// Shows the current track on the lock screen and in the system media controls,
// and makes hardware media keys work.
export function useMediaSession() {
  const track = useCurrentTrack();
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const { toggle, next, prev } = usePlayerStore.getState();

    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = track
      ? new MediaMetadata({ title: track.title, artist: track.artist })
      : null;
  }, [track]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // The browser tab shows what is playing
  useEffect(() => {
    document.title = track ? `${track.title} · ${track.artist} — Pulse` : "Pulse — music player";
  }, [track]);
}
