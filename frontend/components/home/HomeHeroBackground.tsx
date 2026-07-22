"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Ambient hero background with soft cursor-reactive pulse rings.
 */
export function HomeHeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0.72, y: 0.28 });
  const currentRef = useRef({ x: 0.72, y: 0.28 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const hero = root.closest(".home-hero");
    if (!(hero instanceof HTMLElement)) return;

    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      targetRef.current = {
        x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
      };
    };

    const onLeave = () => {
      targetRef.current = { x: 0.72, y: 0.28 };
    };

    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;
      // Soft lag so rings follow the cursor smoothly, not rigidly.
      current.x += (target.x - current.x) * 0.075;
      current.y += (target.y - current.y) * 0.075;

      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const speed = Math.min(1, Math.hypot(dx, dy) * 14);

      root.style.setProperty("--mx", current.x.toFixed(4));
      root.style.setProperty("--my", current.y.toFixed(4));
      root.style.setProperty("--mspeed", speed.toFixed(3));
      root.classList.toggle("is-cursor-active", speed > 0.02);

      rafRef.current = window.requestAnimationFrame(tick);
    };

    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="home-hero-bg"
      style={
        {
          ["--mx"]: 0.72,
          ["--my"]: 0.28,
          ["--mspeed"]: 0,
        } as CSSProperties
      }
      aria-hidden
    >
      <div className="home-hero-bg__base" />
      <div className="home-hero-bg__mesh" />
      <div className="home-hero-bg__grid" />

      <span className="home-hero-bg__orb home-hero-bg__orb--a" />
      <span className="home-hero-bg__orb home-hero-bg__orb--b" />
      <span className="home-hero-bg__orb home-hero-bg__orb--c" />

      {/* Cursor-following pulse */}
      <div className="home-hero-bg__pulse home-hero-bg__pulse--cursor">
        <span className="home-hero-bg__pulse-core" />
        <span className="home-hero-bg__ring home-hero-bg__ring--1" />
        <span className="home-hero-bg__ring home-hero-bg__ring--2" />
        <span className="home-hero-bg__ring home-hero-bg__ring--3" />
      </div>

      {/* Ambient secondary pulses */}
      <div className="home-hero-bg__pulse home-hero-bg__pulse--secondary">
        <span className="home-hero-bg__pulse-core home-hero-bg__pulse-core--sm" />
        <span className="home-hero-bg__ring home-hero-bg__ring--1" />
        <span className="home-hero-bg__ring home-hero-bg__ring--2" />
        <span className="home-hero-bg__ring home-hero-bg__ring--3" />
      </div>

      <div className="home-hero-bg__pulse home-hero-bg__pulse--accent">
        <span className="home-hero-bg__pulse-core home-hero-bg__pulse-core--xs" />
        <span className="home-hero-bg__ring home-hero-bg__ring--1" />
        <span className="home-hero-bg__ring home-hero-bg__ring--2" />
      </div>

      <span className="home-hero-bg__beam" />

      <span className="home-hero-bg__dot home-hero-bg__dot--1" />
      <span className="home-hero-bg__dot home-hero-bg__dot--2" />
      <span className="home-hero-bg__dot home-hero-bg__dot--3" />
      <span className="home-hero-bg__dot home-hero-bg__dot--4" />
      <span className="home-hero-bg__dot home-hero-bg__dot--5" />
    </div>
  );
}
