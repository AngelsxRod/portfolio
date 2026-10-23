import "server-only";
import { NextRequest } from "next/server";
import { adminProfileApi } from "@/lib/admin-api";
import { webOrigin } from "@/lib/admin-session";

const headers = { "Cache-Control": "no-store" };

function rejectOrigin(request: NextRequest) {
  return request.headers.get("origin") === webOrigin()
    ? null
    : Response.json(
        { message: "Origen no permitido." },
        { status: 403, headers },
      );
}

async function readJson(request: NextRequest) {
  try {
    return { body: (await request.json()) as unknown };
  } catch {
    return {
      error: Response.json(
        { message: "La solicitud no es válida." },
        { status: 400, headers },
      ),
    };
  }
}

async function forward(path: string, init: RequestInit, failure: string) {
  try {
    const response = await adminProfileApi(path, init);
    if (response.status >= 500) throw new Error("API unavailable");
    return Response.json(await response.json(), {
      status: response.status,
      headers,
    });
  } catch {
    return Response.json({ message: failure }, { status: 502, headers });
  }
}

export async function saveProfile(request: NextRequest) {
  const denied = rejectOrigin(request);
  if (denied) return denied;
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json(
      { message: "Se esperaba JSON." },
      { status: 415, headers },
    );
  }
  const { body, error } = await readJson(request);
  if (error) return error;
  return forward(
    "",
    { method: "PUT", body: JSON.stringify(body) },
    "No se pudo guardar el perfil. Inténtalo de nuevo.",
  );
}

export async function changeProfilePublication(request: NextRequest) {
  const denied = rejectOrigin(request);
  if (denied) return denied;
  const { body, error } = await readJson(request);
  if (error) return error;
  const record =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  const action = record?.action;
  if (
    !record ||
    Object.keys(record).length !== 1 ||
    (action !== "publish" && action !== "unpublish")
  ) {
    return Response.json(
      { message: "Acción no válida." },
      { status: 400, headers },
    );
  }
  return forward(
    `/${action}`,
    { method: "POST" },
    "No se pudo cambiar la publicación. Inténtalo de nuevo.",
  );
}
