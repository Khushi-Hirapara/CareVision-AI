"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient hero background with soft cursor-reactive pulse rings.
 * Rings stay visible at rest and gently follow the pointer.
 */
export function HomeHeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorPulseRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const readyRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const pulse = cursorPulseRef.current;
    if (!root || !pulse) return;

    const hero = root.closest(".home-hero");
    if (!(hero instanceof HTMLElement)) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const placeDefault = () => {
      const rect = hero.getBoundingClientRect();
      // Left-center area — open space beside the dashboard preview.
      targetRef.current = {
        x: rect.width * 0.28,
        y: rect.height * 0.42,
      };
      if (!readyRef.current) {
        currentRef.current = { ...targetRef.current };
        readyRef.current = true;
      }
    };

    placeDefault();

    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        placeDefault();
        root.classList.remove("is-cursor-active");
        return;
      }

      targetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      root.classList.add("is-cursor-active");
    };

    const onLeave = () => {
      placeDefault();
      root.classList.remove("is-cursor-active");
    };

    const tick = () => {
      if (!reduceMotion.matches) {
        const current = currentRef.current;
        const target = targetRef.current;
        current.x += (target.x - current.x) * 0.1;
        current.y += (target.y - current.y) * 0.1;

        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const speed = Math.min(1, Math.hypot(dx, dy) / 40);

        pulse.style.transform = `translate(${current.x}px, ${current.y}px) translate(-50%, -50%) scale(${(0.95 + speed * 0.28).toFixed(3)})`;
        pulse.style.opacity = String(0.85 + speed * 0.15);
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", placeDefault);
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", placeDefault);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div ref={rootRef} className="home-hero-bg" aria-hidden>
      <div className="home-hero-bg__base" />
      <div className="home-hero-bg__mesh" />
      <div className="home-hero-bg__grid" />

      <span className="home-hero-bg__orb home-hero-bg__orb--a" />
      <span className="home-hero-bg__orb home-hero-bg__orb--b" />
      <span className="home-hero-bg__orb home-hero-bg__orb--c" />

      {/* Cursor-following pulse — positioned via JS for reliable visibility */}
      <div
        ref={cursorPulseRef}
        className="home-hero-bg__pulse home-hero-bg__pulse--cursor"
      >
        <span className="home-hero-bg__pulse-core" />
        <span className="home-hero-bg__ring home-hero-bg__ring--1" />
        <span className="home-hero-bg__ring home-hero-bg__ring--2" />
        <span className="home-hero-bg__ring home-hero-bg__ring--3" />
      </div>

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
