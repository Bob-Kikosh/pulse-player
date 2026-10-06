import type { CSSProperties } from "react";

import type { Track } from "../../types";
import { getTrackColor } from "../../utils/trackColor";
import Equalizer from "../Equalizer/Equalizer";
import { LogoIcon } from "../icons";
import styles from "./Cover.module.css";

interface Props {
  track: Track;
  size?: "small" | "medium" | "large";
  // Shows animated bars over the artwork
  isPlaying?: boolean;
}

// The tracks have no artwork, so each one gets a generated gradient cover
function Cover({ track, size = "medium", isPlaying = false }: Props) {
  const { h, s, l } = getTrackColor(track.id);

  return (
    <span
      className={`${styles.cover} ${styles[size]}`}
      style={{ "--h": h, "--s": `${s}%`, "--l": `${l}%` } as CSSProperties}
      aria-hidden="true"
    >
      {isPlaying ? <Equalizer /> : <LogoIcon className={styles.mark} />}
    </span>
  );
}

export default Cover;
