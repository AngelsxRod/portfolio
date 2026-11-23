"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  INK,
  SKIN,
  eyes,
  gazeDirection,
  gazeOffset,
  moodShapes,
  type AvatarMood,
  type Rect,
} from "@/lib/os/avatar";
import "@/styles/os/avatar.css";

/* Un solo listener de puntero para todos los avatares de la página. */
type PointerListener = (x: number, y: number) => void;
const listeners = new Set<PointerListener>();
let pointer: { x: number; y: number } | null = null;
let lastMove = 0;
let frame = 0;

function onPointerMove(event: PointerEvent) {
  pointer = { x: event.clientX, y: event.clientY };
  lastMove = performance.now();
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (pointer)
      for (const listener of listeners) listener(pointer.x, pointer.y);
  });
}

function followPointer(listener: PointerListener) {
  if (listeners.size === 0)
    window.addEventListener("pointermove", onPointerMove, { passive: true });
  listeners.add(listener);
  if (pointer) listener(pointer.x, pointer.y);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0)
      window.removeEventListener("pointermove", onPointerMove);
  };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Atributos SVG de un rectángulo del módulo `lib/os/avatar`. */
const rectProps = ({ x, y, w, h }: Rect) => ({ x, y, width: w, height: h });

const CONFETTI = ["var(--os-lime)", "var(--os-orange)", "var(--os-bone)"];
type Piece = {
  dx: number;
  dy: number;
  rot: number;
  color: string;
  delay: number;
};

function makeConfetti(): Piece[] {
  return Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
    const reach = 46 + Math.random() * 34;
    return {
      dx: Math.round(Math.cos(angle) * reach),
      dy: Math.round(Math.sin(angle) * reach) - 18,
      rot: Math.round(Math.random() * 540 - 270),
      color: CONFETTI[i % CONFETTI.length]!,
      delay: Math.round(Math.random() * 60),
    };
  });
}

/**
 * Avatar pixelado de Kaled en un marco plano como el resto de angel.os.
 * Es identidad de marca (archivo estático), no contenido del CMS. Con
 * `interactive` sus ojos siguen el cursor, parpadea y reacciona al clic; con
 * «reducir movimiento» solo conserva la expresión.
 */
