import { useFavoritesStore } from "../../store/favoritesStore";
import type { Track } from "../../types";
import { HeartIcon } from "../icons";
import styles from "./LikeButton.module.css";

interface Props {
  track: Track;
}

function LikeButton({ track }: Props) {
  const isFavorite = useFavoritesStore((state) => state.ids.includes(track.id));
  const toggle = useFavoritesStore((state) => state.toggle);

  const label = isFavorite ? `Remove ${track.title} from favorites` : `Add ${track.title} to favorites`;

  return (
    <button
      className={`${styles.button} ${isFavorite ? styles.active : ""}`}
      type="button"
      aria-label={label}
      aria-pressed={isFavorite}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      onClick={() => void toggle(track.id)}
    >
      <HeartIcon filled={isFavorite} />
    </button>
  );
}

export default LikeButton;
