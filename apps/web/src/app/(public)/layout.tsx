import type { ReactNode } from "react";
import { OsShell } from "@/components/os/os-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <OsShell>{children}</OsShell>;
}
