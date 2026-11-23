"use client";

import { useLocale, useTranslations } from "next-intl";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/** Cambia el idioma de la interfaz conservando la página actual. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const pathname = usePathname();
  return (
    <ToggleGroup
      aria-label={t("label")}
      value={[locale]}
      onValueChange={(value) => {
        const next = value[0] as Locale | undefined;
        if (next && next !== locale) router.replace(pathname, { locale: next });
      }}
      className={`os-lang${className ? ` ${className}` : ""}`}
    >
      {routing.locales.map((item) => (
        <ToggleGroupItem
          key={item}
          value={item}
          lang={item}
          aria-label={t(item)}
          className="os-lang-item"
        >
          {item.toUpperCase()}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
