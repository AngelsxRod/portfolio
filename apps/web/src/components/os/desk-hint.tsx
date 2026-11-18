"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";

const HINT_KEY = "angel-os-hint";

/** Pista de uso que se muestra una sola vez por navegador. */
export function DeskHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      // Mostrar solo después de montar evita diferencias con el servidor.
      setShow(window.localStorage.getItem(HINT_KEY) !== "1");
    } catch {
      setShow(false);
    }
  }, []);
  if (!show) return null;
  function dismiss() {
    setShow(false);
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      // Sin almacenamiento la pista simplemente vuelve en otra visita.
    }
  }
  return (
    <aside className="os-hint" aria-label="Cómo usar este sitio">
      <p>
        <strong>¿Primera vez aquí?</strong> Abre el menú con la pestaña «Menú»
        de la izquierda. Las ventanas se pueden mover desde su barra; si cierras
        una, la recuperas en «Ventanas».
      </p>
      <Button className="os-btn os-btn-primary" onClick={dismiss}>
        Entendido
      </Button>
    </aside>
  );
}
