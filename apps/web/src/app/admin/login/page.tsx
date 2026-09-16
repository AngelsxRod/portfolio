'use client';

import { useActionState } from 'react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { login } from './actions';

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-6 rounded-[10px] border border-border bg-muted p-8"
      >
        <Logo suffix="admin" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">Acceso admin</h1>
          <p className="text-sm text-muted-foreground">Ingresa la contraseña para continuar.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase"
            htmlFor="password"
          >
            Contraseña
          </label>
          <input
            autoFocus
            className="rounded-lg border border-border-secondary bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
            id="password"
            name="password"
            required
            type="password"
          />
        </div>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button disabled={pending} type="submit">
          {pending ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </main>
  );
}
