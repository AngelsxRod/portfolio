"use client";

import { useEffect } from "react";
import { toast } from "@repo/ui/components/sonner";

export function LoginErrorToast({ message }: { message: string | null }) {
  useEffect(() => {
    if (message)
      toast.error("No se pudo iniciar sesión", {
        description: message,
        id: "admin-login-error",
      });
  }, [message]);
  return null;
}
