import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { audio, getLevels, seek } from "../../audio/engine";
import { useCurrentTime } from "../../hooks/usePlayer";
import type { Track } from "../../types";
import { formatTime } from "../../utils/format";
import { getTrackColor } from "../../utils/trackColor";
import styles from "./Waveform.module.css";

const BAR_WIDTH = 3;
const BAR_GAP = 2;
// Share of the height above the middle line; the rest is a dimmer reflection
const TOP_SHARE = 0.64;

interface Props {
  track: Track;
}

// The real waveform of the track, used as a seek bar. The canvas is redrawn
// every frame from `audio.currentTime`, without going through React state.
function Waveform({ track }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Position under the pointer (0..1): `hover` for the tooltip, `drag` while seeking
  const hoverRef = useRef<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const [tooltip, setTooltip] = useState<number | null>(null);
  const currentTime = useCurrentTime();

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!root || !canvas || !ctx) return;

    let width = 0;
    let height = 0;

    const observer = new ResizeObserver(() => {
      const ratio = window.devicePixelRatio || 1;

      width = root.clientWidth;
      height = root.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });

    observer.observe(root);

    const { h, s } = getTrackColor(track.id);
    const { peaks, duration } = track;

    let bass = 0;
    let tick = 0;
    let frame = 0;

    const draw = () => {
      const step = BAR_WIDTH + BAR_GAP;
      const barCount = Math.floor(width / step);
      const progress = dragRef.current ?? (duration ? audio.currentTime / duration : 0);
      const hover = hoverRef.current;
      const middle = height * TOP_SHARE;
      const isPlaying = !audio.paused;

      const levels = getLevels();
      bass += (levels.bass - bass) * (levels.bass > bass ? 0.5 : 0.15);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const position = i / barCount;
        const peak = peaks[Math.floor(position * peaks.length)] ?? 0;
        const distance = (position - progress) * barCount;
        const isPlayed = position < progress;

        // Bars around the playhead jump with the bass…
        let scale = 1 + bass * 0.9 * Math.exp(-(distance * distance) / 60);

        // …and a slow ripple runs through the part still to come
        if (isPlaying && !isPlayed) scale += Math.sin(tick * 0.06 - i * 0.35) * 0.06;

        const top = Math.max(1.5, peak * middle * 0.86 * scale);
        const bottom = top * 0.42;
        const x = i * step;

        if (isPlayed) {
          // The played part gets brighter towards the playhead
          const glow = Math.exp(-(distance * distance) / 500);

          ctx.fillStyle = `hsl(${h} ${s}% ${68 + glow * 24}%)`;
        } else {
          ctx.fillStyle = hover !== null && position < hover ? "rgb(255 255 255 / 0.55)" : "rgb(255 255 255 / 0.24)";
        }

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.roundRect(x, middle - top, BAR_WIDTH, top, 1.5);
        ctx.fill();

        ctx.globalAlpha = 0.38;
        ctx.beginPath();
        ctx.roundRect(x, middle + 1.5, BAR_WIDTH, bottom, 1.5);
        ctx.fill();
      }

      // The playhead: a glowing line that flares on every beat
      if (progress > 0) {
        const x = Math.min(progress * barCount * step, width - 1);

        ctx.globalAlpha = 1;
        ctx.shadowColor = `hsl(${h} ${s}% 70%)`;
        ctx.shadowBlur = 8 + bass * 22;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.roundRect(x - 1, 0, 2, height, 1);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      tick++;
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [track]);

  const getPosition = (event: PointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();

    return Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
  };

  const handlePointerDown = (event: PointerEvent) => {
    // Capturing keeps the drag alive when the pointer leaves the waveform
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = getPosition(event);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const position = getPosition(event);

    hoverRef.current = position;
    setTooltip(position);

    if (dragRef.current !== null) dragRef.current = position;
  };

  const handlePointerUp = () => {
    if (dragRef.current === null) return;

    seek(dragRef.current * track.duration);
    dragRef.current = null;
  };

  const handlePointerLeave = () => {
    hoverRef.current = null;
    setTooltip(null);
  };

  return (
    <div
      ref={rootRef}
      className={styles.waveform}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(track.duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={`${formatTime(currentTime)} of ${formatTime(track.duration)}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <canvas ref={canvasRef} className={styles.canvas} />

      {tooltip !== null && (
        <span className={styles.tooltip} style={{ left: `${tooltip * 100}%` }}>
          {formatTime(tooltip * track.duration)}
        </span>
      )}
    </div>
  );
}

export default Waveform;
