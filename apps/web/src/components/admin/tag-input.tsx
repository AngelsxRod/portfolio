"use client";

import { useState, type KeyboardEvent } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";

/**
 * Lista de etiquetas editable: se añaden con Enter o coma y se quitan con su
 * botón. Las sugerencias son atajos para añadir con un clic.
 */
export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  maxItems = 30,
  maxLength = 80,
  placeholder = "Escribe y presiona Enter",
  disabled,
  ...aria
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  maxItems?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [draft, setDraft] = useState("");
  const has = (tag: string) =>
    value.some((item) => item.toLowerCase() === tag.toLowerCase());

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((item) => item.trim().slice(0, maxLength))
      .filter(Boolean);
    const next = [...value];
    for (const tag of parts)
      if (
        next.length < maxItems &&
        !next.some((item) => item.toLowerCase() === tag.toLowerCase())
      )
        next.push(tag);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && value.length)
      onChange(value.slice(0, -1));
  }

  const available = suggestions.filter((tag) => !has(tag)).slice(0, 12);

  return (
    <div data-wide className="space-y-3">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled || value.length >= maxItems}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          {...aria}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !draft.trim()}
          onClick={() => add(draft)}
        >
          <PlusIcon aria-hidden="true" />
          Añadir
        </Button>
      </div>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Tecnologías añadidas">
          {value.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="h-7 gap-1 pr-1 text-sm">
                {tag}
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Quitar ${tag}`}
                  className="rounded-sm p-0.5 hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() => onChange(value.filter((item) => item !== tag))}
                >
                  <XIcon className="size-3.5" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay tecnologías.
        </p>
      )}
      {available.length > 0 && !disabled && (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">
            Usadas en otros proyectos
          </p>
          <ul className="flex flex-wrap gap-2">
            {available.map((tag) => (
              <li key={tag}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={value.length >= maxItems}
                  onClick={() => add(tag)}
                >
                  <PlusIcon aria-hidden="true" />
                  {tag}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
