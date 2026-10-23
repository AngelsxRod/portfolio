"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@repo/ui/components/button";

/**
 * Formulario sin campos gestionado con React Hook Form; el envío es nativo para
 * que la ruta del servidor revoque la sesión, borre la cookie y redirija.
 */
export function LogoutForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm();
  return (
    <form
      ref={formRef}
      action="/api/admin/logout"
      method="post"
      onSubmit={form.handleSubmit(() => formRef.current?.submit())}
    >
      <Button
        type="submit"
        variant="outline"
        disabled={form.formState.isSubmitting}
      >
        Cerrar sesión
      </Button>
    </form>
  );
}
