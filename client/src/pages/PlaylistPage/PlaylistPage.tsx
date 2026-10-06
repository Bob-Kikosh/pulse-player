import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { PencilIcon, PlayIcon, ShuffleIcon, TrashIcon } from "../../components/icons";
import PlaylistCover from "../../components/PlaylistCover/PlaylistCover";
import TrackList from "../../components/TrackList/TrackList";
import { useAuthStore } from "../../store/authStore";
import { usePlayerStore } from "../../store/playerStore";
import { usePlaylistsStore } from "../../store/playlistsStore";
import { useTracksStore } from "../../store/tracksStore";
import { formatTotalDuration } from "../../utils/format";
import styles from "./PlaylistPage.module.css";

function PlaylistPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const isChecking = useAuthStore((state) => state.isChecking);
  const isLoading = usePlaylistsStore((state) => state.isLoading);
  const playlist = usePlaylistsStore((state) => state.playlists.find((item) => item.id === id));
  const allTracks = useTracksStore((state) => state.tracks);

  const [isRenaming, setIsRenaming] = useState(false);
  // Deleting takes two clicks: the first one only arms the button
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const tracks = useMemo(
    () =>
      (playlist?.trackIds ?? [])
        .map((trackId) => allTracks.find((track) => track.id === trackId))
        .filter((track) => track !== undefined),
    [playlist, allTracks]
  );

  const handleRemoveTrack = useCallback(
    (trackId: string) => void usePlaylistsStore.getState().removeTrack(id, trackId),
    [id]
  );

  if (isChecking || isLoading) return <div className="page" aria-busy="true" />;
  if (!playlist) return <Navigate to="/playlists" replace />;

  const duration = tracks.reduce((sum, track) => sum + track.duration, 0);
  const ids = tracks.map((track) => track.id);

  const play = (shuffled: boolean) => {
    const { shuffle, toggleShuffle, playTrack } = usePlayerStore.getState();

    if (shuffle !== shuffled) toggleShuffle();

    playTrack(shuffled ? ids[Math.floor(Math.random() * ids.length)] : ids[0], ids);
  };

  const handleRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = String(new FormData(event.currentTarget).get("name")).trim();

    if (name && name !== playlist.name) void usePlaylistsStore.getState().rename(id, name);

    setIsRenaming(false);
  };

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    if (await usePlaylistsStore.getState().remove(id)) {
      toast.success("Playlist deleted");
      navigate("/playlists");
    }
  };

  return (
    <div className="page">
      <Link className={styles.back} to="/playlists">
        ← All playlists
      </Link>

      <header className={styles.header}>
        <div className={styles.cover}>
          <PlaylistCover tracks={tracks} />
        </div>

        <div className={styles.info}>
          <p className={styles.eyebrow}>Playlist</p>

          {isRenaming ? (
            <form className={styles.renameForm} onSubmit={handleRename}>
              <input
                className={styles.renameInput}
                name="name"
                defaultValue={playlist.name}
                aria-label="Playlist name"
                maxLength={40}
                autoFocus
                required
                onBlur={() => setIsRenaming(false)}
              />
            </form>
          ) : (
            <h1 className={styles.title}>
              {playlist.name}
              <button
                className={styles.iconButton}
                type="button"
                aria-label="Rename the playlist"
                title="Rename"
                onClick={() => setIsRenaming(true)}
              >
                <PencilIcon width={18} height={18} />
              </button>
            </h1>
          )}

          <p className={styles.meta}>
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            {duration > 0 && ` · ${formatTotalDuration(duration)}`}
          </p>

          <div className={styles.actions}>
            <button className="button button--light" type="button" disabled={!ids.length} onClick={() => play(false)}>
              <PlayIcon />
              Play
            </button>

            <button className="button button--glass" type="button" disabled={!ids.length} onClick={() => play(true)}>
              <ShuffleIcon width={18} height={18} />
              Shuffle
            </button>

            <button
              className={`button button--glass ${isConfirmingDelete ? styles.danger : ""}`}
              type="button"
              onClick={handleDelete}
              onBlur={() => setIsConfirmingDelete(false)}
            >
              <TrashIcon width={18} height={18} />
              {isConfirmingDelete ? "Click again to delete" : "Delete"}
            </button>
          </div>
        </div>
      </header>

      {tracks.length ? (
        <TrackList tracks={tracks} removeLabel="Remove from this playlist" onRemove={handleRemoveTrack} />
      ) : (
        <p className={styles.hint}>
          This playlist is empty. Open the <Link to="/">library</Link> and add tracks with the “⋯” menu.
        </p>
      )}
    </div>
  );
}

export default PlaylistPage;
