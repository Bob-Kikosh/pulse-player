import { Link, NavLink } from "react-router-dom";

import { useAuthStore } from "../../store/authStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { HeartIcon, LibraryIcon, LogoIcon, PlaylistIcon } from "../icons";
import styles from "./Navbar.module.css";

const getLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${styles.link} ${isActive ? styles.active : ""}`;

function Navbar() {
  const user = useAuthStore((state) => state.user);
  const isChecking = useAuthStore((state) => state.isChecking);
  const openModal = useAuthStore((state) => state.openModal);
  const favoriteCount = useFavoritesStore((state) => state.ids.length);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} to="/">
          <span className={styles.logo}>
            <LogoIcon />
          </span>
          Pulse
        </Link>

        <nav className={styles.nav} aria-label="Main">
          <NavLink className={getLinkClass} to="/" end>
            <LibraryIcon width={18} height={18} />
            <span className={styles.text}>Library</span>
          </NavLink>

          <NavLink className={getLinkClass} to="/favorites">
            <HeartIcon width={18} height={18} />
            <span className={styles.text}>Favorites</span>
            {favoriteCount > 0 && <span className={styles.count}>{favoriteCount}</span>}
          </NavLink>

          <NavLink className={getLinkClass} to="/playlists">
            <PlaylistIcon width={18} height={18} />
            <span className={styles.text}>Playlists</span>
          </NavLink>
        </nav>

        {/* Nothing is shown until we know whether the visitor is signed in */}
        {!isChecking &&
          (user ? (
            <Link className={styles.user} to="/profile" aria-label={`Profile of ${user.username}`}>
              <span className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</span>
              <span className={styles.username}>{user.username}</span>
            </Link>
          ) : (
            <button className="button button--light button--small" type="button" onClick={openModal}>
              Sign in
            </button>
          ))}
      </div>
    </header>
  );
}

export default Navbar;
