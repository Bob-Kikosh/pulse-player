import { useEffect, useState } from "react";

import { audio } from "../audio/engine";
import { usePlayerStore } from "../store/playerStore";
import { useTracksStore } from "../store/tracksStore";
import { DEFAULT_COLOR, getTrackColor } from "../utils/trackColor";

export function useCurrentTrack() {
  const currentId = usePlayerStore((state) => state.currentId);

  return useTracksStore((state) => state.tracks.find((track) => track.id === currentId));
}

// Accent color of the app: follows the current track
export function useAccentColor() {
  const currentId = usePlayerStore((state) => state.currentId);

  return currentId ? getTrackColor(currentId) : DEFAULT_COLOR;
}

const TIME_EVENTS = ["timeupdate", "seeked", "emptied"] as const;

// Playback position for text labels. It updates a few times per second;
// anything animated should read `audio.currentTime` in its own frame loop instead.
export function useCurrentTime() {
  const [time, setTime] = useState(audio.currentTime);

  useEffect(() => {
    const update = () => setTime(audio.currentTime);

    TIME_EVENTS.forEach((event) => audio.addEventListener(event, update));

    return () => TIME_EVENTS.forEach((event) => audio.removeEventListener(event, update));
  }, []);

  return time;
}
