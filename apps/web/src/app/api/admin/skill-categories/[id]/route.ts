import { NextRequest } from "next/server";
import { saveSkillCategory } from "@/lib/skill-mutation";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return saveSkillCategory(request, id);
}
