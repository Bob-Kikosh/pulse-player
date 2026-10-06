import type { CSSProperties } from "react";

import type { Track } from "../../types";
import { getTrackColor, toCss } from "../../utils/trackColor";
import { PlaylistIcon } from "../icons";
import styles from "./PlaylistCover.module.css";

interface Props {
  tracks: Track[];
}

// Artwork of a playlist: a mosaic made of the colors of its first four tracks
function PlaylistCover({ tracks }: Props) {
  if (!tracks.length) {
    return (
      <span className={`${styles.cover} ${styles.empty}`} aria-hidden="true">
        <PlaylistIcon width={36} height={36} />
      </span>
    );
  }

  // Fewer than four tracks: repeat them so the mosaic is always full
  const tiles = Array.from({ length: 4 }, (_, index) => tracks[index % tracks.length]);

  return (
    <span className={styles.cover} aria-hidden="true">
      {tiles.map((track, index) => {
        const color = getTrackColor(track.id);

        return (
          <span
            key={index}
            className={styles.tile}
            style={
              {
                "--from": toCss(color),
                "--to": toCss({ ...color, h: color.h + 35, l: 35 }),
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}

export default PlaylistCover;
