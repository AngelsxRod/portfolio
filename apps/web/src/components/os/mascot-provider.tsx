"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mascotEnabled, saveMascotEnabled } from "@/lib/os/mascot";

type MascotContextValue = { enabled: boolean; toggle: () => void };

const MascotContext = createContext<MascotContextValue | null>(null);

/** Preferencia de mostrar la mascota, compartida entre la barra y el escritorio. */
export function MascotProvider({ children }: { children: ReactNode }) {
  // Se lee tras montar: el servidor no conoce el almacenamiento del navegador.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(mascotEnabled(() => window.localStorage));
  }, []);
  const toggle = useCallback(() => {
    setEnabled((current) => {
      saveMascotEnabled(!current, () => window.localStorage);
      return !current;
    });
  }, []);
  const value = useMemo(() => ({ enabled, toggle }), [enabled, toggle]);
  return (
    <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
  );
}

export function useMascot() {
  const context = useContext(MascotContext);
  if (!context) throw new Error("Falta MascotProvider.");
  return context;
}
