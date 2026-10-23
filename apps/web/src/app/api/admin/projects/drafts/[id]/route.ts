import { NextRequest } from "next/server";
import { mutateDraft } from "@/lib/draft-mutation";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return mutateDraft(request, id);
}
