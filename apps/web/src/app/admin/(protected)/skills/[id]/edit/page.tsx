import { getAdminSkill, getSkillCategories } from "@/lib/admin-api";
import { SkillForm } from "../../skill-form";

export default async function EditSkill({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const [skill, categories] = await Promise.all([
    getAdminSkill(id),
    getSkillCategories(),
  ]);
  const { saved } = await searchParams;
  return (
    <SkillForm
      key={skill.id}
      skill={skill}
      categories={categories}
      justCreated={saved === "1"}
    />
  );
}
