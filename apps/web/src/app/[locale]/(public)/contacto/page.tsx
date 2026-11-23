import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import "@/styles/os/contact.css";
import { getPublicProfile } from "@/lib/public-profile";
import { safeExternalUrl } from "@/lib/safe-url";
import { ContactForm } from "@/components/contact-form";
import { Clock } from "@/components/os/clock";
import { Blob, StickyNote } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import { Ticker } from "@/components/os/ticker";
import { Window } from "@/components/os/window";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "/contacto", "contact");
}

export default async function ContactPage() {
  const [t, common] = await Promise.all([
    getTranslations("contact"),
    getTranslations("common"),
  ]);
  const profile = await getPublicProfile();
  const links = (profile?.links ?? []).flatMap((link) => {
    const url = safeExternalUrl(link.url);
    return url ? [{ label: link.label, url }] : [];
  });
  const hasChannels = Boolean(
    profile?.email || links.length || profile?.location,
  );

  return (
    <>
      <Desktop>
        <Blob shape="circle" style={{ left: 780, top: 560 }} />
        <Blob shape="pill" style={{ left: 1080, top: 760 }} />

        <Window
          id="mensaje"
          title={t("windowTitle")}
          file="nuevo_mensaje.eml"
          stack="izquierda"
          labelledBy="page-title"
          defaultPosition={{ x: 40, y: 36 }}
          width={760}
        >
          <div className="os-mail">
            <h1 id="page-title" className="os-display">
              {t("heading")}
              <span>.</span>
            </h1>
            <p className="os-mail-to">
              {profile?.email && (
                <>
                  {t("to")} <span>{profile.email}</span> ·{" "}
                </>
              )}
              {t("allRequired")}
            </p>
            <ContactForm siteKey={process.env.TURNSTILE_SITE_KEY || null} />
          </div>
        </Window>

        {hasChannels && (
          <Window
            id="canales"
            title={t("channelsTitle")}
            file="otros_canales"
            stack="derecha"
            variant="orange"
            defaultPosition={{ x: 880, y: 60 }}
            width={440}
            delay={0.15}
          >
            <ul className="os-channels">
              {profile?.email && (
                <li>
                  <a href={`mailto:${profile.email}`}>
                    <span>
                      <span className="os-channel-label">
                        {t("channelEmail")}
                      </span>
                      <span className="os-channel-value">{profile.email}</span>
                    </span>
                    <span className="os-channel-arrow" aria-hidden="true">
                      →
                    </span>
                  </a>
                </li>
              )}
              {links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <span>
                      <span className="os-channel-label">
                        {link.label.toLowerCase()}
                      </span>
                      <span className="os-channel-value">
                        {new URL(link.url).host.replace(/^www\./, "")}
                        {new URL(link.url).pathname.replace(/\/$/, "")}
                      </span>
                    </span>
                    <span className="os-channel-arrow" aria-hidden="true">
                      ↗
                    </span>
                    <span className="sr-only"> {common("newTab")}</span>
                  </a>
                </li>
              ))}
              {profile?.location && (
                <li>
                  <span className="os-channel-static">
                    <span>
                      <span className="os-channel-label">
                        {t("channelLocation")}
                      </span>
                      <span className="os-channel-value">
                        {profile.location} ·{" "}
                        <Clock className="os-channel-clock" />
                      </span>
                    </span>
                  </span>
                </li>
              )}
            </ul>
          </Window>
        )}

        <StickyNote
          id="nota-contacto"
          title={t("noteTitle")}
          tilt={3}
          stack="derecha"
          delay={0.3}
          defaultPosition={{ x: 900, y: 420 }}
        >
          <p>{t("noteText")}</p>
        </StickyNote>
      </Desktop>
      <Ticker
        items={[
          t("tickerAsk"),
          t("tickerSites"),
          t("tickerLanding"),
          t("tickerSystems"),
          ...(profile?.email ? [profile.email] : []),
        ]}
      />
    </>
  );
}
