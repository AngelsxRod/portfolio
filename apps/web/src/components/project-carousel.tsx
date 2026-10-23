"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@repo/ui/components/carousel";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@repo/ui/components/dialog";
import type { ProjectImage } from "@/lib/drafts";

export function ProjectCarousel({ images }: { images: ProjectImage[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  function navigateViewer(direction: number) {
    const next = (viewerIndex + direction + images.length) % images.length;
    setViewerIndex(next);
    api?.scrollTo(next);
  }
  const select = useCallback(
    () => setIndex(api?.selectedScrollSnap() ?? 0),
    [api],
  );
  useEffect(() => {
    if (!api) return;
    api.on("select", select);
    api.on("reInit", select);
    return () => {
      api.off("select", select);
      api.off("reInit", select);
    };
  }, [api, select]);
  if (!images.length) return null;
  return (
    <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
      <Carousel
        setApi={setApi}
        opts={{ loop: images.length > 1, duration: 0 }}
        className="project-gallery"
        inert={viewerOpen}
        aria-hidden={viewerOpen || undefined}
        aria-label="Galería principal del proyecto"
        aria-roledescription="carrusel"
        tabIndex={0}
      >
        <CarouselContent>
          {images.map((image, i) => (
            <CarouselItem
              key={image.id}
              aria-label={`Imagen ${i + 1} de ${images.length}`}
              aria-roledescription="diapositiva"
              aria-hidden={i !== index}
            >
              <figure className="project-gallery-figure">
                <div className="project-gallery-image">
                  <Image
                    src={`/api/projects/media/${image.id}`}
                    alt={image.altText}
                    fill
                    unoptimized
                    loading={i === 0 ? "eager" : "lazy"}
                    sizes="(max-width:1280px) 100vw, 1248px"
                    className="object-contain"
                  />
                  <DialogTrigger
                    ref={(element) => {
                      triggers.current[i] = element;
                    }}
                    render={
                      <Button
                        variant="ghost"
                        className="absolute inset-0 h-full w-full cursor-zoom-in rounded-none bg-transparent p-0 hover:bg-transparent"
                      />
                    }
                    tabIndex={i === index ? 0 : -1}
                    aria-label={`Ampliar imagen ${i + 1}`}
                    onClick={() => setViewerIndex(i)}
                  >
                    <span className="project-gallery-expand">Ampliar ↗</span>
                  </DialogTrigger>
                </div>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="project-gallery-navigation">
          <span className="text-sm text-muted-foreground">
            Explora el proyecto en imágenes
          </span>
          <div className="project-gallery-controls">
            {images.length > 1 && (
              <CarouselPrevious
                aria-label="Imagen anterior"
                variant="default"
                className="static my-0 min-h-11 min-w-11 hover:bg-foreground hover:text-background disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100"
              />
            )}
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="text-sm"
            >
              Imagen {index + 1} de {images.length}
            </p>
            {images.length > 1 && (
              <CarouselNext
                aria-label="Imagen siguiente"
                variant="default"
                className="static my-0 min-h-11 min-w-11 hover:bg-foreground hover:text-background disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100"
              />
            )}
          </div>
        </div>
      </Carousel>
      <DialogContent
        showCloseButton={false}
        finalFocus={() => triggers.current[api?.selectedScrollSnap() ?? index]}
        className="motion-reduce:animate-none flex h-dvh w-screen max-w-none flex-col gap-3 rounded-none bg-background p-4 text-foreground sm:max-w-none sm:p-6"
        onKeyDown={(event) => {
          if (
            images.length > 1 &&
            (event.key === "ArrowLeft" || event.key === "ArrowRight")
          ) {
            event.preventDefault();
            navigateViewer(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <DialogTitle>Imágenes del proyecto</DialogTitle>
          <DialogClose
            render={<Button variant="outline" className="min-h-11" />}
          >
            Cerrar ×
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          Imagen ampliada. Usa las flechas para recorrer la galería y Escape
          para cerrar.
        </DialogDescription>
        <div className="relative min-h-0 flex-1">
          <Image
            src={`/api/projects/media/${images[viewerIndex]?.id ?? images[0]!.id}`}
            alt={images[viewerIndex]?.altText ?? images[0]!.altText}
            fill
            sizes="100vw"
            unoptimized
            className="object-contain"
          />
        </div>
        <div className="flex items-center justify-center gap-4">
          {images.length > 1 && (
            <Button
              className="min-h-11 min-w-11"
              aria-label="Imagen anterior"
              onClick={() => navigateViewer(-1)}
            >
              ←
            </Button>
          )}
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-sm font-semibold"
          >
            Imagen {viewerIndex + 1} de {images.length}
          </p>
          {images.length > 1 && (
            <Button
              className="min-h-11 min-w-11"
              aria-label="Imagen siguiente"
              onClick={() => navigateViewer(1)}
            >
              →
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
