import type { CSSProperties } from "react";
import "@/styles/os/avatar.css";

/**
 * Avatar pixelado de Kaled en un marco plano como el resto de angel.os.
 * Es un elemento de identidad (archivo estático de la marca), no contenido del CMS.
 */
export function ProfileAvatar({
  alt = "Avatar de Kaled",
  size = 128,
  variant = "lime",
  className,
}: {
  alt?: string;
  size?: number;
  variant?: "lime" | "orange";
  className?: string;
}) {
  return (
    <span
      className={`os-avatar os-avatar-${variant}${className ? ` ${className}` : ""}`}
      style={{ "--os-avatar-size": `${size}px` } as CSSProperties}
    >
      {/* SVG estático de 25 KB: next/image no aporta nada y rompería el pixelado. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/avatar-kaled.svg"
        alt={alt}
        width={size}
        height={size}
        decoding="async"
      />
    </span>
  );
}
