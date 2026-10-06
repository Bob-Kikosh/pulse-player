import { randomUUID } from "node:crypto";
import { Router } from "express";

import { save } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { isTrackId } from "../tracks.js";

const MAX_NAME_LENGTH = 40;
const MAX_PLAYLISTS = 50;

const router = Router();

router.use(requireAuth);

// Returns a clean playlist name, or null if the value is not acceptable
function parseName(value) {
  if (typeof value !== "string") return null;

  const name = value.trim();

  return name && name.length <= MAX_NAME_LENGTH ? name : null;
}

router.get("/", (req, res) => {
  res.json(req.user.playlists);
});

router.post("/", async (req, res) => {
  const name = parseName(req.body?.name);

  if (!name) {
    return res.status(400).json({ message: `The name must be 1–${MAX_NAME_LENGTH} characters` });
  }

  if (req.user.playlists.length >= MAX_PLAYLISTS) {
    return res.status(400).json({ message: "You have reached the limit of playlists" });
  }

  const playlist = { id: randomUUID(), name, trackIds: [] };

  req.user.playlists.push(playlist);
  await save();

  res.status(201).json(playlist);
});

// Renames a playlist and/or replaces its track list
router.patch("/:id", async (req, res) => {
  const playlist = req.user.playlists.find((item) => item.id === req.params.id);

  if (!playlist) return res.status(404).json({ message: "Playlist not found" });

  const { name, trackIds } = req.body ?? {};

  if (name !== undefined) {
    const parsed = parseName(name);

    if (!parsed) {
      return res.status(400).json({ message: `The name must be 1–${MAX_NAME_LENGTH} characters` });
    }

    playlist.name = parsed;
  }

  if (trackIds !== undefined) {
    if (!Array.isArray(trackIds) || !trackIds.every(isTrackId)) {
      return res.status(400).json({ message: "The track list contains unknown tracks" });
    }

    // A track can be in a playlist only once
    playlist.trackIds = [...new Set(trackIds)];
  }

  await save();

  res.json(playlist);
});

router.delete("/:id", async (req, res) => {
  req.user.playlists = req.user.playlists.filter((item) => item.id !== req.params.id);
  await save();

  res.status(204).end();
});

export default router;
