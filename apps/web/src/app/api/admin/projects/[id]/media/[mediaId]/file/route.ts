import { NextRequest } from "next/server";
import { adminProjectsApi } from "@/lib/admin-api";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; mediaId: string }> },
) {
  const { id, mediaId } = await context.params;
  const valid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!valid.test(id) || !valid.test(mediaId))
    return new Response(null, { status: 400 });
  try {
    const response = await adminProjectsApi(`/${id}/media/${mediaId}/file`);
    if (!response.ok)
      return new Response(null, {
        status: response.status,
        headers: { "Cache-Control": "no-store" },
      });
    return new Response(response.body, {
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
