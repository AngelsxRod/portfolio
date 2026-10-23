"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MoreHorizontalIcon, SearchIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import {
  PublicationButton,
  type PublicationResource,
} from "./publication-button";
import { Badge } from "@repo/ui/components/badge";
import { StatusBadge } from "./status-badge";

export type ResourceRow = {
  id: string;
  title: string;
  subtitle?: string;
  /** Un valor por columna adicional, en el mismo orden que `columns`. */
  cells: string[];
  /** Ausente en listas sin publicación, como las categorías. */
  status?: "draft" | "published";
  editHref: string;
  /** Enlaces secundarios agrupados en el menú de acciones. */
  menu?: { label: string; href: string; external?: boolean }[];
  /** Destino para completar un borrador si publicarlo falla. */
  completeHref?: string;
  /** Hay cambios guardados que aún no se publican. */
  pending?: boolean;
  /** Valor para el filtro adicional (p. ej. la categoría de una habilidad). */
  group?: string;
};

type Props = {
  titleHeader: string;
  columns: string[];
  rows: ResourceRow[];
  resource?: PublicationResource;
  noun: string;
  /** Nombre en plural, en minúscula, para la etiqueta de búsqueda. */
  plural: string;
  feminine?: boolean;
  /** Nombre del filtro adicional, p. ej. «Categoría»; usa `group` de cada fila. */
  groupLabel?: string;
  empty: { title: string; description: string };
};

const statusLabels = {
  all: "Todos los estados",
  published: "Publicados",
  draft: "Borradores",
} as const;

function RowActions({
  row,
  resource,
  noun,
  feminine,
  stacked,
}: Pick<Props, "resource" | "noun" | "feminine"> & {
  row: ResourceRow;
  stacked?: boolean;
}) {
  const name = row.subtitle ? `${row.title} · ${row.subtitle}` : row.title;
  return (
    <div
      className={
        stacked
          ? "flex flex-wrap items-center gap-2"
          : "flex items-center justify-end gap-2"
      }
    >
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href={row.editHref} aria-label={`$Editar ${name}`} />}
      >
        Editar
      </Button>
      {resource && row.status && (
        <PublicationButton
          resource={resource}
          id={row.id}
          name={row.title}
          context={row.subtitle}
          status={row.status}
          noun={noun}
          feminine={feminine}
          completeHref={row.completeHref}
        />
      )}
      {row.menu && row.menu.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Más acciones para ${name}`}
              />
            }
          >
            <MoreHorizontalIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.menu.map((item) => (
              <DropdownMenuItem
                key={item.href}
                render={
                  <Link
                    href={item.href}
                    {...(item.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  />
                }
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * Lista del panel con búsqueda y filtros en el cliente. En pantallas anchas es
 * una tabla; en móvil cada fila pasa a una tarjeta sin desplazamiento lateral.
 */
export function ResourceList({
  titleHeader,
  columns,
  rows,
  resource,
  noun,
  plural,
  feminine,
  groupLabel,
  empty,
}: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<keyof typeof statusLabels>("all");
  const [group, setGroup] = useState("all");
  const hasStatus = rows.some((row) => row.status);
  const groups = useMemo(
    () =>
      groupLabel
        ? [...new Set(rows.map((row) => row.group).filter(Boolean))].sort(
            (a, b) => String(a).localeCompare(String(b), "es"),
          )
        : [],
    [rows, groupLabel],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (group !== "all" && row.group !== group) return false;
      if (!needle) return true;
      return [row.title, row.subtitle, ...row.cells]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(needle);
    });
  }, [rows, query, status, group]);

  if (rows.length === 0)
    return (
      <Empty className="rounded-lg border bg-card">
        <EmptyHeader>
          <EmptyTitle>{empty.title}</EmptyTitle>
          <EmptyDescription>{empty.description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );

  const filtered = query !== "" || status !== "all" || group !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar…"
            aria-label={`Buscar en ${plural}`}
            className="pl-8"
          />
        </div>
        {hasStatus && (
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus((value ?? "all") as keyof typeof statusLabels)
            }
          >
            <SelectTrigger aria-label="Filtrar por estado" className="w-48">
              <SelectValue>
                {(value: string) =>
                  statusLabels[value as keyof typeof statusLabels]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {groupLabel && groups.length > 1 && (
          <Select
            value={group}
            onValueChange={(value) => setGroup(value ?? "all")}
          >
            <SelectTrigger
              aria-label={`Filtrar por ${groupLabel.toLowerCase()}`}
              className="w-52"
            >
              <SelectValue>
                {(value: string) =>
                  value === "all" ? `Toda ${groupLabel.toLowerCase()}` : value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {`Toda ${groupLabel.toLowerCase()}`}
              </SelectItem>
              {groups.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p
          className="ml-auto text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {visible.length} de {rows.length}
        </p>
      </div>

      {visible.length === 0 ? (
        <Empty className="rounded-lg border bg-card">
          <EmptyHeader>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              Ningún registro coincide con la búsqueda o los filtros.
            </EmptyDescription>
          </EmptyHeader>
          {filtered && (
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setGroup("all");
              }}
            >
              Quitar filtros
            </Button>
          )}
        </Empty>
      ) : (
        <>
          <div className="hidden rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{titleHeader}</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                  {hasStatus && <TableHead>Estado</TableHead>}
                  <TableHead className="text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-72 whitespace-normal">
                      <p className="font-semibold break-words">{row.title}</p>
                      {row.subtitle && (
                        <p className="text-sm text-muted-foreground break-words">
                          {row.subtitle}
                        </p>
                      )}
                    </TableCell>
                    {row.cells.map((cell, index) => (
                      <TableCell
                        key={columns[index]}
                        className="whitespace-normal"
                      >
                        {cell}
                      </TableCell>
                    ))}
                    {hasStatus && (
                      <TableCell>
                        {row.status && (
                          <span className="flex flex-wrap items-center gap-1">
                            <StatusBadge
                              status={row.status}
                              feminine={feminine}
                            />
                            {row.pending && (
                              <Badge variant="outline">
                                Cambios sin publicar
                              </Badge>
                            )}
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <RowActions
                        row={row}
                        resource={resource}
                        noun={noun}
                        feminine={feminine}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((row) => (
              <li
                key={row.id}
                className="space-y-3 rounded-lg border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{row.title}</p>
                    {row.subtitle && (
                      <p className="text-sm text-muted-foreground break-words">
                        {row.subtitle}
                      </p>
                    )}
                  </div>
                  {row.status && (
                    <span className="flex flex-wrap items-center gap-1">
                      <StatusBadge status={row.status} feminine={feminine} />
                      {row.pending && (
                        <Badge variant="outline">Cambios sin publicar</Badge>
                      )}
                    </span>
                  )}
                </div>
                {columns.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {row.cells.map((cell, index) => (
                      <div key={columns[index]} className="min-w-0">
                        <dt className="text-muted-foreground">
                          {columns[index]}
                        </dt>
                        <dd className="break-words">{cell}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <RowActions
                  row={row}
                  resource={resource}
                  noun={noun}
                  feminine={feminine}
                  stacked
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
