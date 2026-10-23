import { createHash, randomBytes } from "node:crypto";
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { and, eq, gt, sql } from "drizzle-orm";
import { DatabaseService } from "../database.js";
import { adminLoginAttempts, adminSessions } from "../db/schema.js";
import { verifyPassword } from "./password.js";

export const SESSION_COOKIE = "portfolio_admin_session";
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function sessionTokenFromHeader(header?: string) {
  const cookie = header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;
  const token = cookie.slice(SESSION_COOKIE.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

@Injectable()
export class AdminSessionService {
  constructor(private readonly database: DatabaseService) {}

  async signIn(username: string, password: string, source: string) {
    // Administrative credentials stay in the API process environment.
    const expectedUsername = process.env.ADMIN_USERNAME;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!expectedUsername || !passwordHash) {
      throw new ServiceUnavailableException("Admin access is not configured");
    }

    const db = this.database.getDatabase();
    const sourceHash = digest(source);
    const now = new Date();
    const attempts = await db
      .select()
      .from(adminLoginAttempts)
      .where(eq(adminLoginAttempts.sourceHash, sourceHash))
      .limit(1);
    const current = attempts[0];
    if (
      current &&
      current.windowStartedAt.getTime() > now.getTime() - ATTEMPT_WINDOW_MS &&
      current.failedCount >= MAX_ATTEMPTS
    ) {
      throw new HttpException("Try again later", 429);
    }

    const validPassword = await verifyPassword(password, passwordHash);
    if (username !== expectedUsername || !validPassword) {
      const windowStartedAt =
        current &&
        current.windowStartedAt.getTime() > now.getTime() - ATTEMPT_WINDOW_MS
          ? current.windowStartedAt
          : now;
      await db
        .insert(adminLoginAttempts)
        .values({ sourceHash, failedCount: 1, windowStartedAt })
        .onConflictDoUpdate({
          target: adminLoginAttempts.sourceHash,
          set: {
            failedCount: sql`case when ${adminLoginAttempts.windowStartedAt} > ${new Date(now.getTime() - ATTEMPT_WINDOW_MS)} then ${adminLoginAttempts.failedCount} + 1 else 1 end`,
            windowStartedAt: sql`case when ${adminLoginAttempts.windowStartedAt} > ${new Date(now.getTime() - ATTEMPT_WINDOW_MS)} then ${adminLoginAttempts.windowStartedAt} else ${now} end`,
          },
        });
      throw new UnauthorizedException("Invalid credentials");
    }

    await db
      .delete(adminLoginAttempts)
      .where(eq(adminLoginAttempts.sourceHash, sourceHash));
    const token = randomBytes(32).toString("base64url");
    await db.insert(adminSessions).values({
      tokenHash: digest(token),
      expiresAt: new Date(now.getTime() + SESSION_LIFETIME_MS),
    });
    return token;
  }

  async hasSession(token: string | null) {
    if (!token) return false;
    const rows = await this.database
      .getDatabase()
      .select({ tokenHash: adminSessions.tokenHash })
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.tokenHash, digest(token)),
          gt(adminSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return rows.length === 1;
  }

  async signOut(token: string | null) {
    if (!token) return;
    await this.database
      .getDatabase()
      .delete(adminSessions)
      .where(eq(adminSessions.tokenHash, digest(token)));
  }
}
