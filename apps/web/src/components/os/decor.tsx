import type { CSSProperties, ReactNode } from "react";
import type { Point } from "@/lib/os/desktop";
import { DesktopItem } from "@/components/os/desktop-item";

/** Forma plana flotante, solo decorativa. */
export function Blob({
  shape,
  style,
}: {
  shape: "circle" | "pill" | "ring";
  style: CSSProperties;
}) {
  return (
    <div
      className={`os-blob os-blob-${shape}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/** Nota adhesiva del escritorio; su texto y enlace sí son contenido. */
export function StickyNote({
  id,
  title,
  children,
  defaultPosition,
  stack,
  tilt = -3,
  delay = 0,
}: {
  id: string;
  title: string;
  children: ReactNode;
  defaultPosition: Point;
  stack?: string;
  tilt?: number;
  delay?: number;
}) {
  return (
    <DesktopItem
      id={id}
      label={title}
      as="aside"
      className="os-note"
      defaultPosition={defaultPosition}
      width={260}
      stack={stack}
      style={
        {
          "--os-note-tilt": `${tilt}deg`,
          "--os-delay": `${delay}s`,
        } as CSSProperties
      }
    >
      <p className="os-display os-note-title">{title}</p>
      {children}
    </DesktopItem>
  );
}
