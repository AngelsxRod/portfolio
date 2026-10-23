export type AdminSkill = {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  position: number;
  status: "draft" | "published";
  /** Cambios guardados de un registro publicado que aún no se publican. */
  pending: Pick<AdminSkill, "name" | "categoryId" | "position"> | null;
  createdAt: string;
  updatedAt: string;
};

export type SkillCategory = {
  id: string;
  name: string;
  position: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicSkill = Pick<
  AdminSkill,
  "id" | "name" | "categoryId" | "category" | "position"
>;
