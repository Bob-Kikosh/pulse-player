import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { PauseIcon, PlayIcon, SearchIcon, ShuffleIcon } from "../../components/icons";
import LikeButton from "../../components/LikeButton/LikeButton";
import Spectrum from "../../components/Spectrum/Spectrum";
import TrackList from "../../components/TrackList/TrackList";
import Vinyl from "../../components/Vinyl/Vinyl";
import { useCurrentTrack } from "../../hooks/usePlayer";
import { usePlayerStore } from "../../store/playerStore";
import { useUiStore } from "../../store/uiStore";
import { useTracksStore } from "../../store/tracksStore";
import type { Track } from "../../types";
import { formatTotalDuration } from "../../utils/format";
import { getTrackColor, toCss } from "../../utils/trackColor";
import styles from "./LibraryPage.module.css";

const SKELETON_ROWS = 8;

interface HeroProps {
  tracks: Track[];
}

// The big block on top: shows the current track, or the first one before anything is played
function Hero({ tracks }: HeroProps) {
  const current = useCurrentTrack();
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const track = current ?? tracks[0];
  const totalDuration = tracks.reduce((sum, item) => sum + item.duration, 0);
  const color = getTrackColor(track.id);

  const playShuffled = () => {
    const { shuffle, toggleShuffle, playTrack } = usePlayerStore.getState();
    const ids = tracks.map((item) => item.id);

    if (!shuffle) toggleShuffle();

    playTrack(ids[Math.floor(Math.random() * ids.length)], ids);
  };

  return (
    <section className={styles.hero} style={{ "--accent": toCss(color) } as CSSProperties}>
      {/* The live spectrum of the music fills the bottom of the block */}
      <div className={styles.spectrum}>
        <Spectrum color={color} bars={72} />
      </div>

      <button
        className={styles.cover}
        type="button"
        aria-label="Open the full-screen player"
        disabled={!current}
        onClick={() => useUiStore.getState().setNowPlayingOpen(true)}
      >
        <Vinyl key={track.id} track={track} isSpinning={isPlaying} />
      </button>

      <div className={styles.heroText}>
        <p className={styles.eyebrow}>{current ? (isPlaying ? "Now playing" : "Paused") : "Start listening"}</p>
        <h1 className={styles.heroTitle}>{track.title}</h1>
        <p className={styles.heroArtist}>{track.artist}</p>

        <div className={styles.heroActions}>
          <button className="button button--light" type="button" onClick={usePlayerStore.getState().toggle}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button className="button button--glass" type="button" onClick={playShuffled}>
            <ShuffleIcon width={18} height={18} />
            Shuffle
          </button>

          <span className={styles.like}>
            <LikeButton track={track} />
          </span>
        </div>

        <p className={styles.stats}>
          {tracks.length} tracks · {formatTotalDuration(totalDuration)}
        </p>
      </div>
    </section>
  );
}

function LibraryPage() {
  const tracks = useTracksStore((state) => state.tracks);
  const status = useTracksStore((state) => state.status);
  const reload = useTracksStore((state) => state.load);

  const [query, setQuery] = useState("");

  const visibleTracks = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) return tracks;

    return tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(text));
  }, [tracks, query]);

  if (status === "loading") {
    return (
      <div className="page" aria-busy="true">
        <div className={`${styles.hero} ${styles.heroSkeleton} skeleton`} />
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div key={index} className={`${styles.rowSkeleton} skeleton`} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page">
        <div className="empty">
          <h1 className="empty__title">Could not load the library</h1>
          <p>Check that the server is running and try again.</p>
          <button className="button button--light" type="button" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Hero tracks={tracks} />

      <div className={styles.toolbar}>
        <h2 className={styles.heading}>Library</h2>

        <label className={styles.search}>
          <SearchIcon width={18} height={18} />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search tracks or artists"
            aria-label="Search tracks or artists"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {visibleTracks.length ? (
        <TrackList tracks={visibleTracks} />
      ) : (
        <p className={styles.nothing}>Nothing found for “{query.trim()}”</p>
      )}

      <p className={styles.credits}>
        Music by{" "}
        {[...new Map(tracks.map((track) => [track.artist, track])).values()].map((track, index, all) => (
          <span key={track.artist}>
            <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer">
              {track.artist}
            </a>
            {index < all.length - 1 ? ", " : ""}
          </span>
        ))}
        . Licensed under{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
          Creative Commons Attribution
        </a>
        .
      </p>
    </div>
  );
}

export default LibraryPage;
