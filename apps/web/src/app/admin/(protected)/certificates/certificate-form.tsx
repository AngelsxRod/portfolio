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
import { Card, CardContent } from "@repo/ui/components/card";
import { FieldGroup } from "@repo/ui/components/field";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/sonner";
import { FormField } from "@/components/form-field";
import {
  applyServerErrors,
  notifySessionExpired,
  optionalUrl,
  positionField,
  requiredText,
} from "@/lib/form";
import type { AdminCertificate } from "@/lib/certificates";

const month = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

const schema = z.object({
  name: requiredText(160),
  issuer: requiredText(120),
  issueDate: z.string().regex(month, "Elige el mes y año de emisión."),
  verificationUrl: optionalUrl,
  description: z.string().trim().max(2000, "Usa hasta 2.000 caracteres."),
  position: positionField,
});

type Values = z.infer<typeof schema>;

export function CertificateForm({
  certificate,
  justCreated = false,
}: {
  certificate?: AdminCertificate;
  justCreated?: boolean;
}) {
  const router = useRouter();
  const published = certificate?.status === "published";
  const [saved, setSaved] = useState(justCreated);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: certificate?.name ?? "",
      issuer: certificate?.issuer ?? "",
      issueDate: certificate?.issueDate ?? "",
      verificationUrl: certificate?.verificationUrl ?? "",
      description: certificate?.description ?? "",
      position: String(certificate?.position ?? 0),
    },
  });
  const saving = form.formState.isSubmitting;

  async function onSubmit(values: Values) {
    if (published) return;
    setSaved(false);
    try {
      const response = await fetch(
        `/api/admin/certificates${certificate ? `/${certificate.id}` : ""}`,
        {
          method: certificate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            issuer: values.issuer,
            issueDate: values.issueDate,
            verificationUrl: values.verificationUrl || null,
            description: values.description,
            position: Number(values.position),
          }),
        },
      );
      if (response.status === 401) return notifySessionExpired();
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message ?? "No se pudo guardar la certificado.", {
          description: result.fields?.form,
        });
        applyServerErrors(form, result.fields);
        return;
      }
      setSaved(true);
      if (!certificate)
        router.replace(`/admin/certificates/${result.id}/edit?saved=1`);
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
          href="/admin/certificates"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a certificados
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {published
            ? "Certificado publicado"
            : certificate
              ? "Editar certificado"
              : "Nuevo certificado"}
        </h1>
        <p className="text-muted-foreground">
          {published
            ? "Retíralo desde la lista para poder editarla."
            : "Nombre, emisor y fecha de emisión son obligatorios. Se guarda como borrador."}
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
                <FormField control={form.control} name="name" label="Nombre">
                  {({ field, control }) => (
                    <Input {...field} {...control} maxLength={160} />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="issuer"
                  label="Emisor"
                  description="Institución u organización que lo emitió."
                >
                  {({ field, control }) => (
                    <Input {...field} {...control} maxLength={120} />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="issueDate"
                  label="Fecha de emisión"
                  description="Mes y año de emisión."
                >
                  {({ field, control }) => (
                    <MonthPicker
                      {...control}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Elige el mes de emisión"
                    />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="verificationUrl"
                  label="Enlace de verificación"
                  description="Opcional. URL HTTP o HTTPS donde se puede comprobar el certificado."
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
                render={<Link href="/admin/certificates" />}
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
