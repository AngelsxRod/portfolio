import { NextRequest, NextResponse } from "next/server";
import { apiUrl, SESSION_COOKIE, webOrigin } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== webOrigin()) {
    return new Response(null, { status: 403 });
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const token =
    cookieValue && /^[A-Za-z0-9_-]{43}$/.test(cookieValue) ? cookieValue : null;
  if (token) {
    try {
      const response = await fetch(`${apiUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE}=${token}`,
          Origin: webOrigin(),
        },
        cache: "no-store",
      });
      if (!response.ok && response.status !== 401) {
        return new Response(
          "No se pudo cerrar la sesión. Inténtalo de nuevo.",
          {
            status: 502,
          },
        );
      }
    } catch {
      return new Response("No se pudo cerrar la sesión. Inténtalo de nuevo.", {
        status: 502,
      });
    }
  }

  const redirect = NextResponse.redirect(
    new URL("/admin/login", request.url),
    303,
  );
  redirect.cookies.delete(SESSION_COOKIE);
  redirect.headers.set("Cache-Control", "no-store");
  return redirect;
}
