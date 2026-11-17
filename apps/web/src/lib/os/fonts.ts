import { JetBrains_Mono, Syne } from "next/font/google";

/** Títulos del sitio público. Redefine `--font-display` solo dentro del shell. */
export const osDisplay = Syne({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-display",
});

/** Interfaz del sitio público. */
export const osMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const osFontClasses = `${osDisplay.variable} ${osMono.variable}`;
