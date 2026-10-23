import { NextRequest } from "next/server";
import { adminProjectsApi } from "@/lib/admin-api";
import { webOrigin } from "@/lib/admin-session";

const headers = { "Cache-Control": "no-store" };
const validId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("origin") !== webOrigin())
    return Response.json(
      { message: "Origen no permitido." },
      { status: 403, headers },
    );
  const { id } = await context.params;
  if (!validId(id))
    return Response.json(
      { message: "Identificador inválido." },
      { status: 400, headers },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json(
      { message: "Se esperaba JSON." },
      { status: 415, headers },
    );
  if (Number(request.headers.get("content-length")) > 7 * 1024 * 1024)
    return Response.json(
      { message: "La imagen supera el límite." },
      { status: 413, headers },
    );
  try {
    const body = await request.text();
    if (body.length > 7 * 1024 * 1024)
      return Response.json(
        { message: "La imagen supera el límite." },
        { status: 413, headers },
      );
    const response = await adminProjectsApi(`/${id}/media`, {
      method: "POST",
      body,
      ...(request.headers.has("Idempotency-Key")
        ? {
            headers: {
              "Idempotency-Key": request.headers.get("Idempotency-Key")!,
            },
          }
        : {}),
    });
    return Response.json(await response.json(), {
      status: response.status,
      headers,
    });
  } catch {
    return Response.json(
      { message: "No se pudo cargar la imagen." },
      { status: 502, headers },
    );
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!validId(id))
    return Response.json(
      { message: "Identificador inválido." },
      { status: 400, headers },
    );
  try {
    const response = await adminProjectsApi(`/${id}/media`);
    return Response.json(await response.json(), {
      status: response.status,
      headers,
    });
  } catch {
    return Response.json(
      { message: "No se pudieron cargar las imágenes." },
      { status: 502, headers },
    );
  }
}
