"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import { trayWindows } from "@/lib/os/desktop";
import {
  focusLater,
  TRAY_TOGGLE_ID,
  trayButtonId,
  useDesktop,
  windowElementId,
} from "@/components/os/desktop-provider";

/**
 * Bandeja del dock: muestra cuántas ventanas hay ocultas y, al abrirla,
 * permite mostrarlas u ocultarlas una a una o restaurarlas todas.
 */
export function Tray() {
  const { state, dispatch } = useDesktop();
  const [open, setOpen] = useState(false);
  const windows = trayWindows(state);
  if (windows.length === 0) return null;
  const hidden = windows.filter((window) => window.hidden).length;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="os-tray">
      <CollapsibleTrigger
        id={TRAY_TOGGLE_ID}
        render={
          <Button
            variant="outline"
            className={`os-tray-toggle${hidden ? " os-tray-alert" : ""}`}
          />
        }
      >
        Ventanas
        {hidden > 0 && (
          <span className="os-tray-count">
            {hidden} {hidden === 1 ? "oculta" : "ocultas"}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="os-tray-panel">
        <p className="os-tray-help">
          Toca una ventana para mostrarla u ocultarla.
        </p>
        <div className="os-tray-chips">
          {windows.map((window) => (
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
              {window.hidden ? "+ " : ""}
              {window.title}
            </Button>
          ))}
        </div>
        {hidden > 0 && (
          <Button
            className="os-btn os-btn-primary os-tray-all"
            onClick={() => dispatch({ type: "restoreAll" })}
          >
            Restaurar todo
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
