import { useEffect } from "react";

import { useAuthStore } from "../store/authStore";
import { useFavoritesStore } from "../store/favoritesStore";
import { usePlayerStore } from "../store/playerStore";
import { useUiStore } from "../store/uiStore";

const SEEK_STEP = 5;
const VOLUME_STEP = 0.05;

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

// Space — play/pause, ←/→ — seek, ↑/↓ — volume, N/P — next/previous,
// M — mute, S — shuffle, R — repeat, L — like the current track,
// F — full-screen player, Q — queue
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target) || useAuthStore.getState().isModalOpen) return;

      const player = usePlayerStore.getState();
      const ui = useUiStore.getState();

      const actions: Record<string, () => void> = {
        Space: player.toggle,
        ArrowRight: () => player.seekBy(SEEK_STEP),
        ArrowLeft: () => player.seekBy(-SEEK_STEP),
        ArrowUp: () => player.setVolume(player.volume + VOLUME_STEP),
        ArrowDown: () => player.setVolume(player.volume - VOLUME_STEP),
        KeyN: player.next,
        KeyP: player.prev,
        KeyM: player.toggleMute,
        KeyS: player.toggleShuffle,
        KeyR: player.cycleRepeat,
        KeyF: () => {
          if (player.currentId) ui.setNowPlayingOpen(!ui.isNowPlayingOpen);
        },
        KeyQ: () => ui.setQueueOpen(!ui.isQueueOpen),
        KeyL: () => {
          if (player.currentId) void useFavoritesStore.getState().toggle(player.currentId);
        },
      };

      const action = actions[event.code];

      if (!action) return;

      // Space on a focused button would also "click" it, and arrows would scroll the page
      event.preventDefault();
      action();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
