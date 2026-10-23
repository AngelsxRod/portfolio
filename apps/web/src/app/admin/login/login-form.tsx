"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { FieldGroup } from "@repo/ui/components/field";
import { FormField } from "@/components/form-field";

const schema = z.object({
  username: z
    .string()
    .min(1, "Introduce tu usuario.")
    .max(128, "Usa hasta 128 caracteres."),
  password: z
    .string()
    .min(1, "Introduce tu contraseña.")
    .max(1024, "Usa hasta 1.024 caracteres."),
});

type Values = z.infer<typeof schema>;

/**
 * Valida con React Hook Form y envía el formulario de forma nativa para que la
 * ruta del servidor establezca la cookie y redirija.
 */
export function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <form
      ref={formRef}
      action="/api/admin/login"
      method="post"
      noValidate
      className="space-y-5"
      onSubmit={form.handleSubmit(() => formRef.current?.submit())}
    >
      <FieldGroup>
        <FormField control={form.control} name="username" label="Usuario">
          {({ field, control }) => (
            <Input
              {...field}
              {...control}
              autoComplete="username"
              maxLength={128}
            />
          )}
        </FormField>
        <FormField control={form.control} name="password" label="Contraseña">
          {({ field, control }) => (
            <Input
              {...field}
              {...control}
              type="password"
              autoComplete="current-password"
              maxLength={1024}
            />
          )}
        </FormField>
      </FieldGroup>
      <Button type="submit" className="w-full">
        Entrar
      </Button>
    </form>
  );
}
