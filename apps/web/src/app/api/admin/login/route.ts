import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";
import { apiUrl, SESSION_COOKIE, webOrigin } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== webOrigin()) {
    return new Response(null, { status: 403 });
  }

  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length === 0 ||
    username.length > 128 ||
    password.length === 0 ||
    password.length > 1024
  ) {
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid", request.url),
      303,
    );
  }

  let response: Response;
  const proxySecret = process.env.ADMIN_PROXY_SECRET;
  if (!proxySecret || proxySecret.length < 32) {
    return NextResponse.redirect(
      new URL("/admin/login?error=unavailable", request.url),
      303,
    );
  }
  const reportedIp =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    "";
  const clientIp = reportedIp.split(",")[0].trim();
  try {
    response = await fetch(`${apiUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: webOrigin(),
        "X-Admin-Proxy-Secret": proxySecret,
        "X-Admin-Client-IP": isIP(clientIp) ? clientIp : "unknown",
      },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login?error=unavailable", request.url),
      303,
    );
  }

  if (!response.ok) {
    const error =
      response.status === 429
        ? "limited"
        : response.status === 401
          ? "invalid"
          : "unavailable";
    return NextResponse.redirect(
      new URL(`/admin/login?error=${error}`, request.url),
      303,
    );
  }
  const sessionCookie = response.headers.get("set-cookie");
  if (!sessionCookie?.startsWith(`${SESSION_COOKIE}=`)) {
    return NextResponse.redirect(
      new URL("/admin/login?error=unavailable", request.url),
      303,
    );
  }

  const redirect = NextResponse.redirect(new URL("/admin", request.url), 303);
  redirect.headers.set("Set-Cookie", sessionCookie);
  redirect.headers.set("Cache-Control", "no-store");
  return redirect;
}
