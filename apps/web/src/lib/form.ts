import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { toast } from "@repo/ui/components/sonner";

/** Copia los errores por campo de la API (`fields`) al formulario. */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fields: Record<string, string> | undefined,
) {
  const known = Object.keys(form.getValues());
  for (const [name, message] of Object.entries(fields ?? {})) {
    if (known.includes(name))
      form.setError(name as Path<T>, { type: "server", message });
  }
}

export function notifySessionExpired() {
  toast.error("Tu sesión venció.", {
    description: "Inicia sesión para continuar.",
    action: {
      label: "Iniciar sesión",
      onClick: () =>
        window.open("/admin/login", "_blank", "noopener,noreferrer"),
    },
  });
}

export const positionMessage = "Introduce un entero entre 0 y 2147483647.";

/** Posición como texto del campo numérico; se convierte con `Number` al enviar. */
export const positionField = z
  .string()
  .trim()
  .regex(/^\d+$/, positionMessage)
  .refine((value) => Number(value) <= 2147483647, positionMessage);

export function lengthMessage(min: number, max: number) {
  return `Usa entre ${min} y ${max} caracteres.`;
}

/** Texto obligatorio, recortado, con la longitud indicada. */
export function requiredText(max: number) {
  return z
    .string()
    .trim()
    .min(1, lengthMessage(1, max))
    .max(max, lengthMessage(1, max));
}

export const optionalUrl = z
  .string()
  .trim()
  .max(2048, "Usa hasta 2.048 caracteres.")
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Introduce una URL HTTP o HTTPS válida.");
