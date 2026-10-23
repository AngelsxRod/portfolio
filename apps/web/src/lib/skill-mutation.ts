import "server-only";
import { NextRequest } from "next/server";
import { adminSkillCategoriesApi, adminSkillsApi } from "@/lib/admin-api";
import { webOrigin } from "@/lib/admin-session";

const headers = { "Cache-Control": "no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rejectOrigin(request: NextRequest) {
  return request.headers.get("origin") === webOrigin()
    ? null
    : Response.json(
        { message: "Origen no permitido." },
        { status: 403, headers },
      );
}

async function forward(
  api: typeof adminSkillsApi,
  path: string,
  init: RequestInit,
  failure: string,
) {
  try {
    const response = await api(path, init);
    if (response.status >= 500) throw new Error("API unavailable");
    return Response.json(await response.json(), {
      status: response.status,
      headers,
    });
  } catch {
    return Response.json({ message: failure }, { status: 502, headers });
  }
}

async function save(
  api: typeof adminSkillsApi,
  failure: string,
  request: NextRequest,
  id?: string,
) {
  const denied = rejectOrigin(request);
  if (denied) return denied;
  if (id && !uuid.test(id)) {
    return Response.json(
      { message: "Identificador inválido." },
      { status: 400, headers },
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
  return forward(
    api,
    id ? `/${id}` : "",
    { method: id ? "PUT" : "POST", body: JSON.stringify(body) },
    failure,
  );
}

export function saveSkill(request: NextRequest, id?: string) {
  return save(
    adminSkillsApi,
    "No se pudo guardar la habilidad. Inténtalo de nuevo.",
    request,
    id,
  );
}

export function saveSkillCategory(request: NextRequest, id?: string) {
  return save(
    adminSkillCategoriesApi,
    "No se pudo guardar la categoría. Inténtalo de nuevo.",
    request,
    id,
  );
}

export async function changeSkillPublication(request: NextRequest, id: string) {
  const denied = rejectOrigin(request);
  if (denied) return denied;
  if (!uuid.test(id)) {
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
    adminSkillsApi,
    `/${id}/${action}`,
    { method: "POST" },
    "No se pudo cambiar la publicación. Inténtalo de nuevo.",
  );
}
