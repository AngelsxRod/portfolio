import { getTranslations } from "next-intl/server";
import { ErrorWindow } from "@/components/os/error-window";

export async function generateMetadata() {
  const t = await getTranslations("errors");
  return { title: `${t("notFoundTitle")} | angel.os` };
}

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <ErrorWindow
      file="404.log"
      code={t("notFoundCode")}
      title={t("notFoundTitle")}
      mood="confused"
    >
      {t("notFoundText")}
    </ErrorWindow>
  );
}
