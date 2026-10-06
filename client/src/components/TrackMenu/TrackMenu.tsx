import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

import { usePlayerStore } from "../../store/playerStore";
import { usePlaylistsStore } from "../../store/playlistsStore";
import type { Track } from "../../types";
import { CheckIcon, MoreIcon, PlusIcon, QueueIcon, TrashIcon } from "../icons";
import styles from "./TrackMenu.module.css";

const MENU_WIDTH = 260;
const GAP = 6;

export interface ExtraAction {
  label: string;
  onSelect: () => void;
}

interface MenuProps {
  track: Track;
  anchor: HTMLElement;
  extraAction?: ExtraAction;
  onClose: () => void;
}

function Menu({ track, anchor, extraAction, onClose }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  const playlists = usePlaylistsStore((state) => state.playlists);
  const { create, toggleTrack } = usePlaylistsStore.getState();
  const { playNext, addToQueue } = usePlayerStore.getState();

  // The menu is rendered in <body>, so it is placed by the button's coordinates:
  // below the button, or above it when there is no room
  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) return;

    const rect = anchor.getBoundingClientRect();
    const fitsBelow = rect.bottom + GAP + menu.offsetHeight < window.innerHeight;
    const left = Math.min(Math.max(rect.right - MENU_WIDTH, 8), window.innerWidth - MENU_WIDTH - 8);

    menu.style.left = `${left}px`;
    menu.style.top = `${fitsBelow ? rect.bottom + GAP : Math.max(rect.top - GAP - menu.offsetHeight, 8)}px`;
  }, [anchor, isCreating, playlists.length]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!menuRef.current?.contains(target) && !anchor.contains(target)) onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // The menu does not follow its button, so scrolling the page or resizing closes it
    const onScroll = (event: Event) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [anchor, onClose]);

  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = String(new FormData(event.currentTarget).get("name")).trim();

    if (!name) return;

    const playlist = await create(name);

    if (playlist) await toggleTrack(playlist.id, track.id);

    onClose();
  };

  const item = (icon: ReactNode, label: string, onSelect: () => void, isChecked = false) => (
    <button className={styles.item} type="button" role="menuitem" onClick={run(onSelect)}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.itemLabel}>{label}</span>
      {isChecked && <CheckIcon width={16} height={16} />}
    </button>
  );

  return createPortal(
    <div ref={menuRef} className={styles.menu} role="menu" aria-label={`Actions for ${track.title}`}>
      {item(<QueueIcon width={18} height={18} />, "Play next", () => playNext(track.id))}
      {item(<PlusIcon width={18} height={18} />, "Add to queue", () => addToQueue(track.id))}

      <div className={styles.divider} />
      <p className={styles.caption}>Add to playlist</p>

      {playlists.map((playlist) => (
        <div key={playlist.id}>
          {item(
            <span className={styles.dot} />,
            playlist.name,
            () => void toggleTrack(playlist.id, track.id),
            playlist.trackIds.includes(track.id)
          )}
        </div>
      ))}

      {isCreating ? (
        <form className={styles.form} onSubmit={handleCreate}>
          <input
            className={styles.input}
            name="name"
            placeholder="Playlist name"
            aria-label="Playlist name"
            maxLength={40}
            autoFocus
            required
          />
          <button className={styles.create} type="submit">
            Create
          </button>
        </form>
      ) : (
        <button className={styles.item} type="button" role="menuitem" onClick={() => setIsCreating(true)}>
          <span className={styles.icon}>
            <PlusIcon width={18} height={18} />
          </span>
          <span className={styles.itemLabel}>New playlist…</span>
        </button>
      )}

      {extraAction && (
        <>
          <div className={styles.divider} />
          {item(<TrashIcon width={18} height={18} />, extraAction.label, extraAction.onSelect)}
        </>
      )}
    </div>,
    document.body
  );
}

interface Props {
  track: Track;
  // One more action at the bottom, e.g. "Remove from this playlist"
  extraAction?: ExtraAction;
}

// The "⋯" button of a track row with its dropdown menu
function TrackMenu({ track, extraAction }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <button
        className={`${styles.button} ${anchor ? styles.open : ""}`}
        type="button"
        aria-label={`More actions for ${track.title}`}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        <MoreIcon />
      </button>

      {anchor && (
        <Menu track={track} anchor={anchor} extraAction={extraAction} onClose={() => setAnchor(null)} />
      )}
    </>
  );
}

export default TrackMenu;
