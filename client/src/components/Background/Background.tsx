import { useRef } from "react";
import type { CSSProperties } from "react";

import { useAudioReactive } from "../../hooks/useAudioReactive";
import { useAccentColor } from "../../hooks/usePlayer";
import styles from "./Background.module.css";

// Blurred color blobs behind the app. Their hue follows the current track,
// and they swell with the bass of the music.
function Background() {
  const color = useAccentColor();
  const rootRef = useRef<HTMLDivElement>(null);

  useAudioReactive(rootRef);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ "--hue": color.h } as CSSProperties}
      aria-hidden="true"
    >
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />
      <div className={`${styles.blob} ${styles.blobC}`} />
      <div className={styles.vignette} />
    </div>
  );
}

export default Background;
