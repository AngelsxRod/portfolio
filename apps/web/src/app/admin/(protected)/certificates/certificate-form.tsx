"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@repo/ui/components/input";
import { MonthPicker } from "@repo/ui/components/month-picker";
import { Textarea } from "@repo/ui/components/textarea";
import { FieldGroup } from "@repo/ui/components/field";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { toast } from "@repo/ui/components/sonner";
import { FormField } from "@/components/form-field";
import { publishCreated } from "@/components/admin/publish-created";
import { FormPage, FormSection } from "@/components/admin/form-page";
import { PublicationButton } from "@/components/admin/publication-button";
import { SaveMenu } from "@/components/admin/save-menu";
import { DiscardPendingButton } from "@/components/admin/discard-pending-button";
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
  // Un registro publicado se edita sobre sus cambios pendientes, si los hay.
  const current = certificate?.pending ?? certificate;
  const valuesOf = (source: typeof current) => ({
    name: source?.name ?? "",
    issuer: source?.issuer ?? "",
    issueDate: source?.issueDate ?? "",
    verificationUrl: source?.verificationUrl ?? "",
    description: source?.description ?? "",
    position: String(source?.position ?? 0),
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: valuesOf(current),
  });
  const saving = form.formState.isSubmitting;

  async function onSubmit(values: Values, publishNow = false) {
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
        toast.error(result.message ?? "No se pudo guardar el certificado.", {
          description: result.fields?.form,
        });
        applyServerErrors(form, result.fields);
        return;
      }
      setSaved(true);
      if (!certificate) {
        const published =
          publishNow &&
          (await publishCreated(
            "certificates",
            result.id,
            "Certificado",
            false,
          ));
        router.replace(
          `/admin/certificates/${result.id}/edit${published ? "" : "?saved=1"}`,
        );
      } else {
        if (publishNow)
          await publishCreated(
            "certificates",
            certificate.id,
            "Certificado",
            false,
          );
        router.refresh();
      }
    } catch {
      toast.error(
        "No se pudo conectar. Inténtalo de nuevo; tus cambios siguen en el formulario.",
      );
    }
  }

  return (
    <FormPage
      pending={Boolean(certificate?.pending)}
      actions={
        <>
          {certificate && published && certificate.pending && (
            <DiscardPendingButton
              resource="certificates"
              id={certificate.id}
              name={certificate.name}
              onDiscarded={() => form.reset(valuesOf(certificate))}
            />
          )}
          {certificate && published && (
            <PublicationButton
              resource="certificates"
              id={certificate.id}
              name={certificate.name}
              status="published"
              noun="Certificado"
              feminine={false}
            />
          )}
          <SaveMenu
            saving={saving}
            onPublish={form.handleSubmit((values) => onSubmit(values, true))}
            onDraft={form.handleSubmit((values) => onSubmit(values))}
          />
        </>
      }
      title={certificate ? "Editar certificado" : "Nuevo certificado"}
      description={
        published
          ? "Los cambios se guardan aparte: el sitio sigue mostrando la versión publicada hasta que publiques."
          : "Nombre, emisor y fecha de emisión son obligatorios. Se guarda como borrador."
      }
      status={certificate?.status}
      feminine={false}
    >
      {saved && (
        <Alert role="status">
          <AlertTitle>
            {published ? "Cambios guardados" : "Borrador guardado"}
          </AlertTitle>
          <AlertDescription>
            {published
              ? "Los cambios se guardaron, pero el sitio sigue mostrando la versión publicada."
              : "Los cambios se guardaron correctamente."}
          </AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        noValidate
        className="space-y-6"
        aria-busy={saving}
      >
        <fieldset disabled={saving} className="min-w-0 space-y-8">
          <FormSection
            title="Certificado"
            description="Nombre y quién lo emitió."
          >
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
            </FieldGroup>
          </FormSection>
          <FormSection
            title="Emisión y verificación"
            description="Fecha de emisión y enlace para verificarlo."
          >
            <FieldGroup>
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
            </FieldGroup>
          </FormSection>
          <FormSection
            title="Detalle"
            description="Descripción que se muestra en el sitio."
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
        <button type="submit" hidden />
      </form>
    </FormPage>
  );
}
