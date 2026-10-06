import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config.js";
import { findUser } from "../db.js";

// Requires a valid "Authorization: Bearer <token>" header and puts the account into req.user
export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Please sign in first" });
  }

  try {
    const { username } = jwt.verify(token, JWT_SECRET);
    const user = findUser(username);

    // The token is valid, but the account no longer exists
    if (!user) throw new Error("Unknown user");

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please sign in again" });
  }
}
