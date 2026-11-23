"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { ProfileAvatar } from "@/components/os/avatar";
import { useDesktop } from "@/components/os/desktop-provider";
import { useMascot } from "@/components/os/mascot-provider";
import {
  hiddenWindowsPhrase,
  mascotPhrases,
  mascotVisibleOn,
  pickPhrase,
} from "@/lib/os/mascot";
import "@/styles/os/mascot.css";

/** Cuánto dura abierto el globo antes de guardarse solo. */
const BUBBLE_MS = 9000;
/** Cada cuánto da un saltito para llamar la atención. */
const HOP_MS = 25000;

function MascotBody({ pathname }: { pathname: string }) {
  const { state } = useDesktop();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const [hop, setHop] = useState(false);
  const hidden = state.windows.filter(
    (window) => window.tray && window.hidden,
  ).length;
  const extra = hiddenWindowsPhrase(hidden);
  const list = extra
    ? [extra, ...mascotPhrases(pathname)]
    : mascotPhrases(pathname);

  // El globo se guarda solo para no estorbar; un clic lo vuelve a abrir.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setOpen(false), BUBBLE_MS);
    return () => window.clearTimeout(timer);
  }, [open, index]);

  useEffect(() => {
    let off = 0;
    const timer = window.setInterval(() => {
      setHop(true);
      off = window.setTimeout(() => setHop(false), 700);
    }, HOP_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(off);
    };
  }, []);

  // Una ventana recién guardada es noticia: vuelve a abrir el globo con el aviso.
  useEffect(() => {
    if (hidden > 0) {
      setIndex(0);
      setOpen(true);
    }
  }, [hidden]);

  const text = pickPhrase(list, index);
  return (
    <aside className="os-mascot" aria-label="Mascota de angel.os">
      {open && text && <p className="os-mascot-bubble">{text}</p>}
      <span className="os-mascot-body" data-hop={hop ? "" : undefined}>
        <ProfileAvatar
          interactive
          size={84}
          alt="Avatar de Kaled"
          mood={open ? "happy" : "idle"}
          onActivate={() => {
            setIndex((current) => (open ? current + 1 : current));
            setOpen(true);
          }}
        />
      </span>
    </aside>
  );
}

/** Mascota fija abajo a la derecha: te habla según la página. */
export function Mascot() {
  const pathname = usePathname();
  const { enabled } = useMascot();
  if (!enabled || !mascotVisibleOn(pathname)) return null;
  return <MascotBody key={pathname} pathname={pathname} />;
}
