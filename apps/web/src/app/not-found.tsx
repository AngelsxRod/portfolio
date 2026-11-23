import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ErrorWindow } from "@/components/os/error-window";
import { OsShell } from "@/components/os/os-shell";

export const metadata: Metadata = { title: "angel.os" };

/** 404 global (fuera de un idioma): usa el idioma predeterminado. */
export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <NextIntlClientProvider>
      <OsShell>
        <ErrorWindow
          file="404.log"
          code={t("notFoundCode")}
          title={t("notFoundTitle")}
          mood="confused"
        >
          {t("notFoundText")}
        </ErrorWindow>
      </OsShell>
    </NextIntlClientProvider>
  );
}
