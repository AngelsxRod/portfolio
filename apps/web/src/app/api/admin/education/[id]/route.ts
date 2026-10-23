import { NextRequest } from "next/server";
import { saveEducation } from "@/lib/education-mutation";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return saveEducation(request, id);
}
