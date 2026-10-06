import { mkdirSync, readFileSync } from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// A tiny JSON-file database: enough for a demo server, and the data survives restarts.
// Shape: { users: { [key]: { username, passwordHash, favorites: string[], playlists: Playlist[] } } }

const FILE = fileURLToPath(new URL("../data/db.json", import.meta.url));

function load() {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    // No file yet, or it is damaged: start with an empty database
    return { users: {} };
  }
}

const db = load();

mkdirSync(dirname(FILE), { recursive: true });

// Writes are queued one after another, so two requests can never interleave in the file
let queue = Promise.resolve();

export function save() {
  queue = queue
    .then(async () => {
      // Write to a temporary file first: a crash in the middle cannot corrupt the database
      await writeFile(`${FILE}.tmp`, JSON.stringify(db, null, 2));
      await rename(`${FILE}.tmp`, FILE);
    })
    .catch((error) => console.error("Could not save the database:", error));

  return queue;
}

// Usernames are case-insensitive: "Alex" and "alex" are the same account
const toKey = (username) => username.trim().toLowerCase();

export function findUser(username) {
  return db.users[toKey(username)];
}

export function createUser(username, passwordHash) {
  const user = { username: username.trim(), passwordHash, favorites: [], playlists: [] };

  db.users[toKey(username)] = user;

  return user;
}
