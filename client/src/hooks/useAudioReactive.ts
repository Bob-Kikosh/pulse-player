import { useEffect } from "react";
import type { RefObject } from "react";

import { getLevels } from "../audio/engine";

// Writes the current loudness of the music into CSS variables (--bass, --mid)
// of an element every frame, so its styles can react to the sound without React.
export function useAudioReactive(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;

    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let bass = 0;
    let mid = 0;

    const loop = () => {
      const levels = getLevels();

      // Rise fast, fall slowly: beats feel sharp and never flicker
      bass += (levels.bass - bass) * (levels.bass > bass ? 0.45 : 0.12);
      mid += (levels.mid - mid) * 0.1;

      element.style.setProperty("--bass", bass.toFixed(3));
      element.style.setProperty("--mid", mid.toFixed(3));

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, [ref]);
}
