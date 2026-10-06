import { memo, useMemo } from "react";
import type { CSSProperties } from "react";

import { usePlayerStore } from "../../store/playerStore";
import type { Track } from "../../types";
import { formatTime } from "../../utils/format";
import { getTrackColor, toCss } from "../../utils/trackColor";
import Cover from "../Cover/Cover";
import Equalizer from "../Equalizer/Equalizer";
import { PauseIcon, PlayIcon } from "../icons";
import LikeButton from "../LikeButton/LikeButton";
import TrackMenu from "../TrackMenu/TrackMenu";
import styles from "./TrackList.module.css";

interface RowProps {
  track: Track;
  index: number;
  // Ids of all tracks in the list: it becomes the queue when this row is played
  queue: string[];
  removeLabel?: string;
  onRemove?: (trackId: string) => void;
}

const TrackRow = memo(function TrackRow({ track, index, queue, removeLabel, onRemove }: RowProps) {
  // Each row subscribes only to its own state, so starting a track re-renders two rows, not the list
  const isCurrent = usePlayerStore((state) => state.currentId === track.id);
  const isPlaying = usePlayerStore((state) => state.currentId === track.id && state.isPlaying);

  const handleClick = () => {
    const { toggle, playTrack } = usePlayerStore.getState();

    if (isCurrent) toggle();
    else playTrack(track.id, queue);
  };

  return (
    <li
      className={`${styles.row} ${isCurrent ? styles.current : ""}`}
      style={
        {
          "--accent": toCss(getTrackColor(track.id)),
          // Rows appear one after another
          "--delay": `${Math.min(index, 12) * 35}ms`,
        } as CSSProperties
      }
    >
      <button
        className={styles.main}
        type="button"
        aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title} by ${track.artist}`}
        onClick={handleClick}
      >
        <span className={styles.number}>
          <span className={styles.index}>{isPlaying ? <Equalizer /> : index + 1}</span>
          <span className={styles.action}>
            {isPlaying ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
          </span>
        </span>

        <Cover track={track} size="small" />

        <span className={styles.text}>
          <span className={styles.title}>{track.title}</span>
          <span className={styles.artist}>{track.artist}</span>
        </span>
      </button>

      <span className={styles.duration}>{formatTime(track.duration)}</span>
      <LikeButton track={track} />
      <TrackMenu
        track={track}
        extraAction={
          onRemove && removeLabel ? { label: removeLabel, onSelect: () => onRemove(track.id) } : undefined
        }
      />
    </li>
  );
});

interface Props {
  tracks: Track[];
  // Adds one more item to the menu of every row, e.g. "Remove from this playlist"
  removeLabel?: string;
  onRemove?: (trackId: string) => void;
}

function TrackList({ tracks, removeLabel, onRemove }: Props) {
  const queue = useMemo(() => tracks.map((track) => track.id), [tracks]);

  return (
    <ol className={styles.list}>
      {tracks.map((track, index) => (
        <TrackRow
          key={track.id}
          track={track}
          index={index}
          queue={queue}
          removeLabel={removeLabel}
          onRemove={onRemove}
        />
      ))}
    </ol>
  );
}

export default TrackList;
