import cors from "cors";
import express from "express";

import { CLIENT_ORIGIN, PORT } from "./config.js";
import authRoutes from "./routes/auth.js";
import favoritesRoutes from "./routes/favorites.js";
import playlistsRoutes from "./routes/playlists.js";
import { tracks } from "./tracks.js";

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Audio files themselves are served by the client as static assets
app.get("/api/tracks", (req, res) => {
  res.json(tracks);
});

app.use("/api", authRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/playlists", playlistsRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Errors thrown in handlers end up here, including malformed JSON bodies.
// Express recognizes an error handler by its four arguments.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "The request body is not valid JSON" });
  }

  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Pulse API is running on http://localhost:${PORT}`);
});
