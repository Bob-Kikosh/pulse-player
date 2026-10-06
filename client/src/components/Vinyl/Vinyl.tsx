import type { CSSProperties } from "react";

import type { Track } from "../../types";
import { getTrackColor } from "../../utils/trackColor";
import styles from "./Vinyl.module.css";

interface Props {
  track: Track;
  // The record turns while its track plays and stops where it was on pause
  isSpinning: boolean;
  className?: string;
}

// A vinyl record with the track's generated artwork as its label
function Vinyl({ track, isSpinning, className = "" }: Props) {
  const { h, s, l } = getTrackColor(track.id);

  return (
    <span
      className={`${styles.vinyl} ${isSpinning ? styles.spinning : ""} ${className}`}
      style={{ "--h": h, "--s": `${s}%`, "--l": `${l}%` } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.label} />
    </span>
  );
}

export default Vinyl;
