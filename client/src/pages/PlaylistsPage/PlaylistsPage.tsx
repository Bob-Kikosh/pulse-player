import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { PlaylistIcon, PlusIcon } from "../../components/icons";
import PlaylistCover from "../../components/PlaylistCover/PlaylistCover";
import { useAuthStore } from "../../store/authStore";
import { usePlaylistsStore } from "../../store/playlistsStore";
import { useTracksStore } from "../../store/tracksStore";
import { formatTotalDuration } from "../../utils/format";
import styles from "./PlaylistsPage.module.css";

function PlaylistsPage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const isChecking = useAuthStore((state) => state.isChecking);
  const openModal = useAuthStore((state) => state.openModal);

  const playlists = usePlaylistsStore((state) => state.playlists);
  const isLoading = usePlaylistsStore((state) => state.isLoading);
  const tracks = useTracksStore((state) => state.tracks);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const name = String(new FormData(form).get("name")).trim();

    if (!name) return;

    const playlist = await usePlaylistsStore.getState().create(name);

    if (playlist) {
      form.reset();
      navigate(`/playlists/${playlist.id}`);
    }
  };

  if (isChecking || isLoading) {
    return (
      <div className="page" aria-busy="true">
        <h1 className="page__title">Playlists</h1>
        <div className={styles.grid}>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={`${styles.cardSkeleton} skeleton`} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <div className="empty">
          <PlaylistIcon width={48} height={48} />
          <h1 className="empty__title">Your own playlists</h1>
          <p>Sign in to collect tracks into playlists.</p>
          <button className="button button--light" type="button" onClick={openModal}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page__title">Playlists</h1>

      <form className={styles.form} onSubmit={handleCreate}>
        <input
          className={styles.input}
          name="name"
          placeholder="New playlist name"
          aria-label="New playlist name"
          maxLength={40}
          required
        />
        <button className="button button--light" type="submit">
          <PlusIcon width={18} height={18} />
          Create
        </button>
      </form>

      {playlists.length ? (
        <ul className={styles.grid}>
          {playlists.map((playlist) => {
            const items = playlist.trackIds
              .map((id) => tracks.find((track) => track.id === id))
              .filter((track) => track !== undefined);
            const duration = items.reduce((sum, track) => sum + track.duration, 0);

            return (
              <li key={playlist.id}>
                <Link className={styles.card} to={`/playlists/${playlist.id}`}>
                  <PlaylistCover tracks={items} />
                  <span className={styles.name}>{playlist.name}</span>
                  <span className={styles.meta}>
                    {items.length} {items.length === 1 ? "track" : "tracks"}
                    {duration > 0 && ` · ${formatTotalDuration(duration)}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.hint}>
          No playlists yet. Create one above, or use the “⋯” menu next to any track.
        </p>
      )}
    </div>
  );
}

export default PlaylistsPage;
