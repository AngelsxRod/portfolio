export type AdminSkill = {
  id: string;
  name: string;
  category: string;
  position: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type PublicSkill = Pick<
  AdminSkill,
  "id" | "name" | "category" | "position"
>;
