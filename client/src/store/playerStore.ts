import toast from "react-hot-toast";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import * as engine from "../audio/engine";
import type { RepeatMode } from "../types";
import { findTrack, useTracksStore } from "./tracksStore";

// Pressing "previous" later than this restarts the track instead
const RESTART_THRESHOLD = 3;

const REPEAT_ORDER: RepeatMode[] = ["off", "all", "one"];

interface PlayerState {
  // Ids of the tracks that "next" and "previous" walk through:
  // the list the current track was started from
  queue: string[];
  currentId: string | null;
  isPlaying: boolean;
  duration: number;

  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;

  // Counters that visual effects react to
  trackChanges: number;
  likeBursts: number;

  playTrack: (id: string, queue: string[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  seekBy: (seconds: number) => void;

  // Queue editing
  playNext: (id: string) => void;
  addToQueue: (id: string) => void;
  removeFromQueue: (id: string) => void;
  // Moves a track so that it stands right before another one (or at the end)
  moveInQueue: (id: string, beforeId: string | null) => void;

  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  burstLike: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      const start = () => {
        set({ isPlaying: true });

        engine.play().catch((error: unknown) => {
          // Switching tracks quickly interrupts the previous play() call — not an error
          if (error instanceof DOMException && error.name === "AbortError") return;

          set({ isPlaying: false });
          toast.error("Could not play this track");
        });
      };

      // Moves through the queue; `auto` is true when a track ended by itself
      const advance = (direction: 1 | -1, auto: boolean) => {
        const { queue, currentId, shuffle, repeat } = get();

        if (!queue.length) return;

        const index = queue.indexOf(currentId ?? "");
        let nextIndex = index + direction;

        if (shuffle && queue.length > 1) {
          do {
            nextIndex = Math.floor(Math.random() * queue.length);
          } while (nextIndex === index);
        } else if (nextIndex < 0 || nextIndex >= queue.length) {
          // The queue is over: stop, unless the listener asked to loop or pressed a button
          if (auto && repeat === "off") {
            engine.pause();
            engine.seek(0);
            return;
          }

          nextIndex = (nextIndex + queue.length) % queue.length;
        }

        get().playTrack(queue[nextIndex], queue);
      };

      engine.audio.addEventListener("play", () => set({ isPlaying: true }));
      engine.audio.addEventListener("pause", () => set({ isPlaying: false }));

      engine.audio.addEventListener("durationchange", () => {
        if (Number.isFinite(engine.audio.duration)) set({ duration: engine.audio.duration });
      });

      engine.audio.addEventListener("ended", () => {
        if (get().repeat === "one") {
          engine.seek(0);
          start();
        } else {
          advance(1, true);
        }
      });

      engine.audio.addEventListener("error", () => {
        // Clearing the source on stop() also fires "error"
        if (!get().currentId) return;

        set({ isPlaying: false });
        toast.error("Could not load this track");
      });

      return {
        queue: [],
        currentId: null,
        isPlaying: false,
        duration: 0,

        volume: 0.8,
        isMuted: false,
        shuffle: false,
        repeat: "off",

        trackChanges: 0,
        likeBursts: 0,

        playTrack: (id, queue) => {
          const track = findTrack(id);

          if (!track) return;

          if (get().currentId !== id) {
            engine.load(track.src);

            set((state) => ({
              currentId: id,
              duration: track.duration,
              trackChanges: state.trackChanges + 1,
            }));
          }

          set({ queue });
          start();
        },

        toggle: () => {
          const { currentId, isPlaying, playTrack } = get();

          if (isPlaying) {
            engine.pause();
          } else if (currentId) {
            start();
          } else {
            // Nothing was chosen yet: start the library from the top
            const ids = useTracksStore.getState().tracks.map((track) => track.id);

            if (ids.length) playTrack(ids[0], ids);
          }
        },

        next: () => advance(1, false),

        prev: () => {
          if (engine.audio.currentTime > RESTART_THRESHOLD) {
            engine.seek(0);
          } else {
            advance(-1, false);
          }
        },

        stop: () => {
          set({ currentId: null, queue: [], isPlaying: false, duration: 0 });
          engine.unload();
        },

        seekBy: (seconds) => engine.seek(engine.audio.currentTime + seconds),

        playNext: (id) => {
          const { currentId, queue, playTrack } = get();

          if (!currentId) return playTrack(id, [id]);
          if (id === currentId) return;

          const rest = queue.filter((item) => item !== id);
          const index = rest.indexOf(currentId) + 1;

          set({ queue: [...rest.slice(0, index), id, ...rest.slice(index)] });
          toast.success("Will play next");
        },

        addToQueue: (id) => {
          const { currentId, queue, playTrack } = get();

          if (!currentId) return playTrack(id, [id]);
          if (id === currentId) return;

          set({ queue: [...queue.filter((item) => item !== id), id] });
          toast.success("Added to queue");
        },

        removeFromQueue: (id) => {
          if (id === get().currentId) return;

          set(({ queue }) => ({ queue: queue.filter((item) => item !== id) }));
        },

        moveInQueue: (id, beforeId) => {
          if (id === beforeId) return;

          const rest = get().queue.filter((item) => item !== id);
          const index = beforeId ? rest.indexOf(beforeId) : rest.length;

          set({ queue: [...rest.slice(0, index), id, ...rest.slice(index)] });
        },

        setVolume: (volume) => set({ volume: Math.min(Math.max(volume, 0), 1), isMuted: false }),
        toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
        toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

        cycleRepeat: () =>
          set((state) => ({
            repeat: REPEAT_ORDER[(REPEAT_ORDER.indexOf(state.repeat) + 1) % REPEAT_ORDER.length],
          })),

        burstLike: () => set((state) => ({ likeBursts: state.likeBursts + 1 })),
      };
    },
    {
      name: "pulse.player",
      // Only the listener's preferences survive a reload
      partialize: ({ volume, isMuted, shuffle, repeat }) => ({ volume, isMuted, shuffle, repeat }),
    }
  )
);

function applyVolume({ volume, isMuted }: PlayerState) {
  engine.audio.volume = isMuted ? 0 : volume;
}

applyVolume(usePlayerStore.getState());
usePlayerStore.subscribe(applyVolume);
