import "@repo/ui/styles.css";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { Toaster } from "@repo/ui/components/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import Script from "next/script";
import { bootGateScript } from "@/lib/os/boot";
import { osFontClasses } from "@/lib/os/fonts";

export const metadata: Metadata = {
  // Base de las URL absolutas de la imagen para compartir y los iconos.
  metadataBase: new URL("https://kaled.dev"),
  title: "Portafolio | Proyectos",
  description: "Proyectos publicados y procesos documentados.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El idioma llega del proxy; el panel, sin prefijo, usa el predeterminado.
  const locale = await getLocale();
  return (
    <html lang={locale} className={osFontClasses} suppressHydrationWarning>
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
