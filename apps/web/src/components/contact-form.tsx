"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { FieldError, FieldGroup } from "@repo/ui/components/field";
import { toast } from "@repo/ui/components/sonner";
import { FormField } from "@/components/form-field";
import { applyServerErrors, lengthMessage, requiredText } from "@/lib/form";

const schema = z.object({
  name: requiredText(120),
  email: z
    .string()
    .trim()
    .max(254, lengthMessage(1, 254))
    .pipe(z.email("Introduce un correo válido.")),
  message: z
    .string()
    .trim()
    .min(10, lengthMessage(10, 4000))
    .max(4000, lengthMessage(10, 4000)),
  turnstileToken: z.string().min(1, "Completa la verificación."),
});

type Values = z.infer<typeof schema>;

export function ContactForm({ siteKey }: { siteKey: string | null }) {
  const turnstile = useRef<TurnstileInstance>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "", turnstileToken: "" },
  });

  if (!siteKey)
    return (
      <Alert>
        <AlertTitle>El formulario no está disponible</AlertTitle>
        <AlertDescription>
          La verificación de seguridad aún no está configurada. Escribe
          directamente al correo publicado en esta página.
        </AlertDescription>
      </Alert>
    );

  if (sent)
    return (
      <Alert role="status">
        <AlertTitle>Mensaje enviado</AlertTitle>
        <AlertDescription>
          Gracias por escribir. Responderé al correo que indicaste.
        </AlertDescription>
      </Alert>
    );

  async function onSubmit(values: Values) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        fields?: Record<string, string>;
      };
      if (response.ok) {
        setSent(true);
        return;
      }
      applyServerErrors(form, result.fields);
      toast.error(
        response.status === 503
          ? "El envío de mensajes aún no está disponible."
          : (result.message ?? "No se pudo enviar el mensaje."),
      );
    } catch {
      toast.error("No se pudo conectar. Inténtalo de nuevo.");
    }
    // Los tokens de Turnstile son de un solo uso.
    turnstile.current?.reset();
    form.setValue("turnstileToken", "");
  }

  const tokenError = form.formState.errors.turnstileToken;

  return (
    <form
      noValidate
      className="contact-form"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <FormField control={form.control} name="name" label="Nombre">
          {({ field, control }) => (
            <Input
              {...field}
              {...control}
              autoComplete="name"
              maxLength={120}
            />
          )}
        </FormField>
        <FormField control={form.control} name="email" label="Correo">
          {({ field, control }) => (
            <Input
              {...field}
              {...control}
              type="email"
              autoComplete="email"
              maxLength={254}
            />
          )}
        </FormField>
        <FormField control={form.control} name="message" label="Mensaje">
          {({ field, control }) => (
            <Textarea {...field} {...control} rows={7} maxLength={4000} />
          )}
        </FormField>
        <div>
          <Turnstile
            ref={turnstile}
            siteKey={siteKey}
            options={{ language: "es", theme: "auto" }}
            onSuccess={(token) =>
              form.setValue("turnstileToken", token, { shouldValidate: true })
            }
            onExpire={() => form.setValue("turnstileToken", "")}
            onError={() => form.setValue("turnstileToken", "")}
          />
          {tokenError && <FieldError errors={[tokenError]} />}
        </div>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Enviando…" : "Enviar mensaje"}
      </Button>
    </form>
  );
}
