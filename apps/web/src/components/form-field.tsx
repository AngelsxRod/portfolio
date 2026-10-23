"use client";

import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/field";

export type FormControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

/** Campo de React Hook Form con la estructura accesible de `Field` de shadcn/ui. */
export function FormField<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
>({
  control,
  name,
  label,
  description,
  children,
}: {
  control: Control<T>;
  name: N;
  label: string;
  description?: ReactNode;
  children: (props: {
    field: ControllerRenderProps<T, N>;
    control: FormControlProps;
  }) => ReactNode;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const errorId = `${field.name}-error`;
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {children({
              field,
              control: {
                id: field.name,
                "aria-invalid": fieldState.invalid,
                "aria-describedby": fieldState.invalid ? errorId : undefined,
              },
            })}
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && (
              <FieldError id={errorId} errors={[fieldState.error]} />
            )}
          </Field>
        );
      }}
    />
  );
}
