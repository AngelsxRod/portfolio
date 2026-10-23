"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { FieldGroup } from "@repo/ui/components/field";
import { Alert, AlertTitle, AlertDescription } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/sonner";
import { FormField } from "@/components/form-field";
import { publishCreated } from "@/components/admin/publish-created";
import { FormPage, FormSection } from "@/components/admin/form-page";
import { PublicationButton } from "@/components/admin/publication-button";
import { SaveMenu } from "@/components/admin/save-menu";
import {
  applyServerErrors,
  lengthMessage,
  notifySessionExpired,
  optionalUrl,
  positionField,
  requiredText,
} from "@/lib/form";
import type {
  DraftProject,
  PublishedProject,
  ProjectImage,
} from "@/lib/drafts";

import {
  imageDefaults,
  imagesShape,
  ProjectImages,
  useProjectImages,
} from "./project-images";

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

function technologyList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const schema = z.object({
  title: requiredText(200),
  slug: z
    .string()
    .trim()
    .min(1, lengthMessage(1, 160))
    .max(160, lengthMessage(1, 160))
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Usa letras minúsculas, números y guiones entre palabras.",
    ),
  summary: z.string().trim().max(1000, "Usa hasta 1.000 caracteres."),
  description: z.string().trim().max(50000, "Usa hasta 50.000 caracteres."),
  demoUrl: optionalUrl,
  codeUrl: optionalUrl,
  technologies: z.string().superRefine((value, ctx) => {
    const items = technologyList(value);
    if (items.length > 30)
      ctx.addIssue({ code: "custom", message: "Usa hasta 30 tecnologías." });
    else if (items.some((item) => item.length > 80))
      ctx.addIssue({
        code: "custom",
        message: "Cada tecnología debe tener entre 1 y 80 caracteres.",
      });
    else if (new Set(items).size !== items.length)
      ctx.addIssue({ code: "custom", message: "No repitas tecnologías." });
  }),
  position: positionField,
  ...imagesShape,
});

type Values = z.infer<typeof schema>;

type Props = {
  draft?: DraftProject | PublishedProject;
  initialImages?: ProjectImage[];
  justCreated?: boolean;
};

export function DraftForm({ draft, initialImages = [], justCreated }: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: draft?.title ?? "",
      slug: draft?.slug ?? "",
      summary: draft?.summary ?? "",
      description: draft?.description ?? "",
      demoUrl: draft?.demoUrl ?? "",
      codeUrl: draft?.codeUrl ?? "",
      technologies: draft?.technologies.join(", ") ?? "",
      position: String(draft?.position ?? 0),
      ...imageDefaults(initialImages),
    },
  });
  return (
    <FormProvider {...form}>
      <DraftFormBody draft={draft} justCreated={justCreated} />
    </FormProvider>
  );
}

