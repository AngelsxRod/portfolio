import { apiUrl } from "@/lib/admin-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await context.params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      mediaId,
    )
  )
    return new Response(null, { status: 400 });
  try {
    const response = await fetch(`${apiUrl()}/projects/media/${mediaId}`, {
      cache: "no-store",
    });
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
