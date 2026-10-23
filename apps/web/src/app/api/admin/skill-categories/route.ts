import { NextRequest } from "next/server";
import { saveSkillCategory } from "@/lib/skill-mutation";

export function POST(request: NextRequest) {
  return saveSkillCategory(request);
}