function DraftFormBody({
  draft,
  justCreated = false,
}: Omit<Props, "initialImages">) {
  const form = useFormContext<Values>();
  const router = useRouter();
  const creationKey = useRef<string | null>(null);
  const images = useProjectImages();
  const [projectId, setProjectId] = useState(draft?.id);
  const published = draft?.status === "published";
  const [saveError, setSaveError] = useState("");
  const [slugEdited, setSlugEdited] = useState(Boolean(draft));
  const [saved, setSaved] = useState(justCreated);
  const saving = form.formState.isSubmitting;

  async function onSubmit(values: Values, publishNow = false) {
    setSaveError("");
    setSaved(false);
    const body = {
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      description: values.description,
      demoUrl: values.demoUrl,
      codeUrl: values.codeUrl,
      technologies: technologyList(values.technologies),
      position: Number(values.position),
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
        if (response.status === 401) return notifySessionExpired();
        const result = await response.json();
        if (!response.ok) {
          toast.error(result.message ?? "No se pudo guardar el borrador.", {
            description: result.fields?.form,
          });
          applyServerErrors(form, result.fields);
          return;
        }
        id = result.id;
        setProjectId(id);
      }
      if (!id) throw new Error("No se pudo identificar el proyecto guardado.");
      await images.save(id);
      setSaved(true);
      if (!draft) {
        const published =
          publishNow &&
          (await publishCreated("projects", id, "Proyecto", false));
        router.replace(
          `/admin/projects/${id}/edit${published ? "" : "?saved=1"}`,
        );
      } else {
        if (publishNow) await publishCreated("projects", id, "Proyecto", false);
        router.refresh();
      }
    } catch (error) {
      const message =
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : "No se pudo conectar. Inténtalo de nuevo; tus cambios siguen en el formulario.";
      setSaveError(message);
      toast.error(message);
    }
  }

  return (
    <FormPage
      actions={
        <>
          {draft && published && (
            <PublicationButton
              resource="projects"
              id={draft.id}
              name={draft.title}
              status="published"
              noun="Proyecto"
              feminine={false}
            />
          )}
          {published && (
            <Button
              type="button"
              disabled={saving}
              onClick={form.handleSubmit((values) => onSubmit(values))}
            >
              {saving ? "Guardando…" : "Guardar imágenes"}
            </Button>
          )}
          {!published && (
            <SaveMenu
              saving={saving}
              onPublish={form.handleSubmit((values) => onSubmit(values, true))}
              onDraft={form.handleSubmit((values) => onSubmit(values))}
            />
          )}
        </>
      }
      title={
        published
          ? "Imágenes del proyecto publicado"
          : draft
            ? "Editar borrador"
            : "Nuevo borrador"
      }
      description={
        published
          ? "Puedes gestionar las imágenes. Retira el proyecto desde el panel para editar su texto."
          : "Título y slug obligatorios. Si añades imágenes, describe cada una antes de guardar."
      }
      status={draft?.status}
      feminine={false}
    >
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
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        noValidate
        className="space-y-6"
        aria-busy={saving}
      >
        <fieldset disabled={saving || published} className="min-w-0 space-y-8">
          <FormSection
            title="Identidad"
            description="Cómo se llama el proyecto y en qué dirección se publica."
          >
            <FieldGroup>
              <FormField control={form.control} name="title" label="Título">
                {({ field, control }) => (
                  <Input
                    {...field}
                    {...control}
                    maxLength={200}
                    onChange={(event) => {
                      field.onChange(event);
                      if (!slugEdited)
                        form.setValue("slug", suggestSlug(event.target.value));
                    }}
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="slug"
                label="Slug"
                description="Identificador único con letras minúsculas, números y guiones. Puedes modificar la propuesta."
              >
                {({ field, control }) => (
                  <Input
                    {...field}
                    {...control}
                    maxLength={160}
                    onChange={(event) => {
                      setSlugEdited(true);
                      field.onChange(event);
                    }}
                  />
                )}
              </FormField>
            </FieldGroup>
          </FormSection>
          <FormSection
            title="Contenido"
            description="Resumen y descripción en Markdown que se muestran en el sitio."
          >
            <FieldGroup>
              <FormField control={form.control} name="summary" label="Resumen">
                {({ field, control }) => (
                  <Textarea {...field} {...control} maxLength={1000} />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="description"
                label="Descripción"
                description="Puedes escribir Markdown. El contenido se guarda como texto."
              >
                {({ field, control }) => (
                  <Textarea
                    {...field}
                    {...control}
                    maxLength={50000}
                    className="min-h-48 font-mono"
                  />
                )}
              </FormField>
            </FieldGroup>
          </FormSection>
          <FormSection
            title="Enlaces y tecnologías"
            description="Demo, código y tecnologías usadas."
          >
            <FieldGroup>
              <FormField
                control={form.control}
                name="demoUrl"
                label="URL de la demo"
              >
                {({ field, control }) => (
                  <Input
                    {...field}
                    {...control}
                    type="url"
                    maxLength={2048}
                    placeholder="https://"
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="codeUrl"
                label="URL del código"
              >
                {({ field, control }) => (
                  <Input
                    {...field}
                    {...control}
                    type="url"
                    maxLength={2048}
                    placeholder="https://"
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="technologies"
                label="Tecnologías"
                description="Separa las tecnologías con comas, por ejemplo: React, NestJS, PostgreSQL. Máximo 30."
              >
                {({ field, control }) => (
                  <Input {...field} {...control} maxLength={2500} />
                )}
              </FormField>
            </FieldGroup>
          </FormSection>
          <FormSection
            title="Orden"
            description="Define qué proyecto aparece primero."
          >
            <FieldGroup>
              <FormField
                control={form.control}
                name="position"
                label="Posición"
                description="Los números menores aparecen primero en la lista."
              >
                {({ field, control }) => (
                  <Input
                    {...field}
                    {...control}
                    type="number"
                    min={0}
                    max={2147483647}
                    step={1}
                  />
                )}
              </FormField>
            </FieldGroup>
          </FormSection>
        </fieldset>
        <div className="border-t pt-6">
          <ProjectImages editor={images} disabled={saving} />
        </div>
        <button type="submit" hidden />
      </form>
    </FormPage>
  );
}
