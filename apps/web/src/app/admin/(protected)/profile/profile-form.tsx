"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Card, CardContent } from "@repo/ui/components/card";
import { FieldGroup } from "@repo/ui/components/field";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/sonner";
import { FormField } from "@/components/form-field";
import {
  applyServerErrors,
  notifySessionExpired,
  optionalUrl,
  requiredText,
} from "@/lib/form";
import type { AdminProfile } from "@/lib/profile";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  displayName: requiredText(120),
  presentation: requiredText(2000),
  location: z.string().trim().max(120, "Usa hasta 120 caracteres."),
  email: z
    .string()
    .trim()
    .max(254, "Usa hasta 254 caracteres.")
    .refine(
      (value) => value === "" || emailPattern.test(value),
      "Introduce un correo válido.",
    ),
  links: z
    .array(
      z.object({
        label: requiredText(40),
        url: optionalUrl.min(1, "Introduce una URL HTTP o HTTPS válida."),
      }),
    )
    .max(10, "Usa hasta 10 enlaces.")
    .superRefine((links, ctx) => {
      if (new Set(links.map((link) => link.url)).size !== links.length)
        ctx.addIssue({ code: "custom", message: "No repitas la misma URL." });
    }),
});

type Values = z.infer<typeof schema>;

export function ProfileForm({ profile }: { profile: AdminProfile }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const draft = profile.draft ?? profile.published;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: draft?.displayName ?? "",
      presentation: draft?.presentation ?? "",
      location: draft?.location ?? "",
      email: draft?.email ?? "",
      links: draft?.links ?? [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links",
  });
  const saving = form.formState.isSubmitting;
  const published = Boolean(profile.published);

  async function request(path: string, init: RequestInit) {
    const response = await fetch(`/api/admin/profile${path}`, {
      ...init,
      headers: { "Content-Type": "application/json" },
    });
    if (response.status === 401) {
      notifySessionExpired();
      return null;
    }
    return { response, result: await response.json() };
  }

  async function onSubmit(values: Values) {
    setSaved(false);
    try {
      const answer = await request("", {
        method: "PUT",
        body: JSON.stringify({
          displayName: values.displayName,
          presentation: values.presentation,
          location: values.location || null,
          email: values.email || null,
          links: values.links,
        }),
      });
      if (!answer) return;
      if (!answer.response.ok) {
        toast.error(answer.result.message ?? "No se pudo guardar el perfil.", {
          description: answer.result.fields?.form,
        });
        applyServerErrors(form, answer.result.fields);
        return;
      }
      form.reset(values);
      setSaved(true);
      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar. Inténtalo de nuevo; tus cambios siguen en el formulario.",
      );
    }
  }

  async function changePublication(action: "publish" | "unpublish") {
    if (pending) return;
    setPending(true);
    try {
      const answer = await request("/publication", {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      if (!answer) return;
      if (!answer.response.ok) {
        toast.error(
          answer.result.fields?.form ??
            answer.result.message ??
            "No se pudo cambiar la publicación.",
        );
        return;
      }
      toast.success(
        action === "publish" ? "Perfil publicado" : "Perfil retirado",
      );
      router.refresh();
    } catch {
      toast.error("No se pudo conectar. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  const dirty = form.formState.isDirty;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
          {published ? (
            <Badge>Publicado</Badge>
          ) : (
            <Badge variant="secondary">Sin publicar</Badge>
          )}
          {profile.hasUnpublishedChanges && published && (
            <Badge variant="outline">Cambios sin publicar</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Edita el borrador; la web pública no cambia hasta que lo publiques.
        </p>
      </div>
      {saved && (
        <Alert role="status">
          <AlertTitle>Borrador guardado</AlertTitle>
          <AlertDescription>
            Los cambios se guardaron, pero aún no son públicos.
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
                  name="displayName"
                  label="Nombre público"
                >
                  {({ field, control }) => (
                    <Input {...field} {...control} maxLength={120} />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="presentation"
                  label="Presentación"
                  description="Texto plano de hasta 2.000 caracteres."
                >
                  {({ field, control }) => (
                    <Textarea
                      {...field}
                      {...control}
                      rows={6}
                      maxLength={2000}
                    />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="location"
                  label="Ubicación"
                  description="Opcional."
                >
                  {({ field, control }) => (
                    <Input {...field} {...control} maxLength={120} />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="email"
                  label="Correo público"
                  description="Opcional. Se mostrará en la web."
                >
                  {({ field, control }) => (
                    <Input
                      {...field}
                      {...control}
                      type="email"
                      inputMode="email"
                      maxLength={254}
                    />
                  )}
                </FormField>
                <section className="space-y-4" aria-labelledby="links-title">
                  <div className="space-y-1">
                    <h2 id="links-title" className="text-sm font-medium">
                      Enlaces
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Opcional. Hasta 10, con etiqueta y URL HTTP o HTTPS sin
                      repetir.
                    </p>
                  </div>
                  {form.formState.errors.links?.message && (
                    <p role="alert" className="text-sm text-destructive">
                      {form.formState.errors.links.message}
                    </p>
                  )}
                  {form.formState.errors.links?.root?.message && (
                    <p role="alert" className="text-sm text-destructive">
                      {form.formState.errors.links.root.message}
                    </p>
                  )}
                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-start"
                    >
                      <FormField
                        control={form.control}
                        name={`links.${index}.label`}
                        label={`Etiqueta del enlace ${index + 1}`}
                      >
                        {({ field, control }) => (
                          <Input {...field} {...control} maxLength={40} />
                        )}
                      </FormField>
                      <FormField
                        control={form.control}
                        name={`links.${index}.url`}
                        label={`URL del enlace ${index + 1}`}
                      >
                        {({ field, control }) => (
                          <Input
                            {...field}
                            {...control}
                            type="url"
                            inputMode="url"
                            maxLength={2048}
                          />
                        )}
                      </FormField>
                      <Button
                        type="button"
                        variant="outline"
                        className="sm:mt-6"
                        onClick={() => remove(index)}
                        aria-label={`Quitar el enlace ${index + 1}`}
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={fields.length >= 10}
                    onClick={() => append({ label: "", url: "" })}
                  >
                    Añadir enlace
                  </Button>
                </section>
              </FieldGroup>
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar borrador"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  pending ||
                  dirty ||
                  !profile.draft ||
                  (published && !profile.hasUnpublishedChanges)
                }
                onClick={() => changePublication("publish")}
              >
                {published ? "Publicar cambios" : "Publicar"}
              </Button>
              {published && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => changePublication("unpublish")}
                >
                  Retirar
                </Button>
              )}
            </div>
            {dirty && (
              <p className="text-sm text-muted-foreground">
                Guarda el borrador antes de publicar.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
