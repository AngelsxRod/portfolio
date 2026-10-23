export const educationLevels = {
  secondary: "Diversificado / Bachillerato",
  university: "Universidad",
  other: "Otro",
} as const;

export type EducationLevel = keyof typeof educationLevels;

export type AdminEducation = {
  id: string;
  institution: string;
  level: EducationLevel;
  program: string;
  /** Mes y año en formato AAAA-MM. */
  startDate: string;
  /** Vacío mientras los estudios siguen en curso. */
  endDate: string | null;
  description: string | null;
  position: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type PublicEducation = Pick<
  AdminEducation,
  | "id"
  | "institution"
  | "level"
  | "program"
  | "startDate"
  | "endDate"
  | "description"
  | "position"
>;
