import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import "@/styles/os/shell.css";
import "@/styles/os/window.css";
import { osFontClasses } from "@/lib/os/fonts";
import { DesktopProvider } from "@/components/os/desktop-provider";
import { DeskHint } from "@/components/os/desk-hint";
import { Dock } from "@/components/os/dock";
import { Mascot } from "@/components/os/mascot";
import { MascotProvider } from "@/components/os/mascot-provider";
import { TopBar } from "@/components/os/top-bar";
import { Tray } from "@/components/os/tray";

/**
 * Shell de angel.os: barra superior, escritorio de cada página, dock lateral
 * (menú lateral desplegable en el teléfono) y cinta.
 */
export function OsShell({ children }: { children: ReactNode }) {
  const t = useTranslations("shell");
  return (
    <div className={`os-theme dark os-page ${osFontClasses}`}>
      <a className="os-skip" href="#contenido">
        {t("skip")}
      </a>
      <DesktopProvider>
        <MascotProvider>
          <TopBar />
          {children}
          <Dock>
            <Tray />
          </Dock>
          <DeskHint />
          <Mascot />
        </MascotProvider>
      </DesktopProvider>
    </div>
  );
}
