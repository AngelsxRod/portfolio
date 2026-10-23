import { NextRequest } from "next/server";
import { adminProjectsApi } from "@/lib/admin-api";
import { webOrigin } from "@/lib/admin-session";

const headers = { "Cache-Control": "no-store" };

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("origin") !== webOrigin()) {
    return Response.json(
      { message: "Origen no permitido." },
      { status: 403, headers },
    );
  }
  const { id } = await context.params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return Response.json(
      { message: "Identificador inválido." },
      { status: 400, headers },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { message: "La solicitud no es válida." },
      { status: 400, headers },
    );
  }
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    !["publish", "unpublish", "discard"].includes(
      (body as { action?: string }).action ?? "",
    )
  ) {
    return Response.json(
      { message: "Acción no válida." },
      { status: 400, headers },
    );
  }
  try {
    const response = await adminProjectsApi(
      `/${id}/${(body as { action: string }).action}`,
      { method: "POST" },
    );
    if (response.status >= 500) throw new Error("API unavailable");
    return Response.json(await response.json(), {
      status: response.status,
      headers,
    });
  } catch {
    return Response.json(
      { message: "No se pudo cambiar la publicación. Inténtalo de nuevo." },
      { status: 502, headers },
    );
  }
}
