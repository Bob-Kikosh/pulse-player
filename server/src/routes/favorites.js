import { Router } from "express";

import { save } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { isTrackId } from "../tracks.js";

const router = Router();

router.use(requireAuth);

// Ids of the user's favorite tracks, oldest first
router.get("/", (req, res) => {
  res.json(req.user.favorites);
});

router.put("/:trackId", async (req, res) => {
  const { trackId } = req.params;

  if (!isTrackId(trackId)) return res.status(404).json({ message: "Track not found" });

  if (!req.user.favorites.includes(trackId)) {
    req.user.favorites.push(trackId);
    await save();
  }

  res.status(204).end();
});

router.delete("/:trackId", async (req, res) => {
  req.user.favorites = req.user.favorites.filter((id) => id !== req.params.trackId);
  await save();

  res.status(204).end();
});

export default router;
