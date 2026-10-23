import { getAdminSkills } from "@/lib/admin-api";
import { SkillForm } from "../skill-form";

export default async function NewSkill() {
  const skills = await getAdminSkills();
  return <SkillForm categories={[...new Set(skills.map((s) => s.category))]} />;
}
