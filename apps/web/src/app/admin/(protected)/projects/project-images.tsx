"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import { ImagePlusIcon, StarIcon, Trash2Icon, Undo2Icon } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { FormField } from "@/components/form-field";
import type { ProjectImage } from "@/lib/drafts";

const altMessage = "Describe la imagen en 1 a 300 caracteres.";

/** Imagen del formulario: ya guardada (`image`) o pendiente de cargar (`file`). */
const entrySchema = z
  .object({
    key: z.string(),
    altText: z.string(),
    removed: z.boolean(),
    done: z.boolean(),
    preview: z.string(),
    file: z.custom<File>().optional(),
    image: z.custom<ProjectImage>().optional(),
  })
  .superRefine((entry, ctx) => {
    const length = entry.altText.trim().length;
    if (!entry.removed && (length < 1 || length > 300))
      ctx.addIssue({ code: "custom", path: ["altText"], message: altMessage });
  });

/** Campos de imágenes que se suman al esquema del formulario del proyecto. */
export const imagesShape = {
  images: z.array(entrySchema),
  featured: z.string(),
};
export type ImageEntry = z.infer<typeof entrySchema>;
export type ImagesValues = { images: ImageEntry[]; featured: string };

export function imageDefaults(initialImages: ProjectImage[]): ImagesValues {
  return {
    images: initialImages.map((image) => ({
      key: image.id,
      image,
      altText: image.altText,
      removed: false,
      done: false,
      preview: `/api/admin/projects/${image.projectId}/media/${image.id}/file`,
    })),
    featured:
      initialImages.find((image) => image.isFeatured)?.id ??
      initialImages[0]?.id ??
      "",
  };
}

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

export function useProjectImages() {
  const form = useFormContext<ImagesValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });
  const entries = useWatch({ control: form.control, name: "images" }) ?? [];
  const featuredValue = useWatch({ control: form.control, name: "featured" });
  const [notice, setNotice] = useState("");
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const current = urls.current;
    return () => {
      current.forEach((url) => URL.revokeObjectURL(url));
      current.clear();
    };
  }, []);

  const visible = entries.filter((entry) => !entry.removed);
  const featured = visible.some((entry) => entry.key === featuredValue)
    ? featuredValue
    : (visible[0]?.key ?? "");

  function indexOf(key: string) {
    return form.getValues("images").findIndex((entry) => entry.key === key);
  }
  function patch(key: string, values: Partial<ImageEntry>) {
    const index = indexOf(key);
    if (index < 0) return;
    form.setValue(`images.${index}`, {
      ...form.getValues(`images.${index}`),
      ...values,
    });
  }
  function fail(key: string, message: string) {
    const index = indexOf(key);
    if (index >= 0)
      form.setError(`images.${index}.altText`, { type: "server", message });
  }
  function setFeatured(key: string) {
    form.setValue("featured", key);
  }
  function add(files: File[]) {
    const accepted: ImageEntry[] = [];
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
      accepted.push({
        key: crypto.randomUUID(),
        file,
        preview,
        altText: "",
        removed: false,
        done: false,
      });
    });
    if (accepted.length) append(accepted);
    if (!featured && accepted[0]) setFeatured(accepted[0].key);
    setNotice(rejected.join(" "));
  }
  async function save(projectId: string) {
    let failed = false;
    const saved = new Map<string, ProjectImage>();
    const base = `/api/admin/projects/${projectId}`;
    for (const entry of form.getValues("images")) {
      try {
        form.clearErrors(`images.${indexOf(entry.key)}.altText`);
        if (entry.removed) {
          if (entry.image)
            await request(`${base}/media/${entry.image.id}`, "DELETE");
          remove(indexOf(entry.key));
          continue;
        }
        let image = entry.image;
        if (!image && entry.file) {
          const file = entry.file;
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]!);
            reader.onerror = () =>
              reject(new Error("No se pudo leer el archivo."));
            reader.readAsDataURL(file);
          });
          image = await request(
            `${base}/media`,
            "POST",
            { altText: entry.altText, mimeType: file.type, data },
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
        fail(
          entry.key,
          error instanceof Error
            ? error.message
            : "No se pudo guardar la imagen.",
        );
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
  return {
    fields,
    entries,
    featured,
    setFeatured,
    notice,
    patch,
    add,
    save,
  };
}

