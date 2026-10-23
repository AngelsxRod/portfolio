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

  async function onSubmit(values: Values) {
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
      if (!skill) router.replace(`/admin/skills/${result.id}/edit?saved=1`);
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
          href="/admin/skills"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a habilidades
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {published
            ? "Habilidad publicada"
            : skill
              ? "Editar habilidad"
              : "Nueva habilidad"}
        </h1>
        <p className="text-muted-foreground">
          {published
            ? "Retírala desde la lista para poder editarla."
            : "Nombre y categoría son obligatorios. La habilidad se guarda como borrador."}
        </p>
      </div>
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
                      <Link
                        className="underline"
                        href="/admin/skills/categories"
                      >
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
                render={<Link href="/admin/skills" />}
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
