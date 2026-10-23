"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { toast } from "@repo/ui/components/sonner";

export default function AdminError({ reset }: { reset: () => void }) {
  useEffect(() => {
    toast.error("No se pudo cargar el panel.", {
      description: "Comprueba la conexión e inténtalo de nuevo.",
      id: "admin-load-error",
    });
  }, []);

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl items-center px-6 py-12">
      <Card className="w-full">
        <CardContent className="space-y-4 py-8">
          <h1 className="text-2xl font-semibold">Panel no disponible</h1>
          <p className="text-muted-foreground">No se pudo cargar el panel.</p>
          <Button onClick={reset}>Intentar de nuevo</Button>
        </CardContent>
      </Card>
    </main>
  );
}
