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

const formatter = new Intl.DateTimeFormat("es-GT", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Formatea AAAA-MM como «marzo de 2020». */
export function formatMonth(value: string) {
  return formatter.format(new Date(`${value}-01T00:00:00Z`));
}
