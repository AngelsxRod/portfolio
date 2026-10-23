"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Field, FieldLabel, FieldError } from "@repo/ui/components/field";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import type { ProjectImage } from "@/lib/drafts";

type Entry = {
  key: string;
  image?: ProjectImage;
  file?: File;
  preview: string;
  altText: string;
  removed?: boolean;
  error?: string;
  done?: boolean;
};
const maxBytes = 5 * 1024 * 1024;

async function request(
  path: string,
  method: string,
  body?: unknown,
  retryId?: string,
) {
  const response = await fetch(path, {
    method,
    ...(body
      ? {
          headers: {
            "Content-Type": "application/json",
            ...(retryId ? { "Idempotency-Key": retryId } : {}),
          },
          body: JSON.stringify(body),
        }
      : {}),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Respuesta inválida. Inténtalo de nuevo.");
  }
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Tu sesión venció. Inicia sesión en otra pestaña y vuelve a guardar."
        : (result.fields?.altText ??
            result.fields?.file ??
            result.message ??
            "No se pudo guardar la imagen."),
    );
  return result;
}

export function useProjectImages(initialImages: ProjectImage[] = []) {
  const [entries, setEntries] = useState<Entry[]>(() =>
    initialImages.map((image) => ({
      key: image.id,
      image,
      altText: image.altText,
      preview: `/api/admin/projects/${image.projectId}/media/${image.id}/file`,
    })),
  );
  const [featured, setFeatured] = useState(
    initialImages.find((image) => image.isFeatured)?.id ??
      initialImages[0]?.id ??
      "",
  );
  const [notice, setNotice] = useState("");
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const current = urls.current;
    return () => {
      current.forEach((url) => URL.revokeObjectURL(url));
      current.clear();
    };
  }, []);
  function patch(key: string, values: Partial<Entry>) {
    setEntries((current) =>
      current.map((entry) =>
        entry.key === key ? { ...entry, ...values } : entry,
      ),
    );
  }
  function add(files: File[]) {
    const accepted: Entry[] = [];
    const rejected: string[] = [];
    files.forEach((file) => {
      if (
        !file.size ||
        file.size > maxBytes ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type)
      ) {
        rejected.push(`${file.name}: usa PNG, JPEG o WebP de hasta 5 MiB.`);
        return;
      }
      const preview = URL.createObjectURL(file);
      urls.current.add(preview);
      accepted.push({ key: crypto.randomUUID(), file, preview, altText: "" });
    });
    setEntries((current) => [...current, ...accepted]);
    if (!featured && accepted[0]) setFeatured(accepted[0].key);
    setNotice(rejected.join(" "));
  }
  function validate() {
    let valid = true;
    entries
      .filter((entry) => !entry.removed)
      .forEach((entry) => {
        if (!entry.altText.trim() || entry.altText.trim().length > 300) {
          valid = false;
          patch(entry.key, {
            error: "Describe la imagen en 1 a 300 caracteres.",
          });
        }
      });
    return valid;
  }
  async function save(projectId: string) {
    let failed = false;
    const saved = new Map<string, ProjectImage>();
    const base = `/api/admin/projects/${projectId}`;
    for (const entry of entries) {
      try {
        patch(entry.key, { error: undefined });
        if (entry.removed) {
          if (entry.image)
            await request(`${base}/media/${entry.image.id}`, "DELETE");
          setEntries((current) =>
            current.filter((item) => item.key !== entry.key),
          );
          continue;
        }
        let image = entry.image;
        if (!image && entry.file) {
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]!);
            reader.onerror = () =>
              reject(new Error("No se pudo leer el archivo."));
            reader.readAsDataURL(entry.file!);
          });
          image = await request(
            `${base}/media`,
            "POST",
            {
              altText: entry.altText,
              mimeType: entry.file.type,
              data,
            },
            entry.key,
          );
          patch(entry.key, { image, file: undefined, done: true });
        } else if (image && image.altText !== entry.altText.trim()) {
          image = await request(`${base}/media/${image.id}`, "PUT", {
            altText: entry.altText,
          });
          patch(entry.key, { image, done: true });
        }
        if (image) saved.set(entry.key, image);
      } catch (error) {
        failed = true;
        patch(entry.key, {
          error:
            error instanceof Error
              ? error.message
              : "No se pudo guardar la imagen.",
        });
      }
    }
    const target = saved.get(featured);
    if (target) {
      try {
        await request(`${base}/featured-media`, "PUT", { mediaId: target.id });
      } catch (error) {
        failed = true;
        setNotice(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la destacada.",
        );
      }
    }
    if (failed)
      throw new Error(
        "El proyecto está guardado, pero quedan cambios de imágenes pendientes. Revisa los errores y vuelve a guardar.",
      );
    setNotice("");
  }
  return { entries, featured, setFeatured, notice, patch, add, validate, save };
}

