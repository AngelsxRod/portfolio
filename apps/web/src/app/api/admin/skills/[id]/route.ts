import { NextRequest } from "next/server";
import { saveSkill } from "@/lib/skill-mutation";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return saveSkill(request, id);
}
