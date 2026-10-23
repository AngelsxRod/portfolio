"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { MonthPicker } from "@repo/ui/components/month-picker";
import { Textarea } from "@repo/ui/components/textarea";
import { FieldGroup } from "@repo/ui/components/field";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/sonner";
import { FormField } from "@/components/form-field";
import { publishCreated } from "@/components/admin/publish-created";
import {
  FormPage,
  FormSection,
  StickyActions,
} from "@/components/admin/form-page";
import { PublicationButton } from "@/components/admin/publication-button";
import { Spinner } from "@repo/ui/components/spinner";
import {
  applyServerErrors,
  notifySessionExpired,
  positionField,
  requiredText,
} from "@/lib/form";
import type { AdminExperience } from "@/lib/experience";

const month = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const schema = z
  .object({
    organization: requiredText(120),
    title: requiredText(120),
    startDate: z.string().regex(month, "Elige el mes y año de inicio."),
    endDate: z
      .string()
      .refine(
        (value) => value === "" || month.test(value),
        "Elige un mes y año válidos.",
      ),
    description: z.string().trim().max(2000, "Usa hasta 2.000 caracteres."),
    achievements: z.string().superRefine((value, ctx) => {
      const items = lines(value);
      if (items.length > 10)
        ctx.addIssue({ code: "custom", message: "Usa hasta 10 logros." });
      else if (items.some((item) => item.length > 300))
        ctx.addIssue({
          code: "custom",
          message: "Cada logro debe tener entre 1 y 300 caracteres.",
        });
      else if (new Set(items).size !== items.length)
        ctx.addIssue({ code: "custom", message: "No repitas logros." });
    }),
    position: positionField,
  })
  .refine(
    (value) =>
      !value.endDate ||
      !month.test(value.startDate) ||
      value.endDate >= value.startDate,
    {
      path: ["endDate"],
      message: "El fin no puede ser anterior al inicio.",
    },
  );

type Values = z.infer<typeof schema>;

export function ExperienceForm({
  experience,
  justCreated = false,
}: {
  experience?: AdminExperience;
  justCreated?: boolean;
}) {
  const router = useRouter();
  const published = experience?.status === "published";
  const [saved, setSaved] = useState(justCreated);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization: experience?.organization ?? "",
      title: experience?.title ?? "",
      startDate: experience?.startDate ?? "",
      endDate: experience?.endDate ?? "",
      description: experience?.description ?? "",
      achievements: experience?.achievements.join("\n") ?? "",
      position: String(experience?.position ?? 0),
    },
  });
  const saving = form.formState.isSubmitting;

  async function onSubmit(values: Values, publishNow = false) {
    if (published) return;
    setSaved(false);
    try {
      const response = await fetch(
        `/api/admin/experience${experience ? `/${experience.id}` : ""}`,
        {
          method: experience ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organization: values.organization,
            title: values.title,
            startDate: values.startDate,
            endDate: values.endDate || null,
            description: values.description,
            achievements: lines(values.achievements),
            position: Number(values.position),
          }),
        },
      );
      if (response.status === 401) return notifySessionExpired();
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message ?? "No se pudo guardar la experiencia.", {
          description: result.fields?.form,
        });
        applyServerErrors(form, result.fields);
        return;
      }
      setSaved(true);
      if (!experience) {
        const published =
          publishNow &&
          (await publishCreated("experience", result.id, "Experiencia", true));
        router.replace(
          `/admin/experience/${result.id}/edit${published ? "" : "?saved=1"}`,
        );
      } else router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar. Inténtalo de nuevo; tus cambios siguen en el formulario.",
      );
    }
  }

  return (
    <FormPage
      title={
        published
          ? "Experiencia publicada"
          : experience
            ? "Editar experiencia"
            : "Nueva experiencia"
      }
      description={
        published
          ? "Retírala para poder editarla."
          : "Organización, puesto y fecha de inicio son obligatorios. Se guarda como borrador."
      }
      status={experience?.status}
      feminine={true}
    >
      {saved && (
        <Alert role="status">
          <AlertTitle>Borrador guardado</AlertTitle>
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
            title="Cargo"
            description="Dónde trabajaste y con qué puesto."
          >
            <FieldGroup>
              <FormField
                control={form.control}
                name="organization"
                label="Organización"
              >
                {({ field, control }) => (
                  <Input {...field} {...control} maxLength={120} />
                )}
              </FormField>
              <FormField control={form.control} name="title" label="Puesto">
                {({ field, control }) => (
                  <Input {...field} {...control} maxLength={120} />
                )}
              </FormField>
            </FieldGroup>
          </FormSection>
          <FormSection title="Periodo" description="Fechas de inicio y fin.">
            <FieldGroup>
              <FormField
                control={form.control}
                name="startDate"
                label="Inicio"
                description="Mes y año de inicio."
              >
                {({ field, control }) => (
                  <MonthPicker
                    {...control}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Elige el mes de inicio"
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="endDate"
                label="Fin"
                description="Déjalo vacío si es tu cargo actual. No puede ser anterior al inicio."
              >
                {({ field, control }) => (
                  <MonthPicker
                    {...control}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Cargo actual (sin fin)"
                    clearLabel="Quitar fecha de fin"
                  />
                )}
              </FormField>
            </FieldGroup>
          </FormSection>
          <FormSection
            title="Detalle"
            description="Descripción y logros que se muestran en el sitio."
          >
            <FieldGroup>
              <FormField
                control={form.control}
                name="description"
                label="Descripción"
                description="Opcional. Texto plano de hasta 2.000 caracteres."
              >
                {({ field, control }) => (
                  <Textarea {...field} {...control} rows={5} maxLength={2000} />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="achievements"
                label="Logros"
                description="Opcional. Un logro por línea: hasta 10, de 300 caracteres cada uno, sin repetir."
              >
                {({ field, control }) => (
                  <Textarea {...field} {...control} rows={5} />
                )}
              </FormField>
            </FieldGroup>
          </FormSection>
          <FormSection title="Orden" description="Define qué aparece primero.">
            <FieldGroup>
              <FormField
                control={form.control}
                name="position"
                label="Posición"
                description="Los números menores aparecen primero; con la misma posición, va antes el inicio más reciente."
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
        <StickyActions>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/experience" />}
          >
            Volver a la lista
          </Button>
          {experience && published && (
            <PublicationButton
              resource="experience"
              id={experience.id}
              name={experience.title}
              status="published"
              noun="Experiencia"
              feminine={true}
            />
          )}
          {experience && !published && !form.formState.isDirty && (
            <PublicationButton
              resource="experience"
              id={experience.id}
              name={experience.title}
              status="draft"
              noun="Experiencia"
              feminine={true}
              completeHref={`/admin/experience/${experience.id}/edit`}
            />
          )}
          {!experience && (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={form.handleSubmit((values) => onSubmit(values, true))}
            >
              Guardar y publicar
            </Button>
          )}
          {!published && (
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner role="presentation" aria-hidden="true" />
                  Guardando…
                </>
              ) : (
                "Guardar borrador"
              )}
            </Button>
          )}
        </StickyActions>
      </form>
    </FormPage>
  );
}
