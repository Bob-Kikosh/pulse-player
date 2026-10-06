import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import AuthModal from "./components/AuthModal/AuthModal";
import Background from "./components/Background/Background";
import Navbar from "./components/Navbar/Navbar";
import NowPlaying from "./components/NowPlaying/NowPlaying";
import Particles from "./components/Particles/Particles";
import PlayerBar from "./components/PlayerBar/PlayerBar";
import QueuePanel from "./components/QueuePanel/QueuePanel";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useMediaSession } from "./hooks/useMediaSession";
import FavoritesPage from "./pages/FavoritesPage/FavoritesPage";
import LibraryPage from "./pages/LibraryPage/LibraryPage";
import PlaylistPage from "./pages/PlaylistPage/PlaylistPage";
import PlaylistsPage from "./pages/PlaylistsPage/PlaylistsPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import { useAuthStore } from "./store/authStore";
import { usePlayerStore } from "./store/playerStore";
import { useTracksStore } from "./store/tracksStore";
import { useUiStore } from "./store/uiStore";

function App() {
  const isModalOpen = useAuthStore((state) => state.isModalOpen);
  const hasTrack = usePlayerStore((state) => state.currentId !== null);
  const isNowPlayingOpen = useUiStore((state) => state.isNowPlayingOpen);
  const isQueueOpen = useUiStore((state) => state.isQueueOpen);

  useKeyboardShortcuts();
  useMediaSession();

  useEffect(() => {
    void useTracksStore.getState().load();
    void useAuthStore.getState().restoreSession();
  }, []);

  return (
    // HashRouter keeps deep links working on static hosting such as GitHub Pages
    <HashRouter>
      <Background />
      <Particles />

      <div className={`app ${hasTrack ? "app--with-player" : ""}`}>
        <Navbar />

        <main>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/playlists/:id" element={<PlaylistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <PlayerBar />

      {isNowPlayingOpen && <NowPlaying />}
      {isQueueOpen && <QueuePanel />}

      {isModalOpen && <AuthModal />}
    </HashRouter>
  );
}

export default App;
