import { getAdminSkill, getAdminSkills } from "@/lib/admin-api";
import { SkillForm } from "../../skill-form";

export default async function EditSkill({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const [skill, skills] = await Promise.all([
    getAdminSkill(id),
    getAdminSkills(),
  ]);
  const { saved } = await searchParams;
  return (
    <SkillForm
      key={skill.id}
      skill={skill}
      categories={[...new Set(skills.map((item) => item.category))]}
      justCreated={saved === "1"}
    />
  );
}
