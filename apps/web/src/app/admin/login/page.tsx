import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { hasAdminSession } from "@/lib/admin-session";
import { LoginErrorToast } from "./login-error-toast";
import { LoginForm } from "./login-form";

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
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
