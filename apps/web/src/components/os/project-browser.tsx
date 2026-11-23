"use client";

import { useRef, useState, ViewTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { mediaUrl, projectTransitionName } from "@/lib/os/projects";
import { Window } from "@/components/os/window";

type BrowserImage = { id: string; altText: string };

/**
 * Navegador simulado del detalle: una pestaña por captura del proyecto y un
 * visor a pantalla completa con teclado (flechas y Escape).
 */
export function ProjectBrowser({
  slug,
  title,
  host,
  demoUrl,
  images,
}: {
  slug: string;
  title: string;
  host: string | null;
  demoUrl: string | null;
  images: BrowserImage[];
}) {
  const t = useTranslations("browser");
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  const count = images.length;
  const step = (direction: number) =>
    setIndex((current) => (current + direction + count) % count);

  return (
    <Window
      id="navegador"
      stack="izquierda"
      title={t("windowTitle", { title })}
      file="navegador"
      defaultPosition={{ x: 40, y: 36 }}
      width={900}
    >
      <div className="os-urlbar">
        {count > 1 && (
          <>
            <Button
              variant="outline"
              className="os-navbtn"
              aria-label={t("prev")}
              onClick={() => step(-1)}
            >
              ←
            </Button>
            <Button
              variant="outline"
              className="os-navbtn"
              aria-label={t("next")}
              onClick={() => step(1)}
            >
              →
            </Button>
          </>
        )}
        <div className="os-url" aria-label={t("address")}>
          <span className="os-url-dot" aria-hidden="true">
            ●
          </span>
          {host ? (
            <>
              <span className="os-muted">https://</span>
              <span>{host}</span>
            </>
          ) : (
            <span className="os-muted">{t("noAddress")}</span>
          )}
        </div>
        {demoUrl && (
          <a
            className="os-navbtn os-navlink"
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("openExternal", { name: host ?? title })}
          >
            ↗
          </a>
        )}
      </div>

      {count === 0 ? (
        <div className="os-browser-empty">
          <span className="os-display" aria-hidden="true">
            {title.slice(0, 1)}
          </span>
          <p>{t("empty")}</p>
        </div>
      ) : (
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <Tabs
            value={index}
            onValueChange={(value) => setIndex(Number(value))}
            className="os-browser-tabs"
          >
            <TabsList
              variant="line"
              className="os-btabs"
              aria-label={t("shots")}
            >
              {images.map((image, i) => (
                <TabsTrigger key={image.id} value={i} className="os-btab">
                  {t("view", { number: i + 1 })}
                </TabsTrigger>
              ))}
            </TabsList>
            {images.map((image, i) => (
              <TabsContent key={image.id} value={i} className="os-shot">
                <ViewTransition
                  // Solo la primera captura continúa la miniatura del listado.
                  name={i === 0 ? projectTransitionName(slug) : undefined}
                  share="os-morph"
                  default="none"
                >
                  <Image
                    src={mediaUrl(image.id)}
                    alt={image.altText}
                    fill
                    unoptimized
                    // La primera captura es el elemento LCP del detalle: carga
                    // de inmediato y con prioridad alta; el resto, diferido.
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : undefined}
                    sizes="(max-width: 820px) 100vw, 900px"
                    className="object-cover object-top"
                  />
                </ViewTransition>
                <Button
                  ref={(element) => {
                    triggers.current[i] = element;
                  }}
                  variant="ghost"
                  className="os-shot-zoom"
                  aria-label={t("zoomLabel", { number: i + 1, total: count })}
                  onClick={() => setViewerOpen(true)}
                >
                  <span>{t("zoom")}</span>
                </Button>
              </TabsContent>
            ))}
          </Tabs>
          <DialogContent
            showCloseButton={false}
            finalFocus={() => triggers.current[index] ?? null}
            className="os-viewer flex h-dvh w-screen max-w-none flex-col gap-3 rounded-none p-4 sm:max-w-none sm:p-6"
            onKeyDown={(event) => {
              if (
                count > 1 &&
                (event.key === "ArrowLeft" || event.key === "ArrowRight")
              ) {
                event.preventDefault();
                step(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <DialogTitle>{t("viewerTitle", { title })}</DialogTitle>
              <DialogClose
                render={
                  <Button variant="outline" className="os-btn os-btn-outline" />
                }
              >
                {t("close")}
              </DialogClose>
            </div>
            <DialogDescription className="sr-only">
              {t("viewerHelp")}
            </DialogDescription>
            <div className="relative min-h-0 flex-1">
              <Image
                src={mediaUrl(images[index]!.id)}
                alt={images[index]!.altText}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-4">
              {count > 1 && (
                <Button
                  variant="outline"
                  className="os-navbtn"
                  aria-label={t("prev")}
                  onClick={() => step(-1)}
                >
                  ←
                </Button>
              )}
              <p role="status" aria-live="polite" className="text-sm">
                {t("counter", { number: index + 1, total: count })}
              </p>
              {count > 1 && (
                <Button
                  variant="outline"
                  className="os-navbtn"
                  aria-label={t("next")}
                  onClick={() => step(1)}
                >
                  →
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Window>
  );
}
