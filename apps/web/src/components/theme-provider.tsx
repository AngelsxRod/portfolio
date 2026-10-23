"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Tema de todo el sitio: claro por defecto, con opción de oscuro o el del sistema. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
