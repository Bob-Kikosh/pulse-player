import { useMemo } from "react";
import { Link } from "react-router-dom";

import { HeartIcon } from "../../components/icons";
import TrackList from "../../components/TrackList/TrackList";
import { useAuthStore } from "../../store/authStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useTracksStore } from "../../store/tracksStore";

function FavoritesPage() {
  const user = useAuthStore((state) => state.user);
  const isChecking = useAuthStore((state) => state.isChecking);
  const openModal = useAuthStore((state) => state.openModal);

  const ids = useFavoritesStore((state) => state.ids);
  const isLoading = useFavoritesStore((state) => state.isLoading);
  const tracks = useTracksStore((state) => state.tracks);

  // Newest favorites first
  const favorites = useMemo(
    () =>
      [...ids]
        .reverse()
        .map((id) => tracks.find((track) => track.id === id))
        .filter((track) => track !== undefined),
    [ids, tracks]
  );

  if (isChecking || isLoading) {
    return (
      <div className="page" aria-busy="true">
        <h1 className="page__title">Favorites</h1>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton skeleton--row" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <div className="empty">
          <HeartIcon width={48} height={48} />
          <h1 className="empty__title">Keep the tracks you love</h1>
          <p>Sign in to build your own list of favorites.</p>
          <button className="button button--light" type="button" onClick={openModal}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (!favorites.length) {
    return (
      <div className="page">
        <div className="empty">
          <HeartIcon width={48} height={48} />
          <h1 className="empty__title">No favorites yet</h1>
          <p>Tap the heart next to a track and it will appear here.</p>
          <Link className="button button--light" to="/">
            Open the library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page__title">Favorites</h1>
      <TrackList tracks={favorites} />
    </div>
  );
}

export default FavoritesPage;
