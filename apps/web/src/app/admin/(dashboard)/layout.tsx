import type { ReactNode } from 'react';
import { AdminSidebar } from './_components/admin-sidebar';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
