import { NextRequest } from "next/server";
import { changeEducationPublication } from "@/lib/education-mutation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return changeEducationPublication(request, id);
}
