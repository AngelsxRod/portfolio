"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import type { Point } from "@/lib/os/desktop";
import {
  useDesktopWindow,
  useMeasuredHeight,
} from "@/components/os/desktop-provider";

/**
 * Elemento suelto del escritorio (nota, accesos directos) que se apila en una
 * columna junto a las ventanas para no quedar tapado. No va a la bandeja.
 */
export function DesktopItem({
  id,
  label,
  defaultPosition,
  width,
  stack,
  as: Tag = "div",
  className,
  style,
  children,
}: {
  id: string;
  label: string;
  defaultPosition: Point;
  width: number;
  stack?: string;
  as?: "div" | "aside" | "nav";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { window, dispatch } = useDesktopWindow({
    id,
    title: label,
    defaultPosition,
    width,
    stack,
    tray: false,
  });
  const ref = useRef<HTMLElement>(null);
  useMeasuredHeight(ref, id, dispatch, true);
  return (
    <Tag
      ref={ref as never}
      aria-label={label}
      className={`os-float${className ? ` ${className}` : ""}`}
      style={{
        ...style,
        left: window.position.x,
        top: window.position.y,
        width,
      }}
    >
      {children}
    </Tag>
  );
}
