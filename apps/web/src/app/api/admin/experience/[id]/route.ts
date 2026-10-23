import { NextRequest } from "next/server";
import { saveExperience } from "@/lib/experience-mutation";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return saveExperience(request, id);
}
