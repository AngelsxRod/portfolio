"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * El modo oscuro es opcional y solo existe en el panel: el sitio público no
 * tiene paleta oscura, así que fuera de `/admin` el tema se fuerza a claro.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const admin = usePathname().startsWith("/admin");
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="admin-theme"
      disableTransitionOnChange
      forcedTheme={admin ? undefined : "light"}
    >
      {children}
    </NextThemesProvider>
  );
}
