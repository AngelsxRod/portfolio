"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  hour: "2-digit",
  minute: "2-digit",
});

function now() {
  return formatter.format(new Date());
}

/** Hora actual de Guatemala; se actualiza cada 15 segundos. */
export function Clock({ className }: { className?: string }) {
  const [time, setTime] = useState(now);
  useEffect(() => {
    const timer = setInterval(() => setTime(now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time className={className} suppressHydrationWarning>
      {time}
    </time>
  );
}
