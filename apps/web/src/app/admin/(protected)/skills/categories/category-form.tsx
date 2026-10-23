"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
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
import type { SkillCategory } from "@/lib/skills";

const schema = z.object({
  name: requiredText(80),
  position: positionField,
});

type Values = z.infer<typeof schema>;

export function CategoryForm({
  category,
  justCreated = false,
}: {
  category?: SkillCategory;
  justCreated?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(justCreated);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      position: String(category?.position ?? 0),
    },
  });
  const saving = form.formState.isSubmitting;

  async function onSubmit(values: Values) {
    setSaved(false);
    try {
      const response = await fetch(
        `/api/admin/skill-categories${category ? `/${category.id}` : ""}`,
        {
          method: category ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            position: Number(values.position),
          }),
        },
      );
      if (response.status === 401) return notifySessionExpired();
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message ?? "No se pudo guardar la categoría.", {
          description: result.fields?.form,
        });
        applyServerErrors(form, result.fields);
        return;
      }
      setSaved(true);
      if (!category)
        router.replace(`/admin/skills/categories/${result.id}/edit?saved=1`);
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
          href="/admin/skills/categories"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a categorías
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {category ? "Editar categoría" : "Nueva categoría"}
        </h1>
        <p className="text-muted-foreground">
          Las habilidades eligen una categoría de esta lista. Renombrarla
          actualiza todas sus habilidades.
        </p>
      </div>
      {saved && (
        <Alert role="status">
          <AlertTitle>Categoría guardada</AlertTitle>
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
            <fieldset disabled={saving}>
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
                  name="position"
                  label="Posición"
                  description="Los números menores aparecen primero en la portada."
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
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar categoría"}
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin/skills/categories" />}
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
