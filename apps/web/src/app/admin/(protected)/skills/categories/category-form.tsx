"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card, CardContent } from "@repo/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/field";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/sonner";
import type { SkillCategory } from "@/lib/skills";

export function CategoryForm({
  category,
  justCreated = false,
}: {
  category?: SkillCategory;
  justCreated?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(justCreated);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setSaved(false);
    setErrors({});
    try {
      const response = await fetch(
        `/api/admin/skill-categories${category ? `/${category.id}` : ""}`,
        {
          method: category ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            position: Number(form.get("position")),
          }),
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
        toast.error(result.message ?? "No se pudo guardar la categoría.", {
          description: result.fields?.form,
        });
        setErrors(result.fields ?? {});
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
          <form onSubmit={submit} className="space-y-6" aria-busy={saving}>
            <fieldset disabled={saving}>
              <FieldGroup>
                <Field data-invalid={Boolean(errors.name)}>
                  <FieldLabel htmlFor="name">Nombre</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={category?.name ?? ""}
                    required
                    maxLength={80}
                    {...accessibility("name")}
                  />
                  <FieldDescription>
                    Hasta 80 caracteres. No puede repetirse, sin distinguir
                    mayúsculas.
                  </FieldDescription>
                  {fieldError("name")}
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
                    defaultValue={category?.position ?? 0}
                    required
                    {...accessibility("position")}
                  />
                  <FieldDescription>
                    Los números menores aparecen primero en la portada.
                  </FieldDescription>
                  {fieldError("position")}
                </Field>
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
