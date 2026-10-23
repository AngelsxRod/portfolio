import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { getDrafts, getPublishedProjects } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";

export default async function AdminProjects() {
  const [drafts, published] = await Promise.all([
    getDrafts(),
    getPublishedProjects(),
  ]);
  const projects = [...drafts, ...published].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Proyectos"
        description="Prepara borradores, publícalos y retíralos cuando sea necesario."
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/admin/projects/new" />}
          >
            Nuevo borrador
          </Button>
        }
      />
      <ResourceList
        titleHeader="Proyecto"
        columns={["Posición", "Última edición"]}
        resource="projects"
        noun="Proyecto"
        plural="proyectos"
        empty={{
          title: "Todavía no hay proyectos",
          description:
            "Crea el primer borrador para empezar a documentar un proyecto.",
        }}
        rows={projects.map((project) => ({
          id: project.id,
          title: project.title,
          subtitle: project.slug,
          cells: [String(project.position), formatDateTime(project.updatedAt)],
          status: project.status,
          editHref: `/admin/projects/${project.id}/edit`,
          completeHref: `/admin/projects/${project.id}/edit`,
          menu: [
            {
              label: "Imágenes",
              href: `/admin/projects/${project.id}/edit#images-title`,
            },
            ...(project.status === "published"
              ? [
                  {
                    label: "Ver en el sitio",
                    href: `/projects/${project.slug}`,
                    external: true,
                  },
                ]
              : []),
          ],
        }))}
      />
    </div>
  );
}
