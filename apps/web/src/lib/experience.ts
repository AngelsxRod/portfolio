import { toIntlLocale } from "@/i18n/format";

export type AdminExperience = {
  id: string;
  organization: string;
  title: string;
  /** Mes y año en formato AAAA-MM. */
  startDate: string;
  /** Vacío mientras el cargo sigue vigente. */
  endDate: string | null;
  description: string | null;
  achievements: string[];
  position: number;
  status: "draft" | "published";
  /** Cambios guardados de un registro publicado que aún no se publican. */
  pending: Pick<
    AdminExperience,
    | "organization"
    | "title"
    | "startDate"
    | "endDate"
    | "description"
    | "achievements"
    | "position"
  > | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicExperience = Pick<
  AdminExperience,
  | "id"
  | "organization"
  | "title"
  | "startDate"
  | "endDate"
  | "description"
  | "achievements"
  | "position"
>;

/** Formatea AAAA-MM como «marzo de 2020» (o «March 2020» en inglés). */
export function formatMonth(value: string, locale = "es") {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));
}
