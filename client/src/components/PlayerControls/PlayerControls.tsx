import { usePlayerStore } from "../../store/playerStore";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, ShuffleIcon } from "../icons";
import styles from "./PlayerControls.module.css";

const REPEAT_LABELS = {
  off: "Repeat is off",
  all: "Repeating the list",
  one: "Repeating this track",
};

interface Props {
  // "large" is used in the full-screen view
  size?: "medium" | "large";
  // The compact bar on phones hides shuffle and repeat
  hideSecondaryOnMobile?: boolean;
}

// Shuffle, previous, play/pause, next, repeat
function PlayerControls({ size = "medium", hideSecondaryOnMobile = false }: Props) {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);

  const { toggle, next, prev, toggleShuffle, cycleRepeat } = usePlayerStore.getState();

  const secondary = `${styles.control} ${hideSecondaryOnMobile ? styles.secondary : ""}`;
  const playIconSize = size === "large" ? 32 : 24;

  return (
    <div className={`${styles.controls} ${styles[size]} ${isPlaying ? styles.playing : ""}`}>
      <button
        className={`${secondary} ${shuffle ? styles.on : ""}`}
        type="button"
        aria-label="Shuffle"
        aria-pressed={shuffle}
        title="Shuffle (S)"
        onClick={toggleShuffle}
      >
        <ShuffleIcon />
      </button>

      <button className={styles.control} type="button" aria-label="Previous track" title="Previous (P)" onClick={prev}>
        <PrevIcon />
      </button>

      <button
        className={styles.play}
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        onClick={toggle}
      >
        {isPlaying ? (
          <PauseIcon width={playIconSize} height={playIconSize} />
        ) : (
          <PlayIcon width={playIconSize} height={playIconSize} />
        )}
      </button>

      <button className={styles.control} type="button" aria-label="Next track" title="Next (N)" onClick={next}>
        <NextIcon />
      </button>

      <button
        className={`${secondary} ${repeat !== "off" ? styles.on : ""}`}
        type="button"
        aria-label={REPEAT_LABELS[repeat]}
        title={`${REPEAT_LABELS[repeat]} (R)`}
        onClick={cycleRepeat}
      >
        <RepeatIcon />
        {repeat === "one" && <span className={styles.badge}>1</span>}
      </button>
    </div>
  );
}

export default PlayerControls;
