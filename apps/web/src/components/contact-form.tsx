"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { FieldError, FieldGroup } from "@repo/ui/components/field";
import { ProfileAvatar } from "@/components/os/avatar";
import { toast } from "@repo/ui/components/sonner";
import { FormField } from "@/components/form-field";
import { applyServerErrors } from "@/lib/form";

type Translator = (key: string, values?: Record<string, number>) => string;

/** Esquema del formulario con los mensajes de validación del idioma activo. */
function createSchema(t: Translator) {
  const length = (min: number, max: number) =>
    t("validation.length", { min, max });
  const requiredText = (max: number) =>
    z.string().trim().min(1, length(1, max)).max(max, length(1, max));
  return z.object({
    name: requiredText(120),
    email: z
      .string()
      .trim()
      .max(254, length(1, 254))
      .pipe(z.email(t("validation.email"))),
    phone: requiredText(40).refine(
      (value) =>
        /^\+?[0-9 ()-]+$/.test(value) &&
        /^[0-9]{8,15}$/.test(value.replace(/[^0-9]/g, "")),
      t("validation.phone"),
    ),
    message: z
      .string()
      .trim()
      .min(10, length(10, 4000))
      .max(4000, length(10, 4000)),
    turnstileToken: z.string().min(1, t("validation.verification")),
  });
}

type Values = z.infer<ReturnType<typeof createSchema>>;

export function ContactForm({ siteKey }: { siteKey: string | null }) {
  const t = useTranslations("contactForm");
  const mascot = useTranslations("mascot");
  const locale = useLocale();
  const schema = useMemo(() => createSchema(t), [t]);
  const turnstile = useRef<TurnstileInstance>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      turnstileToken: "",
    },
  });

  if (!siteKey)
    return (
      <Alert>
        <AlertTitle>{t("unavailableTitle")}</AlertTitle>
        <AlertDescription>{t("unavailableText")}</AlertDescription>
      </Alert>
    );

  if (sent)
    return (
      <div className="os-sent" role="status">
        <div className="os-sent-row">
          <ProfileAvatar
            mood="happy"
            celebrate
            size={88}
            alt={mascot("avatarAlt")}
          />
          <svg
            className="os-plane"
            viewBox="0 0 64 64"
            fill="none"
            stroke="var(--os-lime)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 30L58 8 46 56 30 38z" />
            <path d="M58 8L30 38v16l8-10" />
          </svg>
        </div>
        <p className="os-display os-sent-title">
          {t("sentTitleTop")}
          <br />
          {t("sentTitleBottom")}
        </p>
        <p className="os-sent-text">{t("sentText")}</p>
        <Button
          variant="outline"
          className="os-btn os-btn-outline"
          onClick={() => {
            form.reset();
            setSent(false);
          }}
        >
          {t("sentAgain")}
        </Button>
      </div>
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
          ? t("sendUnavailable")
          : (result.message ?? t("sendFailed")),
      );
    } catch {
      toast.error(t("network"));
    }
    // Los tokens de Turnstile son de un solo uso.
    turnstile.current?.reset();
    form.setValue("turnstileToken", "");
  }

  const tokenError = form.formState.errors.turnstileToken;

  return (
    <form noValidate className="os-form" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <FormField control={form.control} name="name" label={t("labelName")}>
          {({ field, control }) => (
            <Input
              {...field}
              {...control}
              className="os-input"
              autoComplete="name"
              maxLength={120}
              required
            />
          )}
        </FormField>
        <FormField control={form.control} name="email" label={t("labelEmail")}>
          {({ field, control }) => (
            <Input
              {...field}
              {...control}
              className="os-input"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          )}
        </FormField>
        <FormField control={form.control} name="phone" label={t("labelPhone")}>
          {({ field, control }) => (
            <Input
              {...field}
              {...control}
              className="os-input"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              required
            />
          )}
        </FormField>
        <FormField
          control={form.control}
          name="message"
          label={t("labelMessage")}
        >
          {({ field, control }) => (
            <Textarea
              {...field}
              {...control}
              className="os-input"
              rows={6}
              maxLength={4000}
              required
            />
          )}
        </FormField>
        <div>
          <Turnstile
            ref={turnstile}
            siteKey={siteKey}
            options={{ language: locale, theme: "dark" }}
            onSuccess={(token) =>
              form.setValue("turnstileToken", token, { shouldValidate: true })
            }
            onExpire={() => form.setValue("turnstileToken", "")}
            onError={() => form.setValue("turnstileToken", "")}
          />
          {tokenError && <FieldError errors={[tokenError]} />}
        </div>
      </FieldGroup>
      <Button
        type="submit"
        className="os-btn os-btn-primary os-submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
