import { NextRequest } from "next/server";
import { changeExperiencePublication } from "@/lib/experience-mutation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return changeExperiencePublication(request, id);
}
