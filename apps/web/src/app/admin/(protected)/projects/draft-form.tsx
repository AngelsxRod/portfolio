"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Card, CardContent } from "@repo/ui/components/card";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@repo/ui/components/field";
import { Alert, AlertTitle, AlertDescription } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/sonner";
import type {
  DraftProject,
  PublishedProject,
  ProjectImage,
} from "@/lib/drafts";

import { ProjectImages, useProjectImages } from "./project-images";

function suggestSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160)
    .replace(/-$/, "");
}

export function DraftForm({
  draft,
  justCreated = false,
  initialImages = [],
}: {
  draft?: DraftProject | PublishedProject;
  initialImages?: ProjectImage[];
  justCreated?: boolean;
}) {
  const router = useRouter();
  const creationKey = useRef<string | null>(null);
  const images = useProjectImages(initialImages);
  const [projectId, setProjectId] = useState(draft?.id);
  const published = draft?.status === "published";
  const [saveError, setSaveError] = useState("");
  const [slug, setSlug] = useState(draft?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(draft));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(justCreated);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !images.validate()) return;
    const form = new FormData(event.currentTarget);
    setSaveError("");
    setSaving(true);
    setSaved(false);
    setErrors({});
    const body = {
      title: form.get("title"),
      slug: form.get("slug"),
      summary: form.get("summary"),
      description: form.get("description"),
      demoUrl: form.get("demoUrl"),
      codeUrl: form.get("codeUrl"),
      technologies: String(form.get("technologies") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      position: Number(form.get("position")),
    };
    try {
      let id = projectId;
      if (!published) {
        if (!id && !creationKey.current)
          creationKey.current = crypto.randomUUID();
        const response = await fetch(
          `/api/admin/projects/drafts${id ? `/${id}` : ""}`,
          {
            method: id ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              ...(!id && creationKey.current
                ? { "Idempotency-Key": creationKey.current }
                : {}),
            },
            body: JSON.stringify(body),
          },
        );
        if (response.status === 401) {
          toast.error("Tu sesión venció.", {
            description: "Inicia sesión para continuar.",
            action: {
              label: "Iniciar sesión",
              onClick: () =>
                window.open("/admin/login", "_blank", "noopener,noreferrer"),
            },
          });
          return;
        }
        const result = await response.json();
        if (!response.ok) {
          toast.error(result.message ?? "No se pudo guardar el borrador.", {
            description: result.fields?.form,
          });
          setErrors(result.fields ?? {});
          return;
        }
        id = result.id;
        setProjectId(id);
      }
      if (!id) throw new Error("No se pudo identificar el proyecto guardado.");
      await images.save(id);
      setSaved(true);
      if (!draft) router.replace(`/admin/projects/${id}/edit?saved=1`);
      else router.refresh();
    } catch (error) {
      const message =
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : "No se pudo conectar. Inténtalo de nuevo; tus cambios siguen en el formulario.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function fieldError(name: string) {
    return errors[name] ? (
      <FieldError id={`${name}-error`}>{errors[name]}</FieldError>
    ) : null;
  }
  function accessibility(name: string) {
    return {
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
    };
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a borradores
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {published
            ? "Imágenes del proyecto publicado"
            : draft
              ? "Editar borrador"
              : "Nuevo borrador"}
        </h1>
        <p className="text-muted-foreground">
          {published
            ? "Puedes gestionar las imágenes. Retira el proyecto desde el panel para editar su texto."
            : "Título y slug obligatorios. Si añades imágenes, describe cada una antes de guardar."}
        </p>
      </div>
      {saveError && (
        <Alert role="alert">
          <AlertTitle>Guardado pendiente</AlertTitle>
          <AlertDescription>
            {saveError}{" "}
            <a
              href="/admin/login"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Abrir inicio de sesión
            </a>
          </AlertDescription>
        </Alert>
      )}
      {saved && (
        <Alert role="status">
          <AlertTitle>
            {published ? "Imágenes guardadas" : "Borrador guardado"}
          </AlertTitle>
          <AlertDescription>
            Los cambios se guardaron correctamente.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-6" aria-busy={saving}>
            <fieldset disabled={saving || published}>
              <FieldGroup>
                <Field data-invalid={Boolean(errors.title)}>
                  <FieldLabel htmlFor="title">Título</FieldLabel>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={draft?.title ?? ""}
                    required
                    maxLength={200}
                    {...accessibility("title")}
                    onChange={(event) => {
                      if (!slugEdited) setSlug(suggestSlug(event.target.value));
                    }}
                  />
                  {fieldError("title")}
                </Field>
                <Field data-invalid={Boolean(errors.slug)}>
                  <FieldLabel htmlFor="slug">Slug</FieldLabel>
                  <Input
                    id="slug"
                    name="slug"
                    value={slug}
                    required
                    maxLength={160}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    {...accessibility("slug")}
                    onChange={(event) => {
                      setSlugEdited(true);
                      setSlug(event.target.value);
                    }}
                  />
                  <FieldDescription>
                    Identificador único con letras minúsculas, números y
                    guiones. Puedes modificar la propuesta.
                  </FieldDescription>
                  {fieldError("slug")}
                </Field>
                <Field data-invalid={Boolean(errors.summary)}>
                  <FieldLabel htmlFor="summary">Resumen</FieldLabel>
                  <Textarea
                    id="summary"
                    name="summary"
                    defaultValue={draft?.summary ?? ""}
                    maxLength={1000}
                    {...accessibility("summary")}
                  />
                  {fieldError("summary")}
                </Field>
                <Field data-invalid={Boolean(errors.description)}>
                  <FieldLabel htmlFor="description">Descripción</FieldLabel>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={draft?.description ?? ""}
                    maxLength={50000}
                    className="min-h-48 font-mono"
                    {...accessibility("description")}
                  />
                  <FieldDescription>
                    Puedes escribir Markdown. El contenido se guarda como texto.
                  </FieldDescription>
                  {fieldError("description")}
                </Field>
                <Field data-invalid={Boolean(errors.demoUrl)}>
                  <FieldLabel htmlFor="demoUrl">URL de la demo</FieldLabel>
                  <Input
                    id="demoUrl"
                    name="demoUrl"
                    type="url"
                    defaultValue={draft?.demoUrl ?? ""}
                    maxLength={2048}
                    placeholder="https://"
                    {...accessibility("demoUrl")}
                  />
                  {fieldError("demoUrl")}
                </Field>
                <Field data-invalid={Boolean(errors.codeUrl)}>
                  <FieldLabel htmlFor="codeUrl">URL del código</FieldLabel>
                  <Input
                    id="codeUrl"
                    name="codeUrl"
                    type="url"
                    defaultValue={draft?.codeUrl ?? ""}
                    maxLength={2048}
                    placeholder="https://"
                    {...accessibility("codeUrl")}
                  />
                  {fieldError("codeUrl")}
                </Field>
                <Field data-invalid={Boolean(errors.technologies)}>
                  <FieldLabel htmlFor="technologies">Tecnologías</FieldLabel>
                  <Input
                    id="technologies"
                    name="technologies"
                    defaultValue={draft?.technologies.join(", ") ?? ""}
                    maxLength={2500}
                    {...accessibility("technologies")}
                  />
                  <FieldDescription>
                    Separa las tecnologías con comas, por ejemplo: React,
                    NestJS, PostgreSQL. Máximo 30.
                  </FieldDescription>
                  {fieldError("technologies")}
                </Field>
                <Field data-invalid={Boolean(errors.position)}>
                  <FieldLabel htmlFor="position">Posición</FieldLabel>
                  <Input
                    id="position"
                    name="position"
                    type="number"
                    min={0}
                    max={2147483647}
                    step={1}
                    defaultValue={draft?.position ?? 0}
                    required
                    {...accessibility("position")}
                  />
                  <FieldDescription>
                    Los números menores aparecen primero en la lista.
                  </FieldDescription>
                  {fieldError("position")}
                </Field>
              </FieldGroup>
            </fieldset>
            <ProjectImages editor={images} disabled={saving} />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Guardando…"
                  : published
                    ? "Guardar imágenes"
                    : "Guardar borrador"}
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin" />}
              >
                Volver a la lista
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
