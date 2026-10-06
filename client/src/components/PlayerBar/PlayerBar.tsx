import { useRef } from "react";
import type { CSSProperties } from "react";

import { useAudioReactive } from "../../hooks/useAudioReactive";
import { useCurrentTime, useCurrentTrack } from "../../hooks/usePlayer";
import { usePlayerStore } from "../../store/playerStore";
import type { Track } from "../../types";
import { useUiStore } from "../../store/uiStore";
import { formatTime } from "../../utils/format";
import { getTrackColor, toCss } from "../../utils/trackColor";
import { ExpandIcon, QueueIcon, VolumeIcon } from "../icons";
import LikeButton from "../LikeButton/LikeButton";
import PlayerControls from "../PlayerControls/PlayerControls";
import Spectrum from "../Spectrum/Spectrum";
import Vinyl from "../Vinyl/Vinyl";
import Waveform from "../Waveform/Waveform";
import styles from "./PlayerBar.module.css";

// A separate component, so the clock ticking does not re-render the whole bar
function CurrentTime() {
  return <time className={styles.time}>{formatTime(useCurrentTime())}</time>;
}

// Rendered only while a track is chosen, so the bar element exists from the first
// render and the audio-reactive hook can attach to it
function Bar({ track }: { track: Track }) {
  const barRef = useRef<HTMLElement>(null);

  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const isQueueOpen = useUiStore((state) => state.isQueueOpen);

  const { setVolume, toggleMute } = usePlayerStore.getState();
  const { setNowPlayingOpen, setQueueOpen } = useUiStore.getState();

  useAudioReactive(barRef);

  const color = getTrackColor(track.id);
  const shownVolume = isMuted ? 0 : volume;
  const volumeLevel = shownVolume === 0 ? "muted" : shownVolume < 0.5 ? "low" : "high";

  return (
    <footer
      ref={barRef}
      className={`${styles.bar} ${isPlaying ? styles.playing : ""}`}
      style={{ "--accent": toCss(color) } as CSSProperties}
      aria-label="Player"
    >
      {/* A live spectrum glows through the glass of the bar */}
      <div className={styles.glow}>
        <Spectrum color={color} bars={64} />
      </div>

      <div className={styles.track}>
        <button
          className={styles.open}
          type="button"
          aria-label="Open the full-screen player"
          title="Full screen (F)"
          onClick={() => setNowPlayingOpen(true)}
        >
          {/* The key restarts the entrance animation for every new track */}
          <Vinyl key={track.id} track={track} isSpinning={isPlaying} className={styles.vinyl} />
          <span className={styles.meta} key={`meta-${track.id}`}>
            <span className={styles.title}>{track.title}</span>
            <span className={styles.artist}>{track.artist}</span>
          </span>
        </button>
        <span className={styles.like}>
          <LikeButton track={track} />
        </span>
      </div>

      <div className={styles.controls}>
        <PlayerControls hideSecondaryOnMobile />
      </div>

      <div className={styles.timeline}>
        <CurrentTime />
        <Waveform track={track} />
        <time className={styles.time}>{formatTime(duration)}</time>
      </div>

      <div className={styles.extra}>
        <button
          className={`${styles.control} ${isQueueOpen ? styles.on : ""}`}
          type="button"
          aria-label="Queue"
          aria-pressed={isQueueOpen}
          title="Queue (Q)"
          onClick={() => setQueueOpen(!isQueueOpen)}
        >
          <QueueIcon />
        </button>

        <button
          className={`${styles.control} ${styles.desktop}`}
          type="button"
          aria-label="Open the full-screen player"
          title="Full screen (F)"
          onClick={() => setNowPlayingOpen(true)}
        >
          <ExpandIcon width={18} height={18} />
        </button>

        <div className={styles.volume}>
          <button
            className={styles.control}
            type="button"
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute (M)" : "Mute (M)"}
            onClick={toggleMute}
          >
            <VolumeIcon level={volumeLevel} />
          </button>

          <input
            className={styles.slider}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={shownVolume}
            aria-label="Volume"
            style={{ "--value": `${shownVolume * 100}%` } as CSSProperties}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </div>
      </div>
    </footer>
  );
}

function PlayerBar() {
  const track = useCurrentTrack();

  return track ? <Bar track={track} /> : null;
}

export default PlayerBar;
