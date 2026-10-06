import { useEffect, useRef } from "react";

import { getLevels } from "../../audio/engine";
import { usePlayerStore } from "../../store/playerStore";
import { DEFAULT_COLOR, getTrackColor } from "../../utils/trackColor";
import styles from "./Particles.module.css";

// One particle per this many square pixels of the screen, within the limits below
const AREA_PER_PARTICLE = 26_000;
const MIN_PARTICLES = 16;
const MAX_PARTICLES = 48;
const HEART_SCALE = 10;

interface Particle {
  // Where the particle rests, as a fraction of the screen size
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

// Point of a heart-shaped curve for an angle from 0 to 2π
function getHeartPoint(angle: number) {
  const x = 16 * Math.sin(angle) ** 3;
  const y =
    13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);

  return { x: x * HEART_SCALE, y: -y * HEART_SCALE };
}

// Glowing particles over the background. They float around their places,
// jump away from the center on every bass hit, burst apart when the track
// changes and gather into a heart when a track is liked.
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;

      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Small screens get fewer particles, so they do not cover the content
    const particleCount = Math.round(
      Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, (width * height) / AREA_PER_PARTICLE))
    );

    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const homeX = Math.random();
      const homeY = Math.random();

      return {
        homeX,
        homeY,
        x: homeX * width,
        y: homeY * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
      };
    });

    // Both effects start at 1 and fade out frame by frame
    let burst = 0;
    let heart = 0;

    // The loop reads the store directly: this component never re-renders
    const unsubscribe = usePlayerStore.subscribe((state, previous) => {
      if (state.trackChanges !== previous.trackChanges) burst = 1;
      if (state.likeBursts !== previous.likeBursts) heart = 1;
    });

    const color = { ...DEFAULT_COLOR };
    let energy = 0;
    let previousBass = 0;
    let tick = 0;
    let frame = 0;

    const loop = () => {
      const { currentId, isPlaying } = usePlayerStore.getState();
      const target = currentId ? getTrackColor(currentId) : DEFAULT_COLOR;

      color.h += (target.h - color.h) * 0.05;
      color.s += (target.s - color.s) * 0.05;
      color.l += (target.l - color.l) * 0.05;

      const { bass } = getLevels();
      energy += ((isPlaying ? 0.15 + bass * 0.85 : 0.04) - energy) * 0.15;

      // A sudden rise of the bass is a beat: it kicks the particles outwards
      const kick = Math.max(0, bass - previousBass - 0.03) * 60;
      previousBass = bass;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.fillStyle = ctx.strokeStyle = `hsl(${color.h} ${color.s}% ${Math.min(color.l + 8, 85)}%)`;

      const centerX = width / 2;
      const centerY = height / 2;

      if (burst > 0.01) {
        for (const particle of particles) {
          const angle = Math.random() * Math.PI * 2;
          const force = 4 + Math.random() * 4;

          particle.vx = Math.cos(angle) * force;
          particle.vy = Math.sin(angle) * force;
        }

        burst *= 0.85;
      }

      particles.forEach((particle, index) => {
        if (heart > 0.01) {
          const point = getHeartPoint((index / particles.length) * Math.PI * 2);

          particle.vx += (centerX + point.x - particle.x) * 0.02;
          particle.vy += (centerY + point.y - particle.y) * 0.02;
        } else {
          // A soft spring pulls every particle back to its place
          particle.vx += (particle.homeX * width - particle.x) * 0.0012;
          particle.vy += (particle.homeY * height - particle.y) * 0.0012;

          // Random wandering, so the field never freezes
          particle.vx += (Math.random() - 0.5) * 0.06;
          particle.vy += (Math.random() - 0.5) * 0.06;

          if (kick > 0) {
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const distance = Math.hypot(dx, dy) || 1;

            particle.vx += (dx / distance) * kick;
            particle.vy += (dy / distance) * kick;
          }
        }

        // A slow swirl
        const swirl = Math.sin(tick * 0.01 + index) * 0.002;
        const cos = Math.cos(swirl);
        const sin = Math.sin(swirl);
        const vx = particle.vx * cos - particle.vy * sin;
        const vy = particle.vx * sin + particle.vy * cos;

        particle.vx = vx * 0.96;
        particle.vy = vy * 0.96;
        particle.x += particle.vx * (0.5 + energy);
        particle.y += particle.vy * (0.5 + energy);

        const size = particle.size + energy * 1.8;

        // A tail against the direction of flight: fast particles look like comets
        ctx.globalAlpha = 0.12 + energy * 0.25;
        ctx.lineWidth = size * 1.6;
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.vx * 7, particle.y - particle.vy * 7);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();

        // A soft halo and a bright core
        ctx.globalAlpha = 0.06 + energy * 0.2;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.35 + energy * 0.55;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (heart > 0.01) heart *= 0.985;

      tick++;
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

export default Particles;
