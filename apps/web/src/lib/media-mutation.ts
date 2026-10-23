import "server-only";
import { NextRequest } from "next/server";
import { adminProjectsApi } from "@/lib/admin-api";
import { webOrigin } from "@/lib/admin-session";

export async function mutateMedia(request: NextRequest, path: string) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== webOrigin())
    return Response.json(
      { message: "Origen no permitido." },
      { status: 403, headers },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json(
      { message: "Se esperaba JSON." },
      { status: 415, headers },
    );
  try {
    const text = await request.text();
    if (text.length > 2048)
      return Response.json(
        { message: "Solicitud demasiado grande." },
        { status: 413, headers },
      );
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json(
        { message: "Solicitud inválida." },
        { status: 400, headers },
      );
    }
    const response = await adminProjectsApi(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return Response.json(await response.json(), {
      status: response.status,
      headers,
    });
  } catch {
    return Response.json(
      { message: "No se pudieron guardar las imágenes. Inténtalo de nuevo." },
      { status: 502, headers },
    );
  }
}
