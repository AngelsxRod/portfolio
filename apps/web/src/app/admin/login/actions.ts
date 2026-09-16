'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, expectedAdminSessionValue } from '@/proxy';

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState | undefined, formData: FormData) {
  const password = formData.get('password');

  if (
    typeof password !== 'string' ||
    password.length === 0 ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return { error: 'Contraseña incorrecta' };
  }

  (await cookies()).set(ADMIN_SESSION_COOKIE, expectedAdminSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/admin');
}

export async function logout() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
  redirect('/admin/login');
}