export function ProjectImages({
  editor,
  disabled,
}: {
  editor: ReturnType<typeof useProjectImages>;
  disabled: boolean;
}) {
  const form = useFormContext<ImagesValues>();
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
    <div className="space-y-5">
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
        className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-5 py-8 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring ${dragging ? "border-primary bg-accent" : "bg-muted/30"}`}
      >
        <ImagePlusIcon
          className="size-8 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="font-medium">
            Arrastra imágenes aquí o pégalas desde el portapapeles
          </p>
          <p className="text-sm text-muted-foreground">
            PNG, JPEG o WebP · máximo 5 MiB cada una
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => fileInput.current?.click()}
        >
          Seleccionar imágenes
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
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
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este proyecto todavía no tiene imágenes.
        </p>
      ) : (
        <ul
          className="grid gap-4 sm:grid-cols-2"
          aria-label="Imágenes del proyecto"
        >
          {entries.map((entry, entryIndex) => {
            if (entry.removed) return null;
            const number = visible.indexOf(entry) + 1;
            const isFeatured = featured === entry.key;
            return (
              <li
                key={entry.key}
                className="flex flex-col overflow-hidden rounded-lg border bg-card"
              >
                <div className="relative aspect-video w-full bg-muted">
                  <Image
                    src={entry.preview}
                    alt={
                      entry.altText || "Vista previa pendiente de descripción"
                    }
                    fill
                    unoptimized
                    sizes="(max-width:640px) 100vw, 340px"
                    className="object-contain"
                  />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {isFeatured && (
                      <Badge className="bg-background text-foreground shadow">
                        <StarIcon aria-hidden="true" />
                        Destacada
                      </Badge>
                    )}
                    {!entry.image && (
                      <Badge className="bg-background text-foreground shadow">
                        Sin guardar
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  <FormField
                    control={form.control}
                    name={`images.${entryIndex}.altText`}
                    label={`Texto alternativo de la imagen ${number}`}
                  >
                    {({ field, control }) => (
                      <Input
                        {...field}
                        {...control}
                        maxLength={300}
                        disabled={disabled}
                        placeholder="Describe lo que se ve"
                        onChange={(event) => {
                          field.onChange(event);
                          patch(entry.key, { done: false });
                        }}
                      />
                    )}
                  </FormField>
                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={isFeatured ? "secondary" : "outline"}
                      aria-pressed={isFeatured}
                      disabled={disabled}
                      onClick={() => setFeatured(entry.key)}
                    >
                      <StarIcon aria-hidden="true" />
                      {isFeatured ? "Destacada" : "Usar como destacada"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive hover:text-destructive"
                      disabled={disabled}
                      aria-label={`Quitar imagen ${number}`}
                      onClick={() => {
                        patch(entry.key, { removed: true });
                        if (isFeatured)
                          setFeatured(
                            visible.find((item) => item.key !== entry.key)
                              ?.key ?? "",
                          );
                      }}
                    >
                      <Trash2Icon aria-hidden="true" />
                      Quitar
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {entries.some((entry) => entry.removed) && (
        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <p className="text-sm text-muted-foreground">
            Las imágenes quitadas se eliminarán al guardar.
          </p>
          <div className="flex flex-wrap gap-2">
            {entries
              .filter((entry) => entry.removed)
              .map((entry) => (
                <Button
                  key={entry.key}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => patch(entry.key, { removed: false })}
                >
                  <Undo2Icon aria-hidden="true" />
                  Restaurar {entry.altText || "imagen"}
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
