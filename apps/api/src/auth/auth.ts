import { timingSafeEqual } from "node:crypto";
import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Header,
  HttpCode,
  Injectable,
  Post,
  Req,
  Res,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpAdapterHost, Reflector } from "@nestjs/core";
import {
  AdminSessionService,
  SESSION_COOKIE,
  sessionTokenFromHeader,
} from "./session.js";

type ApiRequest = {
  headers: {
    origin?: string;
    cookie?: string;
    "x-admin-proxy-secret"?: string;
    "x-admin-client-ip"?: string;
  };
  ip: string;
};

const PUBLIC_ROUTE = "publicRoute";
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);

export function requireWebOrigin(origin: string | undefined) {
  const allowed = process.env.WEB_ORIGIN;
  if (!allowed)
    throw new ServiceUnavailableException("WEB_ORIGIN is not configured");
  if (origin !== allowed) throw new ForbiddenException("Invalid origin");
}

function requireAdminProxy(request: ApiRequest) {
  const expected = process.env.ADMIN_PROXY_SECRET;
  if (!expected || expected.length < 32) {
    throw new ServiceUnavailableException("Admin proxy is not configured");
  }
  const received = request.headers["x-admin-proxy-secret"];
  const actual =
    typeof received === "string" ? Buffer.from(received) : Buffer.alloc(0);
  const secret = Buffer.from(expected);
  if (actual.length !== secret.length || !timingSafeEqual(actual, secret)) {
    throw new ForbiddenException("Invalid admin proxy");
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: AdminSessionService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }
    const request = context.switchToHttp().getRequest<ApiRequest>();
    const token = sessionTokenFromHeader(request.headers.cookie);
    if (!(await this.sessions.hasSession(token))) {
      throw new UnauthorizedException();
    }
    return true;
  }
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly sessions: AdminSessionService,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  async login(
    @Body() body: unknown,
    @Req() request: ApiRequest,
    @Res({ passthrough: true }) reply: unknown,
  ) {
    requireWebOrigin(request.headers.origin);
    requireAdminProxy(request);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof (body as Record<string, unknown>).username !== "string" ||
      typeof (body as Record<string, unknown>).password !== "string"
    ) {
      throw new BadRequestException("Invalid login request");
    }
    const { username, password } = body as {
      username: string;
      password: string;
    };
    if (
      username.length === 0 ||
      username.length > 128 ||
      password.length === 0 ||
      password.length > 1024
    ) {
      throw new BadRequestException("Invalid login request");
    }
    const source = request.headers["x-admin-client-ip"] || request.ip;
    const token = await this.sessions.signIn(username, password, source);
    this.adapterHost.httpAdapter.setCookie(reply, SESSION_COOKIE, token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
    });
    return { ok: true };
  }

  @Post("logout")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  async logout(
    @Req() request: ApiRequest,
    @Res({ passthrough: true }) reply: unknown,
  ) {
    requireWebOrigin(request.headers.origin);
    await this.sessions.signOut(sessionTokenFromHeader(request.headers.cookie));
    this.adapterHost.httpAdapter.clearCookie(reply, SESSION_COOKIE, {
      path: "/",
    });
    return { ok: true };
  }
}

@Controller("admin")
export class AdminController {
  @Get("session")
  @Header("Cache-Control", "no-store")
  session() {
    return { authenticated: true };
  }
}
