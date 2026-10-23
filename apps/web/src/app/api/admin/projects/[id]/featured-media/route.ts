import { NextRequest } from "next/server";
import { mutateMedia } from "@/lib/media-mutation";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return mutateMedia(request, `/${encodeURIComponent(id)}/featured-media`);
}
