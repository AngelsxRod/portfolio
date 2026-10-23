import { NextRequest } from "next/server";
import { apiUrl, webOrigin } from "@/lib/admin-session";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== webOrigin())
    return Response.json(
      { message: "Origen no permitido." },
      { status: 403, headers },
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { message: "La solicitud no es válida." },
      { status: 400, headers },
    );
  }

  const clientIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  try {
    const response = await fetch(`${apiUrl()}/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: webOrigin(),
        ...(clientIp ? { "x-contact-client-ip": clientIp } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (response.status >= 500 && response.status !== 503)
      throw new Error("API unavailable");
    return Response.json(await response.json(), {
      status: response.status,
      headers,
    });
  } catch {
    return Response.json(
      { message: "No se pudo enviar el mensaje. Inténtalo de nuevo." },
      { status: 502, headers },
    );
  }
}
