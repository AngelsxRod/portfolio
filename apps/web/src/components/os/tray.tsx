"use client";

import { Button } from "@repo/ui/components/button";
import {
  focusLater,
  trayButtonId,
  useDesktop,
  windowElementId,
} from "@/components/os/desktop-provider";

/** Bandeja del dock: muestra, minimiza o restaura las ventanas de la página. */
export function Tray() {
  const { state, dispatch } = useDesktop();
  if (state.windows.length === 0) return null;
  return (
    <div className="os-tray" role="group" aria-label="Ventanas abiertas">
      <span className="os-tray-label" aria-hidden="true">
        ventanas:
      </span>
      {state.windows.map((window) => (
        <Button
          key={window.id}
          id={trayButtonId(window.id)}
          variant="outline"
          className={`os-chip${window.hidden ? " os-chip-off" : ""}`}
          aria-pressed={!window.hidden}
          onClick={() => {
            dispatch({ type: "toggle", id: window.id });
            if (window.hidden) focusLater(windowElementId(window.id));
          }}
        >
          {window.title}
        </Button>
      ))}
    </div>
  );
}
