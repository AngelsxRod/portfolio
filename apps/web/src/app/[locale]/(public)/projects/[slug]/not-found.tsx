import { getTranslations } from "next-intl/server";
import { ErrorWindow } from "@/components/os/error-window";

export default async function ProjectNotFound() {
  const t = await getTranslations("project");
  return (
    <ErrorWindow
      file="404.log"
      code={t("notFoundCode")}
      title={t("notFoundTitle")}
      back={{ href: "/projects", label: t("allProjects") }}
    >
      {t("notFoundText")}
    </ErrorWindow>
  );
}
