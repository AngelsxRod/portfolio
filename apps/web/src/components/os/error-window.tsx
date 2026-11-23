"use client";

import type { ReactNode } from "react";
import { Button } from "@repo/ui/components/button";
import { ProfileAvatar } from "@/components/os/avatar";
import { Blob } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import { OsLinkButton } from "@/components/os/os-button";
import type { AvatarMood } from "@/lib/os/avatar";
import { Window } from "@/components/os/window";

/** Ventana de error de angel.os para errores, 404 y contenido no disponible. */
export function ErrorWindow({
  file,
  code,
  title,
  mood = "worried",
  children,
  retry,
  back = { href: "/", label: "Volver al inicio" },
}: {
  file: string;
  code: string;
  title: string;
  mood?: AvatarMood;
  children: ReactNode;
  retry?: () => void;
  back?: { href: string; label: string };
}) {
  return (
    <Desktop>
      <Blob shape="ring" style={{ left: 820, top: 80 }} />
      <Blob shape="circle" style={{ left: 980, top: 420 }} />
      <Window
        id="error"
        title={title}
        file={file}
        labelledBy="page-title"
        variant="orange"
        defaultPosition={{ x: 120, y: 80 }}
        width={620}
      >
        <div className="os-error">
          <ProfileAvatar
            interactive
            mood={mood}
            size={96}
            variant="orange"
            alt="Avatar de Kaled"
            className="os-error-avatar"
          />
          <span className="os-error-code">{code}</span>
          <h1 id="page-title" className="os-display">
            {title}
          </h1>
          <p>{children}</p>
          <div className="os-actions">
            {retry && (
              <Button className="os-btn os-btn-primary" onClick={retry}>
                Intentar de nuevo
              </Button>
            )}
            <OsLinkButton
              href={back.href}
              variant={retry ? "outline" : "primary"}
            >
              {back.label}
            </OsLinkButton>
          </div>
        </div>
      </Window>
    </Desktop>
  );
}
