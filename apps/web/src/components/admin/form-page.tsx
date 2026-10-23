import type { ReactNode } from "react";
import { Badge } from "@repo/ui/components/badge";
import { StatusBadge } from "./status-badge";

/** Cabecera y ancho comunes de los formularios del panel. */
export function FormPage({
  title,
  description,
  status,
  feminine,
  pending,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  status?: "draft" | "published";
  feminine?: boolean;
  /** Hay cambios guardados que aún no se publican. */
  pending?: boolean;
  /** Acciones de la página, fijas arriba a la derecha. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="sticky top-14 z-10 -mx-4 flex flex-wrap items-start justify-between gap-4 border-b bg-background px-4 py-4 sm:-mx-6 sm:px-6">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight break-words">
              {title}
            </h1>
            {status && <StatusBadge status={status} feminine={feminine} />}
            {pending && <Badge variant="outline">Cambios sin publicar</Badge>}
          </div>
          {description && (
            <p className="max-w-2xl text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Sección con título y descripción a un lado y los campos al otro. */
export function FormSection({
  title,
  titleId,
  description,
  children,
}: {
  title: string;
  titleId?: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t pt-6 md:grid-cols-[14rem_1fr] md:gap-8">
      <div className="space-y-1">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="min-w-0 lg:[&_[data-slot=field-group]]:grid-cols-2 [&_[data-slot=field-group]]:grid! [&_[data-slot=field-group]]:gap-x-6 [&_[data-slot=field]:has(textarea)]:col-span-full [&_[data-slot=field]:has([data-wide])]:col-span-full">
        {children}
      </div>
    </section>
  );
}

/** Barra de acciones fija en el borde inferior para no perder el botón de guardar. */
export function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center justify-end gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
      {children}
    </div>
  );
}
