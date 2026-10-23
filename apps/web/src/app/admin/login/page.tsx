import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { hasAdminSession } from "@/lib/admin-session";
import { LoginErrorToast } from "./login-error-toast";

const errors: Record<string, string> = {
  invalid: "Revisa el usuario y la contraseña.",
  limited: "Demasiados intentos. Espera 15 minutos antes de volver a probar.",
  unavailable: "El acceso no está disponible en este momento.",
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasAdminSession()) redirect("/admin");
  const { error } = await searchParams;
  const errorMessage =
    error && Object.hasOwn(errors, error) ? errors[error] : null;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/"
        >
          ← Volver al portafolio
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Acceso administrativo
        </h1>
        <p className="text-muted-foreground">
          Inicia sesión para entrar al panel.
        </p>
      </div>
      <LoginErrorToast message={errorMessage} />
      <Card>
        <CardHeader>
          <CardTitle>Administrador</CardTitle>
          <CardDescription>
            Usa las credenciales configuradas para este sitio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/admin/login" method="post" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                required
                maxLength={128}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={1024}
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
