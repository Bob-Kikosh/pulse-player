// Builds client/src/data/tracks.json: decodes every MP3 once and stores its
// duration and waveform peaks, so the player never has to download a whole
// file just to draw its waveform.
//
// Usage (from the "scripts" folder): npm install && npm run build-tracks

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import decode from "audio-decode";

const PEAK_COUNT = 240;

const root = new URL("../", import.meta.url);
const audioDir = new URL("client/public/audio/", root);
const output = new URL("client/src/data/tracks.json", root);

const LICENSES = {
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
};

const SOURCES = {
  "Kevin MacLeod": { license: "CC BY 4.0", sourceUrl: "https://incompetech.com/" },
  "Jason Shaw": { license: "CC BY 4.0", sourceUrl: "https://audionautix.com/" },
  "Broke For Free": { license: "CC BY 3.0", sourceUrl: "https://freemusicarchive.org/music/Broke_For_Free/" },
  Tours: { license: "CC BY 3.0", sourceUrl: "https://freemusicarchive.org/music/Tours/" },
};

// Playlist order
const TRACKS = [
  ["night-owl", "Night Owl", "Broke For Free"],
  ["enthusiast", "Enthusiast", "Tours"],
  ["werq", "Werq", "Kevin MacLeod"],
  ["neon-laser-horizon", "Neon Laser Horizon", "Kevin MacLeod"],
  ["funkorama", "Funkorama", "Kevin MacLeod"],
  ["rocket", "Rocket", "Kevin MacLeod"],
  ["electrodoodle", "Electrodoodle", "Kevin MacLeod"],
  ["voxel-revolution", "Voxel Revolution", "Kevin MacLeod"],
  ["galactic-rap", "Galactic Rap", "Kevin MacLeod"],
  ["movement-proposition", "Movement Proposition", "Kevin MacLeod"],
  ["big-car-theft", "Big Car Theft", "Jason Shaw"],
  ["funky-junky", "Funky Junky", "Jason Shaw"],
  ["carefree", "Carefree", "Kevin MacLeod"],
  ["monkeys-spinning-monkeys", "Monkeys Spinning Monkeys", "Kevin MacLeod"],
  ["sneaky-snitch", "Sneaky Snitch", "Kevin MacLeod"],
  ["fluffing-a-duck", "Fluffing a Duck", "Kevin MacLeod"],
];

// Loudest sample of each slice, normalized to 0..1
function getPeaks(samples) {
  const blockSize = Math.floor(samples.length / PEAK_COUNT);
  const peaks = [];

  for (let block = 0; block < PEAK_COUNT; block++) {
    let sum = 0;

    for (let i = block * blockSize; i < (block + 1) * blockSize; i++) {
      sum += samples[i] * samples[i];
    }

    peaks.push(Math.sqrt(sum / blockSize));
  }

  const max = Math.max(...peaks) || 1;

  return peaks.map((peak) => Math.round((peak / max) * 100) / 100);
}

const tracks = [];

for (const [id, title, artist] of TRACKS) {
  const buffer = await decode(await readFile(new URL(`${id}.mp3`, audioDir)));
  const { license, sourceUrl } = SOURCES[artist];

  tracks.push({
    id,
    title,
    artist,
    src: `audio/${id}.mp3`,
    duration: Math.round(buffer.duration),
    license,
    licenseUrl: LICENSES[license],
    sourceUrl,
    peaks: getPeaks(buffer.getChannelData(0)),
  });

  console.log(`${title} — ${Math.round(buffer.duration)}s`);
}

// One track per line keeps the file readable and the diffs small
const json = `[\n${tracks.map((track) => `  ${JSON.stringify(track)}`).join(",\n")}\n]\n`;

await writeFile(output, json);
console.log(`Saved ${tracks.length} tracks to ${fileURLToPath(output)}`);
