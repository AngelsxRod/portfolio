"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
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
import type { AdminSkill, SkillCategory } from "@/lib/skills";

const schema = z.object({
  name: requiredText(80),
  categoryId: z.string().min(1, "Elige una categoría."),
  position: positionField,
});

type Values = z.infer<typeof schema>;

export function SkillForm({
  skill,
  categories,
  justCreated = false,
}: {
  skill?: AdminSkill;
  categories: SkillCategory[];
  justCreated?: boolean;
}) {
  const router = useRouter();
  const published = skill?.status === "published";
  const [saved, setSaved] = useState(justCreated);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: skill?.name ?? "",
      categoryId: skill?.categoryId ?? "",
      position: String(skill?.position ?? 0),
    },
  });
  const saving = form.formState.isSubmitting;

  async function onSubmit(values: Values, publishNow = false) {
    if (published) return;
    setSaved(false);
    try {
      const response = await fetch(
        `/api/admin/skills${skill ? `/${skill.id}` : ""}`,
        {
          method: skill ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            categoryId: values.categoryId,
            position: Number(values.position),
          }),
        },
      );
      if (response.status === 401) return notifySessionExpired();
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message ?? "No se pudo guardar la habilidad.", {
          description: result.fields?.form,
        });
        applyServerErrors(form, result.fields);
        return;
      }
      setSaved(true);
      if (!skill) {
        const published =
          publishNow &&
          (await publishCreated("skills", result.id, "Habilidad", true));
        router.replace(
          `/admin/skills/${result.id}/edit${published ? "" : "?saved=1"}`,
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
          ? "Habilidad publicada"
          : skill
            ? "Editar habilidad"
            : "Nueva habilidad"
      }
      description={
        published
          ? "Retírala para poder editarla."
          : "Nombre y categoría son obligatorios. La habilidad se guarda como borrador."
      }
      status={skill?.status}
      feminine={true}
    >
      {categories.length === 0 && !published && (
        <Alert role="status">
          <AlertTitle>Primero crea una categoría</AlertTitle>
          <AlertDescription>
            Las habilidades necesitan una categoría.{" "}
            <Link className="underline" href="/admin/skills/categories/new">
              Crear categoría
            </Link>
          </AlertDescription>
        </Alert>
      )}
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
            title="Habilidad"
            description="Nombre y categoría con la que se agrupa en la portada."
          >
            <FieldGroup>
              <FormField
                control={form.control}
                name="name"
                label="Nombre"
                description="Hasta 80 caracteres. No puede repetirse, sin distinguir mayúsculas."
              >
                {({ field, control }) => (
                  <Input {...field} {...control} maxLength={80} />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="categoryId"
                label="Categoría"
                description={
                  <>
                    Las categorías se administran en{" "}
                    <Link className="underline" href="/admin/skills/categories">
                      Categorías
                    </Link>
                    .
                  </>
                }
              >
                {({ field, control }) => (
                  <Select
                    name={field.name}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    items={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                  >
                    <SelectTrigger {...control} className="w-full">
                      <SelectValue placeholder="Elige una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                description="Los números menores aparecen primero."
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
            render={<Link href="/admin/skills" />}
          >
            Volver a la lista
          </Button>
          {skill && published && (
            <PublicationButton
              resource="skills"
              id={skill.id}
              name={skill.name}
              status="published"
              noun="Habilidad"
              feminine={true}
            />
          )}
          {skill && !published && !form.formState.isDirty && (
            <PublicationButton
              resource="skills"
              id={skill.id}
              name={skill.name}
              status="draft"
              noun="Habilidad"
              feminine={true}
              completeHref={`/admin/skills/${skill.id}/edit`}
            />
          )}
          {!skill && (
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
