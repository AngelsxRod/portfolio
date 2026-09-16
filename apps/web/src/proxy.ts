import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'portfolio_admin_session';

export function expectedAdminSessionValue() {
  return createHash('sha256')
    .update(process.env.ADMIN_PASSWORD ?? '')
    .digest('hex');
}

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (cookie !== expectedAdminSessionValue()) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/((?!login).*)'],
};
