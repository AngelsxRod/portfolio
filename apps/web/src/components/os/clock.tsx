"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { toIntlLocale } from "@/i18n/format";

function format(locale: string) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

/** Hora actual de Guatemala; se actualiza cada 15 segundos. */
export function Clock({ className }: { className?: string }) {
  const locale = useLocale();
  const [time, setTime] = useState(() => format(locale));
  useEffect(() => {
    setTime(format(locale));
    const timer = setInterval(() => setTime(format(locale)), 15_000);
    return () => clearInterval(timer);
  }, [locale]);
  return (
    <time className={className} suppressHydrationWarning>
      {time}
    </time>
  );
}