export function ProfileAvatar({
  alt = "Avatar de Kaled",
  size = 128,
  variant = "lime",
  mood = "idle",
  interactive = false,
  celebrate = false,
  onActivate,
  className,
}: {
  alt?: string;
  size?: number;
  variant?: "lime" | "orange";
  mood?: AvatarMood;
  interactive?: boolean;
  /** Suelta confeti una vez al montarse (p. ej. al enviar el formulario). */
  celebrate?: boolean;
  onActivate?: () => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLElement>(null);
  const faceRef = useRef<SVGSVGElement>(null);
  const [reaction, setReaction] = useState<AvatarMood | null>(null);
  const [jump, setJump] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const timers = useRef<number[]>([]);
  const shown = reaction ?? mood;
  const alive = interactive && !reduced;

  function look(nx: number, ny: number) {
    const face = faceRef.current;
    if (!face) return;
    const left = gazeOffset(eyes.left, nx, ny);
    const right = gazeOffset(eyes.right, nx, ny);
    face.style.setProperty("--lx", `${left.dx}px`);
    face.style.setProperty("--ly", `${left.dy}px`);
    face.style.setProperty("--rx", `${right.dx}px`);
    face.style.setProperty("--ry", `${right.dy}px`);
  }

  // Las pupilas siguen al cursor (salvo si está confundido: mira alrededor).
  useEffect(() => {
    if (!alive || mood === "confused") return;
    return followPointer((x, y) => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { nx, ny } = gazeDirection(
        x - (rect.left + rect.width / 2),
        y - (rect.top + rect.height / 2),
      );
      look(nx, ny);
    });
  }, [alive, mood]);

  // Parpadeo aleatorio y mirada errante cuando nadie mueve el ratón.
  useEffect(() => {
    if (!alive) return;
    const face = faceRef.current;
    let blinkTimer = 0;
    let wanderTimer = 0;
    const blink = () => {
      face?.setAttribute("data-blink", "");
      window.setTimeout(() => face?.removeAttribute("data-blink"), 140);
      blinkTimer = window.setTimeout(blink, 2500 + Math.random() * 3500);
    };
    const wander = () => {
      const wanders = mood === "confused";
      if (wanders || performance.now() - lastMove > 3500)
        look(Math.random() * 2 - 1, Math.random() * 2 - 1);
      wanderTimer = window.setTimeout(
        wander,
        wanders ? 900 : 4000 + Math.random() * 4000,
      );
    };
    blinkTimer = window.setTimeout(blink, 1500);
    wanderTimer = window.setTimeout(wander, mood === "confused" ? 300 : 5000);
    return () => {
      window.clearTimeout(blinkTimer);
      window.clearTimeout(wanderTimer);
    };
  }, [alive, mood]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!celebrate || reduced) return;
    setPieces(makeConfetti());
    const timer = window.setTimeout(() => setPieces([]), 1100);
    return () => window.clearTimeout(timer);
  }, [celebrate, reduced]);

  function activate() {
    onActivate?.();
    setReaction("happy");
    timers.current.push(window.setTimeout(() => setReaction(null), 1100));
    if (reduced) return;
    setJump(true);
    setPieces(makeConfetti());
    timers.current.push(
      window.setTimeout(() => setJump(false), 520),
      window.setTimeout(() => setPieces([]), 1100),
    );
  }

  const art = (
    <span className="os-avatar-art" data-jump={jump ? "" : undefined}>
      {/* SVG estático de 25 KB: next/image no aporta nada y rompería el pixelado. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/avatar-kaled-base.svg"
        alt={interactive ? "" : alt}
        width={size}
        height={size}
        decoding="async"
        draggable={false}
      />
      <svg
        ref={faceRef}
        className="os-avatar-face"
        viewBox="0 0 256 256"
        shapeRendering="crispEdges"
        data-mood={shown}
        aria-hidden="true"
      >
        {moodShapes[shown].map((shape, index) => (
          <rect key={index} {...rectProps(shape)} fill={shape.fill} />
        ))}
        <rect
          className="os-pupil os-pupil-left"
          {...rectProps(eyes.left.pupil)}
          fill={INK}
        />
        <rect
          className="os-pupil os-pupil-right"
          {...rectProps(eyes.right.pupil)}
          fill={INK}
        />
        <rect className="os-lid" {...rectProps(eyes.left.box)} fill={SKIN} />
        <rect className="os-lid" {...rectProps(eyes.right.box)} fill={SKIN} />
      </svg>
    </span>
  );

  return (
    <span
      className={`os-avatar os-avatar-${variant}${className ? ` ${className}` : ""}`}
      style={{ "--os-avatar-size": `${size}px` } as CSSProperties}
    >
      {interactive ? (
        <button
          type="button"
          ref={frameRef as React.RefObject<HTMLButtonElement>}
          className="os-avatar-frame"
          aria-label={`${alt}. Haz clic para saludar`}
          onClick={activate}
        >
          {art}
        </button>
      ) : (
        <span
          ref={frameRef as React.RefObject<HTMLSpanElement>}
          className="os-avatar-frame"
        >
          {art}
        </span>
      )}
      {pieces.length > 0 && (
        <span className="os-confetti" aria-hidden="true">
          {pieces.map((piece, index) => (
            <span
              key={index}
              style={
                {
                  "--dx": `${piece.dx}px`,
                  "--dy": `${piece.dy}px`,
                  "--rot": `${piece.rot}deg`,
                  "--c": piece.color,
                  animationDelay: `${piece.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      )}
    </span>
  );
}
