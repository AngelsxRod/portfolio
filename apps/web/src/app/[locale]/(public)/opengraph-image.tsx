import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { BRAND_COLORS, markSvg } from "@/lib/os/brand";
import { getPublicProfile } from "@/lib/public-profile";

// Neutro en idioma: la imagen es la misma marca en todos los idiomas.
export const alt = "angel.os · kaled.dev";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { ink, bone, lime, orange } = BRAND_COLORS;
const mark = `data:image/svg+xml;utf8,${encodeURIComponent(markSvg())}`;

/** Nombre y título del perfil publicado; sin él, un texto genérico. */
async function subtitle(locale: string) {
  try {
    const profile = await getPublicProfile();
    if (profile)
      return [profile.displayName, profile.headline]
        .filter(Boolean)
        .join(" · ");
  } catch {
    // La imagen para compartir no debe fallar si la API no responde.
  }
  const t = await getTranslations({ locale, namespace: "metadata" });
  return t("ogFallback");
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [syne, text] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/syne-latin-800-normal.woff")),
    subtitle(locale),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: ink,
        color: bone,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 80px",
        }}
      >
        <img src={mark} width={220} height={220} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontFamily: "Syne",
              fontSize: 104,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            angel.os
          </div>
          <div style={{ fontSize: 34, color: "#c9c6bf", maxWidth: 680 }}>
            {text}
          </div>
          <div style={{ fontSize: 30, color: orange }}>kaled.dev</div>
        </div>
      </div>
      <div style={{ height: 28, background: lime, display: "flex" }} />
    </div>,
    {
      ...size,
      fonts: [{ name: "Syne", data: syne, style: "normal", weight: 800 }],
    },
  );
}
