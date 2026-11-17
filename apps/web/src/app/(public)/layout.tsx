import type { ReactNode } from "react";
import "@/styles/os/shell.css";
import "@/styles/os/window.css";
import { osFontClasses } from "@/lib/os/fonts";
import { DesktopProvider } from "@/components/os/desktop-provider";
import { Dock } from "@/components/os/dock";
import { TopBar } from "@/components/os/top-bar";
import { Tray } from "@/components/os/tray";

/** Shell de angel.os: barra superior, escritorio de cada página, dock y cinta. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`os-theme dark os-page ${osFontClasses}`}>
      <a className="os-skip" href="#contenido">
        Saltar al contenido
      </a>
      <TopBar />
      <DesktopProvider>
        {children}
        <Dock>
          <Tray />
        </Dock>
      </DesktopProvider>
    </div>
  );
}
