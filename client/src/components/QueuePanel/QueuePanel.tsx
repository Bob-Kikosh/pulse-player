import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import { usePlayerStore } from "../../store/playerStore";
import { useTracksStore } from "../../store/tracksStore";
import { useUiStore } from "../../store/uiStore";
import type { Track } from "../../types";
import { getTrackColor, toCss } from "../../utils/trackColor";
import Cover from "../Cover/Cover";
import { CloseIcon, GripIcon } from "../icons";
import styles from "./QueuePanel.module.css";

// A side panel with the current track and everything that plays after it.
// Upcoming tracks can be dragged into a new order or removed.
function QueuePanel() {
  const queue = usePlayerStore((state) => state.queue);
  const currentId = usePlayerStore((state) => state.currentId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const tracks = useTracksStore((state) => state.tracks);

  const { playTrack, removeFromQueue, moveInQueue } = usePlayerStore.getState();
  const close = () => useUiStore.getState().setQueueOpen(false);

  // Ids of the row being dragged and of the row it is held over
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") useUiStore.getState().setQueueOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const byId = new Map(tracks.map((track) => [track.id, track]));
  const current = currentId ? byId.get(currentId) : undefined;
  const upcoming = queue
    .slice(queue.indexOf(currentId ?? "") + 1)
    .map((id) => byId.get(id))
    .filter((track): track is Track => track !== undefined);

  const move = (id: string, direction: 1 | -1) => {
    const index = upcoming.findIndex((track) => track.id === id);
    const target = index + direction;

    if (target < 0 || target >= upcoming.length) return;

    // Moving down means standing before the row after the next one
    const before = direction === 1 ? upcoming[target + 1]?.id ?? null : upcoming[target].id;

    moveInQueue(id, before);
  };

  const finishDrag = () => {
    setDraggedId(null);
    setOverId(null);
  };

  return createPortal(
    <aside className={styles.panel} aria-label="Queue">
      <header className={styles.header}>
        <h2 className={styles.heading}>Queue</h2>
        <button className={styles.iconButton} type="button" aria-label="Close the queue" onClick={close}>
          <CloseIcon />
        </button>
      </header>

      <div className={styles.scroll}>
        {current ? (
          <>
            <h3 className={styles.label}>Now playing</h3>
            <div
              className={`${styles.row} ${styles.current}`}
              style={{ "--accent": toCss(getTrackColor(current.id)) } as CSSProperties}
            >
              <Cover track={current} size="small" isPlaying={isPlaying} />
              <span className={styles.text}>
                <span className={styles.title}>{current.title}</span>
                <span className={styles.artist}>{current.artist}</span>
              </span>
            </div>

            <h3 className={styles.label}>
              Next up
              {shuffle && <span className={styles.note}>shuffle is on — the order is random</span>}
            </h3>

            {upcoming.length ? (
              <ol className={styles.list}>
                {upcoming.map((track, index) => (
                  <li
                    key={track.id}
                    className={`${styles.row} ${draggedId === track.id ? styles.dragged : ""} ${
                      overId === track.id && draggedId !== track.id ? styles.over : ""
                    }`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      setDraggedId(track.id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setOverId(track.id);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();

                      if (draggedId) moveInQueue(draggedId, track.id);

                      finishDrag();
                    }}
                    onDragEnd={finishDrag}
                  >
                    <span className={styles.grip} aria-hidden="true">
                      <GripIcon width={16} height={16} />
                    </span>

                    <button
                      className={styles.main}
                      type="button"
                      aria-label={`Play ${track.title} by ${track.artist}`}
                      onClick={() => playTrack(track.id, queue)}
                    >
                      <Cover track={track} size="small" />
                      <span className={styles.text}>
                        <span className={styles.title}>{track.title}</span>
                        <span className={styles.artist}>{track.artist}</span>
                      </span>
                    </button>

                    {/* Dragging does not work on touch screens, so there are buttons too */}
                    <span className={styles.arrows}>
                      <button
                        className={styles.arrow}
                        type="button"
                        aria-label={`Move ${track.title} up`}
                        disabled={index === 0}
                        onClick={() => move(track.id, -1)}
                      >
                        ▲
                      </button>
                      <button
                        className={styles.arrow}
                        type="button"
                        aria-label={`Move ${track.title} down`}
                        disabled={index === upcoming.length - 1}
                        onClick={() => move(track.id, 1)}
                      >
                        ▼
                      </button>
                    </span>

                    <button
                      className={styles.iconButton}
                      type="button"
                      aria-label={`Remove ${track.title} from the queue`}
                      onClick={() => removeFromQueue(track.id)}
                    >
                      <CloseIcon width={16} height={16} />
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.empty}>Nothing else is queued.</p>
            )}
          </>
        ) : (
          <p className={styles.empty}>The queue is empty. Start any track to fill it.</p>
        )}
      </div>
    </aside>,
    document.body
  );
}

export default QueuePanel;
