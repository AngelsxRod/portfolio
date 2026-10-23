import "server-only";
import { NextRequest } from "next/server";
import { adminApi } from "@/lib/admin-api";
import { webOrigin } from "@/lib/admin-session";

const headers = { "Cache-Control": "no-store" };

export async function mutateDraft(request: NextRequest, id?: string) {
  if (request.headers.get("origin") !== webOrigin()) {
    return Response.json(
      { message: "Origen no permitido." },
      { status: 403, headers },
    );
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json(
      { message: "Se esperaba JSON." },
      { status: 415, headers },
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
  try {
    const response = await adminApi(id ? `/${encodeURIComponent(id)}` : "", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body),
      ...(request.headers.has("Idempotency-Key")
        ? {
            headers: {
              "Idempotency-Key": request.headers.get("Idempotency-Key")!,
            },
          }
        : {}),
    });
    if (response.status >= 500) throw new Error("API unavailable");
    return Response.json(await response.json(), {
      status: response.status,
      headers,
    });
  } catch {
    return Response.json(
      { message: "No se pudo guardar el borrador. Inténtalo de nuevo." },
      { status: 502, headers },
    );
  }
}
