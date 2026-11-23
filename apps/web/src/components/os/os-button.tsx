import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@repo/ui/components/button";

/**
 * Enlace con forma de botón angel.os. Usa los estilos del `Button` de shadcn
 * (`buttonVariants`) pero conserva la semántica de enlace.
 */
export function OsLinkButton({
  href,
  variant = "primary",
  external = false,
  label,
  children,
}: {
  href: string;
  variant?: "primary" | "outline";
  /** Abre en otra pestaña con `noopener noreferrer`. */
  external?: boolean;
  /** Nombre accesible cuando el texto visible no basta. */
  label?: string;
  children: ReactNode;
}) {
  const common = useTranslations("common");
  const className = buttonVariants({
    variant: variant === "primary" ? "default" : "outline",
    className: `os-btn os-btn-${variant}`,
  });
  if (external)
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label ? `${label} ${common("newTab")}` : undefined}
        className={className}
      >
        {children}
        {!label && <span className="sr-only"> {common("newTab")}</span>}
      </a>
    );
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
