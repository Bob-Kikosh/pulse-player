import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import { useAudioReactive } from "../../hooks/useAudioReactive";
import { useCurrentTime, useCurrentTrack } from "../../hooks/usePlayer";
import { usePlayerStore } from "../../store/playerStore";
import { useUiStore } from "../../store/uiStore";
import { formatTime } from "../../utils/format";
import { getTrackColor, toCss } from "../../utils/trackColor";
import { ChevronDownIcon, QueueIcon } from "../icons";
import LikeButton from "../LikeButton/LikeButton";
import PlayerControls from "../PlayerControls/PlayerControls";
import Spectrum from "../Spectrum/Spectrum";
import Vinyl from "../Vinyl/Vinyl";
import Waveform from "../Waveform/Waveform";
import styles from "./NowPlaying.module.css";

function CurrentTime() {
  return <time className={styles.time}>{formatTime(useCurrentTime())}</time>;
}

// The full-screen player: a spinning record inside a ring of live spectrum
function NowPlaying() {
  const track = useCurrentTrack();
  const rootRef = useRef<HTMLDivElement>(null);

  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const duration = usePlayerStore((state) => state.duration);
  const isQueueOpen = useUiStore((state) => state.isQueueOpen);

  const { setNowPlayingOpen, setQueueOpen } = useUiStore.getState();

  useAudioReactive(rootRef);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNowPlayingOpen(false);
    };

    // The page behind must not scroll
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [setNowPlayingOpen]);

  // The view makes no sense without a track, e.g. after signing out
  useEffect(() => {
    if (!track) setNowPlayingOpen(false);
  }, [track, setNowPlayingOpen]);

  if (!track) return null;

  const color = getTrackColor(track.id);

  return createPortal(
    <div
      ref={rootRef}
      className={`${styles.root} ${isPlaying ? styles.playing : ""}`}
      style={{ "--accent": toCss(color) } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
    >
      <header className={styles.header}>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="Close the full-screen player"
          title="Close (Esc)"
          onClick={() => setNowPlayingOpen(false)}
        >
          <ChevronDownIcon width={26} height={26} />
        </button>

        <span className={styles.eyebrow}>{isPlaying ? "Now playing" : "Paused"}</span>

        <button
          className={`${styles.iconButton} ${isQueueOpen ? styles.on : ""}`}
          type="button"
          aria-label="Queue"
          aria-pressed={isQueueOpen}
          title="Queue (Q)"
          onClick={() => setQueueOpen(!isQueueOpen)}
        >
          <QueueIcon width={22} height={22} />
        </button>
      </header>

      <div className={styles.stage}>
        <Spectrum color={color} variant="ring" bars={72} innerRadius={0.31} className={styles.ring} />
        {/* The key restarts the entrance animation for every new track */}
        <div className={styles.disc} key={track.id}>
          <Vinyl track={track} isSpinning={isPlaying} />
        </div>
      </div>

      <div className={styles.info} key={`info-${track.id}`}>
        <div className={styles.text}>
          <h2 className={styles.title}>{track.title}</h2>
          <p className={styles.artist}>{track.artist}</p>
        </div>
        <LikeButton track={track} />
      </div>

      <div className={styles.timeline}>
        <Waveform track={track} />
        <div className={styles.times}>
          <CurrentTime />
          <time className={styles.time}>{formatTime(duration)}</time>
        </div>
      </div>

      <PlayerControls size="large" />
    </div>,
    document.body
  );
}

export default NowPlaying;
