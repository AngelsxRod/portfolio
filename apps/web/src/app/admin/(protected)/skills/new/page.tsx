import { getSkillCategories } from "@/lib/admin-api";
import { SkillForm } from "../skill-form";

export default async function NewSkill() {
  return <SkillForm categories={await getSkillCategories()} />;
}
