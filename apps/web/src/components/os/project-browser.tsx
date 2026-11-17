"use client";

import { useRef, useState } from "react";
import Image from "next/image";
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
import { mediaUrl } from "@/lib/os/projects";
import { Window } from "@/components/os/window";

type BrowserImage = { id: string; altText: string };

/**
 * Navegador simulado del detalle: una pestaña por captura del proyecto y un
 * visor a pantalla completa con teclado (flechas y Escape).
 */
export function ProjectBrowser({
  title,
  host,
  demoUrl,
  images,
}: {
  title: string;
  host: string | null;
  demoUrl: string | null;
  images: BrowserImage[];
}) {
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  const count = images.length;
  const step = (direction: number) =>
    setIndex((current) => (current + direction + count) % count);

  return (
    <Window
      id="navegador"
      title={`Así se ve ${title}`}
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
              aria-label="Captura anterior"
              onClick={() => step(-1)}
            >
              ←
            </Button>
            <Button
              variant="outline"
              className="os-navbtn"
              aria-label="Captura siguiente"
              onClick={() => step(1)}
            >
              →
            </Button>
          </>
        )}
        <div className="os-url" aria-label="Dirección del sitio">
          <span className="os-url-dot" aria-hidden="true">
            ●
          </span>
          {host ? (
            <>
              <span className="os-muted">https://</span>
              <span>{host}</span>
            </>
          ) : (
            <span className="os-muted">sitio sin dirección pública</span>
          )}
        </div>
        {demoUrl && (
          <a
            className="os-navbtn os-navlink"
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${host ?? title} en otra pestaña`}
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
          <p>Este proyecto aún no tiene capturas publicadas.</p>
        </div>
      ) : (
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <Tabs
            value={index}
            onValueChange={(value) => setIndex(Number(value))}
            className="os-browser-tabs"
          >
            <TabsList variant="line" className="os-btabs" aria-label="Capturas">
              {images.map((image, i) => (
                <TabsTrigger key={image.id} value={i} className="os-btab">
                  Vista {i + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            {images.map((image, i) => (
              <TabsContent key={image.id} value={i} className="os-shot">
                <Image
                  src={mediaUrl(image.id)}
                  alt={image.altText}
                  fill
                  unoptimized
                  loading={i === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 820px) 100vw, 900px"
                  className="object-cover object-top"
                />
                <Button
                  ref={(element) => {
                    triggers.current[i] = element;
                  }}
                  variant="ghost"
                  className="os-shot-zoom"
                  aria-label={`Ampliar captura ${i + 1} de ${count}`}
                  onClick={() => setViewerOpen(true)}
                >
                  <span>Ampliar ↗</span>
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
              <DialogTitle>Capturas de {title}</DialogTitle>
              <DialogClose
                render={
                  <Button variant="outline" className="os-btn os-btn-outline" />
                }
              >
                Cerrar ×
              </DialogClose>
            </div>
            <DialogDescription className="sr-only">
              Captura ampliada. Usa las flechas para recorrerlas y Escape para
              cerrar.
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
                  aria-label="Captura anterior"
                  onClick={() => step(-1)}
                >
                  ←
                </Button>
              )}
              <p role="status" aria-live="polite" className="text-sm">
                Captura {index + 1} de {count}
              </p>
              {count > 1 && (
                <Button
                  variant="outline"
                  className="os-navbtn"
                  aria-label="Captura siguiente"
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
