// The single audio element of the app plus a Web Audio analyser attached to it.
// Visual effects read the analyser every frame; React state is never involved,
// so playback does not cause re-renders.

export interface Levels {
  // Each value is from 0 to 1
  bass: number;
  mid: number;
  high: number;
}

const SILENCE: Levels = { bass: 0, mid: 0, high: 0 };

export const audio = new Audio();
audio.preload = "metadata";

let context: AudioContext | undefined;
let analyser: AnalyserNode | undefined;
let spectrum: Uint8Array<ArrayBuffer> | undefined;

// Browsers only allow an AudioContext after a user gesture, so the analyser
// is created on the first play, not on page load.
function connectAnalyser() {
  if (context) return;

  try {
    context = new AudioContext();
    analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    spectrum = new Uint8Array(analyser.frequencyBinCount);

    context.createMediaElementSource(audio).connect(analyser);
    analyser.connect(context.destination);
  } catch {
    // Without Web Audio the music still plays, only the effects stay calm
    analyser = undefined;
  }
}

export async function play() {
  connectAnalyser();

  if (context?.state === "suspended") await context.resume();

  await audio.play();
}

export function pause() {
  audio.pause();
}

export function load(src: string) {
  audio.src = src;
}

export function unload() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}

export function seek(time: number) {
  if (!Number.isFinite(audio.duration)) return;

  audio.currentTime = Math.min(Math.max(time, 0), audio.duration);
}

function average(from: number, to: number) {
  let sum = 0;

  for (let i = from; i < to; i++) sum += spectrum![i];

  return sum / (to - from) / 255;
}

// Raw frequency data (0..255 per bin) for visualizers, or null while nothing plays.
// The returned array is reused between calls: read it, do not keep it.
export function getSpectrum() {
  if (!analyser || !spectrum || audio.paused) return null;

  analyser.getByteFrequencyData(spectrum);

  return spectrum;
}

// Current loudness of three frequency bands
export function getLevels(): Levels {
  if (!analyser || !spectrum || audio.paused) return SILENCE;

  analyser.getByteFrequencyData(spectrum);

  // With fftSize 256 one bin is about 170 Hz wide
  return {
    bass: average(1, 5),
    mid: average(5, 30),
    high: average(30, 90),
  };
}
