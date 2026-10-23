import { NextRequest } from "next/server";
import { changeSkillPublication } from "@/lib/skill-mutation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return changeSkillPublication(request, id);
}
