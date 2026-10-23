import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { getAdminExperiencesPage } from "@/lib/admin-api";
import { ListPagination } from "@/components/admin/list-pagination";
import { parsePage } from "@/lib/pagination";
import { formatMonth } from "@/lib/experience";
import { formatDateTime } from "@/lib/format";

export default async function AdminExperience({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const experiences = await getAdminExperiencesPage(
    parsePage((await searchParams).page),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiencia"
        description="Prepara cada cargo como borrador, publícalo y retíralo cuando sea necesario."
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/admin/experience/new" />}
          >
            Nueva experiencia
          </Button>
        }
      />
      <ResourceList
        titleHeader="Cargo"
        columns={["Periodo", "Posición", "Última edición"]}
        resource="experience"
        noun="Experiencia"
        plural="experiencia"
        feminine
        empty={{
          title: "Todavía no hay experiencia",
          description:
            "Crea la primera para mostrarla en el portafolio cuando la publiques.",
        }}
        rows={experiences.items.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.organization,
          cells: [
            `${formatMonth(item.startDate)} – ${item.endDate ? formatMonth(item.endDate) : "Actual"}`,
            String(item.position),
            formatDateTime(item.updatedAt),
          ],
          status: item.status,
          pending: Boolean(item.pending),
          editHref: `/admin/experience/${item.id}/edit`,
          completeHref: `/admin/experience/${item.id}/edit`,
        }))}
      />
      <ListPagination
        basePath="/admin/experience"
        page={experiences.page}
        totalPages={experiences.totalPages}
        total={experiences.total}
        pageSize={experiences.pageSize}
      />
    </div>
  );
}
