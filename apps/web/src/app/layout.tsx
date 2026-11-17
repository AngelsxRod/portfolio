import "@repo/ui/styles.css";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { Toaster } from "@repo/ui/components/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import Script from "next/script";
import { bootGateScript } from "@/lib/os/boot";
import { JetBrains_Mono, Sora } from "next/font/google";

const fontDisplay = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Portafolio | Proyectos",
  description: "Proyectos publicados y procesos documentados.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${fontDisplay.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Oculta el arranque de angel.os antes del primer pintado si ya se vio. */}
        <Script id="angel-os-boot" strategy="beforeInteractive">
          {bootGateScript}
        </Script>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
