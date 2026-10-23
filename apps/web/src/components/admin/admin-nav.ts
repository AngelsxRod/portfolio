import {
  AwardIcon,
  BriefcaseBusinessIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  SparklesIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminHome: AdminNavItem = {
  href: "/admin",
  label: "Inicio",
  icon: LayoutDashboardIcon,
};

export const adminNavGroups: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Contenido",
    items: [
      { href: "/admin/projects", label: "Proyectos", icon: FolderKanbanIcon },
      { href: "/admin/skills", label: "Habilidades", icon: SparklesIcon },
      {
        href: "/admin/experience",
        label: "Experiencia",
        icon: BriefcaseBusinessIcon,
      },
      {
        href: "/admin/education",
        label: "Educación",
        icon: GraduationCapIcon,
      },
      { href: "/admin/certificates", label: "Certificados", icon: AwardIcon },
    ],
  },
  {
    label: "Sitio",
    items: [{ href: "/admin/profile", label: "Perfil", icon: UserRoundIcon }],
  },
];

/** Etiquetas de los segmentos de ruta para el rastro de migas. */
export const segmentLabels: Record<string, string> = {
  projects: "Proyectos",
  skills: "Habilidades",
  categories: "Categorías",
  experience: "Experiencia",
  education: "Educación",
  certificates: "Certificados",
  profile: "Perfil",
  new: "Nuevo",
  edit: "Editar",
};

export function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}
