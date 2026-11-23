"use client";

import { useTranslations } from "next-intl";
import { ErrorWindow } from "@/components/os/error-window";

export default function PublicError({ reset }: { reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <ErrorWindow
      file="error.log"
      code={t("loadCode")}
      title={t("loadTitle")}
      retry={reset}
    >
      {t("loadText")}
    </ErrorWindow>
  );
}
