import type { CSSProperties, ReactNode } from "react";

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
  title,
  children,
  style,
  tilt = -3,
  label,
}: {
  title: string;
  children: ReactNode;
  style: CSSProperties;
  tilt?: number;
  label?: string;
}) {
  return (
    <aside
      className="os-float os-note"
      aria-label={label ?? title}
      style={{ ...style, "--os-note-tilt": `${tilt}deg` } as CSSProperties}
    >
      <p className="os-display os-note-title">{title}</p>
      {children}
    </aside>
  );
}
