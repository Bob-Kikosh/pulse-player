import { useEffect, useRef } from "react";

import { getSpectrum } from "../../audio/engine";
import type { Hsl } from "../../utils/trackColor";
import styles from "./Spectrum.module.css";

// The analyser gives 128 bins; the top ones are almost always silent
const USED_BINS = 96;

interface Props {
  color: Hsl;
  // "bars" grow from the bottom edge, "ring" radiates from a circle in the center
  variant?: "bars" | "ring";
  bars?: number;
  // For "ring": radius of the inner circle as a share of the canvas size
  innerRadius?: number;
  className?: string;
}

// Live frequency spectrum of the music, drawn on a canvas every frame
function Spectrum({ color, variant = "bars", bars = 48, innerRadius = 0.32, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The frame loop reads the color from a ref, so a new track does not restart it
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;

    const observer = new ResizeObserver(() => {
      const ratio = window.devicePixelRatio || 1;

      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });

    observer.observe(canvas);

    // Bars are spread over the bins logarithmically, the way we hear pitch:
    // otherwise the left half would be all bass and the right half empty
    const edges = Array.from({ length: bars + 1 }, (_, i) => Math.round(USED_BINS ** (i / bars)));
    const values = new Array<number>(bars).fill(0);

    let tick = 0;
    let frame = 0;

    const draw = () => {
      const data = getSpectrum();

      for (let i = 0; i < bars; i++) {
        let target = 0.04 + Math.sin(tick * 0.03 + i * 0.45) * 0.02;

        if (data) {
          const from = edges[i];
          const to = Math.max(edges[i + 1], from + 1);
          let sum = 0;

          for (let bin = from; bin < to; bin++) sum += data[bin];

          // High frequencies are quieter, so they get a little boost
          target = Math.min(1, (sum / (to - from) / 255) ** 1.4 * (1 + i / bars));
        }

        values[i] += (target - values[i]) * (target > values[i] ? 0.5 : 0.14);
      }

      const { h, s, l } = colorRef.current;

      ctx.clearRect(0, 0, width, height);

      if (variant === "bars") {
        const step = width / bars;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);

        gradient.addColorStop(0, `hsl(${h} ${s}% ${l}% / 0.15)`);
        gradient.addColorStop(1, `hsl(${h} ${s}% ${Math.min(l + 20, 90)}% / 0.95)`);
        ctx.fillStyle = gradient;

        for (let i = 0; i < bars; i++) {
          const barHeight = Math.max(2, values[i] * height);

          ctx.beginPath();
          ctx.roundRect(i * step + step * 0.18, height - barHeight, step * 0.64, barHeight, [step, step, 0, 0]);
          ctx.fill();
        }
      } else {
        const size = Math.min(width, height);
        const inner = size * innerRadius;
        const reach = size / 2 - inner;

        ctx.lineCap = "round";
        ctx.lineWidth = Math.max(2, (inner * Math.PI) / bars / 1.7);

        // Most of the energy is in the lower half of the spectrum. It is repeated
        // four times around the ring, mirrored each time, so the whole circle is alive
        const segment = Math.floor(bars / 2);

        for (let i = 0; i < bars * 2; i++) {
          const offset = i % segment;
          const value = values[Math.floor(i / segment) % 2 ? segment - 1 - offset : offset];
          const angle = (i / (bars * 2)) * Math.PI * 2 - Math.PI / 2;
          const length = 3 + value * reach;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          ctx.strokeStyle = `hsl(${h + value * 40} ${s}% ${l + value * 20}% / ${0.35 + value * 0.65})`;
          ctx.beginPath();
          ctx.moveTo(width / 2 + cos * inner, height / 2 + sin * inner);
          ctx.lineTo(width / 2 + cos * (inner + length), height / 2 + sin * (inner + length));
          ctx.stroke();
        }
      }

      tick++;
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [variant, bars, innerRadius]);

  return <canvas ref={canvasRef} className={`${styles.canvas} ${className}`} aria-hidden="true" />;
}

export default Spectrum;
