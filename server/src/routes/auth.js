import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";

import { JWT_LIFETIME, JWT_SECRET } from "../config.js";
import { createUser, findUser, save } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const USERNAME_PATTERN = /^[\p{L}\p{N}_.-]{3,24}$/u;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 100;

const router = Router();

function respondWithSession(res, user, status = 200) {
  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: JWT_LIFETIME });

  res.status(status).json({ token, user: { username: user.username } });
}

router.post("/register", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== "string" || !USERNAME_PATTERN.test(username.trim())) {
    return res.status(400).json({
      message: "The username must be 3–24 characters: letters, digits, dots, dashes or underscores",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return res.status(400).json({ message: `The password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  if (findUser(username)) {
    return res.status(409).json({ message: "This username is already taken" });
  }

  const user = createUser(username, await bcrypt.hash(password, 10));
  await save();

  respondWithSession(res, user, 201);
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  const user = typeof username === "string" ? findUser(username) : undefined;

  // The same answer for an unknown user and a wrong password: it does not reveal which accounts exist
  if (!user || typeof password !== "string" || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Wrong username or password" });
  }

  respondWithSession(res, user);
});

router.get("/profile", requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

export default router;
