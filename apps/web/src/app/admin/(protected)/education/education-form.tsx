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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { Card, CardContent } from "@repo/ui/components/card";
import { FieldGroup } from "@repo/ui/components/field";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/sonner";
import { FormField } from "@/components/form-field";
import {
  applyServerErrors,
  notifySessionExpired,
  positionField,
  requiredText,
} from "@/lib/form";
import { educationLevels, type AdminEducation } from "@/lib/education";

const month = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

const schema = z
  .object({
    institution: requiredText(120),
    level: z
      .string()
      .refine((value) => value in educationLevels, "Elige un nivel."),
    program: requiredText(120),
    startDate: z.string().regex(month, "Elige el mes y año de inicio."),
    endDate: z
      .string()
      .refine(
        (value) => value === "" || month.test(value),
        "Elige un mes y año válidos.",
      ),
    description: z.string().trim().max(2000, "Usa hasta 2.000 caracteres."),
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

export function EducationForm({
  education,
  justCreated = false,
}: {
  education?: AdminEducation;
  justCreated?: boolean;
}) {
  const router = useRouter();
  const published = education?.status === "published";
  const [saved, setSaved] = useState(justCreated);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      institution: education?.institution ?? "",
      level: education?.level ?? "",
      program: education?.program ?? "",
      startDate: education?.startDate ?? "",
      endDate: education?.endDate ?? "",
      description: education?.description ?? "",
      position: String(education?.position ?? 0),
    },
  });
  const saving = form.formState.isSubmitting;

  async function onSubmit(values: Values) {
    if (published) return;
    setSaved(false);
    try {
      const response = await fetch(
        `/api/admin/education${education ? `/${education.id}` : ""}`,
        {
          method: education ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            institution: values.institution,
            level: values.level,
            program: values.program,
            startDate: values.startDate,
            endDate: values.endDate || null,
            description: values.description,
            position: Number(values.position),
          }),
        },
      );
      if (response.status === 401) return notifySessionExpired();
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message ?? "No se pudo guardar la educación.", {
          description: result.fields?.form,
        });
        applyServerErrors(form, result.fields);
        return;
      }
      setSaved(true);
      if (!education)
        router.replace(`/admin/education/${result.id}/edit?saved=1`);
      else router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar. Inténtalo de nuevo; tus cambios siguen en el formulario.",
      );
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin/education"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a educación
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {published
            ? "Educación publicada"
            : education
              ? "Editar educación"
              : "Nueva educación"}
        </h1>
        <p className="text-muted-foreground">
          {published
            ? "Retírala desde la lista para poder editarla."
            : "Institución, nivel, programa y fecha de inicio son obligatorios. Se guarda como borrador."}
        </p>
      </div>
      {saved && (
        <Alert role="status">
          <AlertTitle>Borrador guardado</AlertTitle>
          <AlertDescription>
            Los cambios se guardaron correctamente.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-6"
            aria-busy={saving}
          >
            <fieldset disabled={saving || published}>
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="institution"
                  label="Institución"
                >
                  {({ field, control }) => (
                    <Input {...field} {...control} maxLength={120} />
                  )}
                </FormField>
                <FormField control={form.control} name="level" label="Nivel">
                  {({ field, control }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={field.disabled}
                    >
                      <SelectTrigger {...control} className="w-full">
                        <SelectValue placeholder="Elige un nivel">
                          {(value: string) =>
                            educationLevels[
                              value as keyof typeof educationLevels
                            ]
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(educationLevels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="program"
                  label="Programa"
                  description="Carrera, bachillerato o curso."
                >
                  {({ field, control }) => (
                    <Input {...field} {...control} maxLength={120} />
                  )}
                </FormField>
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
                  description="Déjalo vacío si sigues estudiando. No puede ser anterior al inicio."
                >
                  {({ field, control }) => (
                    <MonthPicker
                      {...control}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="En curso (sin fin)"
                      clearLabel="Quitar fecha de fin"
                    />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="description"
                  label="Descripción"
                  description="Opcional. Texto plano de hasta 2.000 caracteres."
                >
                  {({ field, control }) => (
                    <Textarea
                      {...field}
                      {...control}
                      rows={5}
                      maxLength={2000}
                    />
                  )}
                </FormField>
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
            </fieldset>
            <div className="flex flex-wrap gap-3">
              {!published && (
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar borrador"}
                </Button>
              )}
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin/education" />}
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
