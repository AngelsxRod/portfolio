"use client";

import * as React from "react";
import { es } from "react-day-picker/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";

const formatter = new Intl.DateTimeFormat("es-GT", {
  month: "long",
  year: "numeric",
});

function toDate(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year!, month! - 1, 1);
}

/** Selector de mes y año basado en Popover y Calendar. Valor en formato AAAA-MM. */
function MonthPicker({
  id,
  value,
  onValueChange,
  placeholder = "Elige un mes",
  clearLabel,
  disabled,
  startYear = 1960,
  endYear = new Date().getFullYear() + 5,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  id?: string;
  /** Mes y año en formato AAAA-MM; vacío si no hay selección. */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Si se indica, ofrece un botón para dejar el valor vacío. */
  clearLabel?: string;
  disabled?: boolean;
  startYear?: number;
  endYear?: number;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? toDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="w-full justify-start font-normal"
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {selected ? (
          formatter.format(selected)
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={es}
          captionLayout="dropdown"
          startMonth={new Date(startYear, 0)}
          endMonth={new Date(endYear, 11)}
          defaultMonth={selected}
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onValueChange(
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            );
            setOpen(false);
          }}
        />
        {clearLabel && value && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              {clearLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { MonthPicker };