export function ProjectImages({
  editor,
  disabled,
}: {
  editor: ReturnType<typeof useProjectImages>;
  disabled: boolean;
}) {
  const { entries, featured, setFeatured, notice, patch, add } = editor;
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const visible = entries.filter((entry) => !entry.removed);
  function paste(event: ClipboardEvent<HTMLDivElement>) {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (!files.length || disabled) return;
    event.preventDefault();
    add(files);
  }
  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) add(Array.from(event.dataTransfer.files));
  }
  return (
    <section className="space-y-4" aria-labelledby="images-title">
      <h2 id="images-title" className="text-xl font-semibold">
        Imágenes del proyecto
      </h2>
      <div
        tabIndex={disabled ? -1 : 0}
        onPaste={paste}
        onDrop={drop}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setDragging(false);
        }}
        aria-label="Zona de carga de imágenes. Selecciona, arrastra o pega imágenes."
        className={`space-y-3 rounded-md border border-dashed p-5 focus-visible:outline-2 focus-visible:outline-ring ${dragging ? "bg-accent" : "bg-muted/30"}`}
      >
        <p>
          Selecciona archivos, arrástralos aquí o enfoca esta zona y pega
          imágenes del portapapeles.
        </p>
        <p className="text-sm text-muted-foreground">
          PNG, JPEG o WebP. Máximo 5 MiB por imagen. Cada imagen necesita un
          texto alternativo.
        </p>
        <Input
          ref={fileInput}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          disabled={disabled}
          aria-label="Seleccionar imágenes"
          onChange={(event) => {
            add(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
      {notice && (
        <Alert role="alert">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Este proyecto todavía no tiene imágenes.
        </p>
      )}
      <RadioGroup
        value={
          visible.some((entry) => entry.key === featured)
            ? featured
            : (visible[0]?.key ?? "")
        }
        onValueChange={(value) => {
          if (value) setFeatured(value);
        }}
        disabled={disabled}
        aria-label="Imagen destacada"
      >
        {visible.map((entry, index) => (
          <div
            key={entry.key}
            className="w-full space-y-3 rounded-md border p-4"
          >
            <div className="relative aspect-video w-full">
              <Image
                src={entry.preview}
                alt={entry.altText || "Vista previa pendiente de descripción"}
                fill
                unoptimized
                sizes="(max-width:768px) 100vw, 700px"
                className="object-contain"
              />
            </div>
            <Field data-invalid={Boolean(entry.error)}>
              <FieldLabel htmlFor={`alt-${entry.key}`}>
                Texto alternativo de la imagen {index + 1}
              </FieldLabel>
              <Input
                id={`alt-${entry.key}`}
                value={entry.altText}
                required
                maxLength={300}
                disabled={disabled}
                aria-invalid={Boolean(entry.error)}
                aria-describedby={
                  entry.error ? `error-${entry.key}` : undefined
                }
                onChange={(event) =>
                  patch(entry.key, {
                    altText: event.target.value,
                    error: undefined,
                    done: false,
                  })
                }
              />
              {entry.error && (
                <FieldError id={`error-${entry.key}`}>{entry.error}</FieldError>
              )}
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <RadioGroupItem id={`featured-${entry.key}`} value={entry.key} />
              <label htmlFor={`featured-${entry.key}`}>
                Usar como destacada
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => {
                  patch(entry.key, { removed: true });
                  if (featured === entry.key)
                    setFeatured(
                      visible.find((item) => item.key !== entry.key)?.key ?? "",
                    );
                }}
              >
                Quitar imagen {index + 1}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" role="status">
              {entry.image
                ? entry.done
                  ? "Imagen guardada"
                  : "Imagen asociada"
                : "Pendiente de guardar"}
            </p>
          </div>
        ))}
      </RadioGroup>
      {entries.some((entry) => entry.removed) && (
        <div className="space-y-2">
          <p className="text-sm">
            Las imágenes retiradas se eliminarán al guardar.
          </p>
          {entries
            .filter((entry) => entry.removed)
            .map((entry) => (
              <div key={entry.key}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={() =>
                    patch(entry.key, { removed: false, error: undefined })
                  }
                >
                  Restaurar {entry.altText || "imagen"}
                </Button>
                {entry.error && (
                  <p role="alert" className="text-sm text-destructive">
                    {entry.error}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
