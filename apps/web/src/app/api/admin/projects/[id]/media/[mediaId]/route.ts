import { mutateMedia } from "@/lib/media-mutation";
import { NextRequest } from "next/server";
import { adminProjectsApi } from "@/lib/admin-api";
import { webOrigin } from "@/lib/admin-session";

const validId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; mediaId: string }> },
) {
  if (request.headers.get("origin") !== webOrigin())
    return Response.json({ message: "Origen no permitido." }, { status: 403 });
  const { id, mediaId } = await context.params;
  if (!validId(id) || !validId(mediaId))
    return Response.json(
      { message: "Identificador inválido." },
      { status: 400 },
    );
  try {
    const response = await adminProjectsApi(`/${id}/media/${mediaId}`, {
      method: "DELETE",
    });
    return Response.json(await response.json(), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { message: "No se pudo eliminar la imagen." },
      { status: 502 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; mediaId: string }> },
) {
  const { id, mediaId } = await context.params;
  return mutateMedia(
    request,
    `/${encodeURIComponent(id)}/media/${encodeURIComponent(mediaId)}`,
  );
}
