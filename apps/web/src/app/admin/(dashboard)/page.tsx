import { Button } from '@/components/ui/button';
import { projects } from '@/lib/projects';
import { AdminProjectsTable } from './admin-projects-table';

export default function AdminProjectsPage() {
  return (
    <>
      <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-border px-4 sm:px-10">
        <h1 className="text-[22px] font-bold">Proyectos</h1>
        <Button size="sm">+ Nuevo proyecto</Button>
      </div>
      <div className="flex flex-col gap-6 px-4 py-8 sm:px-10">
        <AdminProjectsTable projects={projects} />
      </div>
    </>
  );
}
