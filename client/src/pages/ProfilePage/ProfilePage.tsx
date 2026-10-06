import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { api } from "../../api";
import { UserIcon } from "../../components/icons";
import { useAuthStore } from "../../store/authStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { usePlayerStore } from "../../store/playerStore";
import { useTracksStore } from "../../store/tracksStore";
import { formatTotalDuration } from "../../utils/format";
import styles from "./ProfilePage.module.css";

const SHORTCUTS = [
  ["Space", "Play or pause"],
  ["← →", "Seek 5 seconds"],
  ["↑ ↓", "Volume"],
  ["N / P", "Next or previous track"],
  ["L", "Like the current track"],
  ["S / R / M", "Shuffle, repeat, mute"],
  ["F", "Full-screen player"],
  ["Q", "Queue"],
];

function ProfilePage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const isChecking = useAuthStore((state) => state.isChecking);
  const openModal = useAuthStore((state) => state.openModal);
  const logout = useAuthStore((state) => state.logout);

  const favoriteIds = useFavoritesStore((state) => state.ids);
  const tracks = useTracksStore((state) => state.tracks);

  if (isChecking) return <div className="page" aria-busy="true" />;

  if (!user) {
    return (
      <div className="page">
        <div className="empty">
          <UserIcon width={48} height={48} />
          <h1 className="empty__title">You are not signed in</h1>
          <p>Sign in to see your profile and favorites.</p>
          <button className="button button--light" type="button" onClick={openModal}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const favoriteDuration = tracks
    .filter((track) => favoriteIds.includes(track.id))
    .reduce((sum, track) => sum + track.duration, 0);

  const handleLogout = async () => {
    try {
      await logout();
      usePlayerStore.getState().stop();
      navigate("/");
    } catch {
      toast.error("Could not sign out");
    }
  };

  return (
    <div className="page">
      <section className={styles.card}>
        <span className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</span>

        <div className={styles.info}>
          <h1 className={styles.name}>{user.username}</h1>
          <p className={styles.role}>Listener</p>
        </div>

        <button className="button button--glass" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </section>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Favorites</dt>
          <dd>{favoriteIds.length}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Favorite music</dt>
          <dd>{favoriteDuration ? formatTotalDuration(favoriteDuration) : "—"}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Tracks in library</dt>
          <dd>{tracks.length}</dd>
        </div>
      </dl>

      <section className={styles.shortcuts}>
        <h2 className={styles.heading}>Keyboard shortcuts</h2>
        <ul className={styles.shortcutList}>
          {SHORTCUTS.map(([keys, action]) => (
            <li key={keys} className={styles.shortcut}>
              <kbd>{keys}</kbd>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </section>

      {api.isDemo && (
        <p className={styles.note}>
          Demo mode: this account and its favorites are stored only in this browser.
        </p>
      )}
    </div>
  );
}

export default ProfilePage;
