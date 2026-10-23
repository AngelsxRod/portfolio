import "server-only";
import { cookies } from "next/headers";

const SESSION_COOKIE = "portfolio_admin_session";

export function apiUrl() {
  return (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
}

export function webOrigin() {
  return process.env.WEB_ORIGIN || "http://localhost:3000";
}

export async function hasAdminSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const response = await fetch(`${apiUrl()}/admin/session`, {
    headers: { Cookie: `${SESSION_COOKIE}=${token}` },
    cache: "no-store",
  });
  if (response.status === 401) return false;
  if (!response.ok) throw new Error("Admin session check failed");
  return true;
}

export { SESSION_COOKIE };
