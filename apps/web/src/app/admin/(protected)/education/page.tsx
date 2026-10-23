import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { getAdminEducationList } from "@/lib/admin-api";
import { educationLevels } from "@/lib/education";
import { formatMonth } from "@/lib/experience";
import { formatDateTime } from "@/lib/format";

export default async function AdminEducation() {
  const items = await getAdminEducationList();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Educación"
        description="Prepara cada estudio como borrador, publícalo y retíralo cuando sea necesario."
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/admin/education/new" />}
          >
            Nueva educación
          </Button>
        }
      />
      <ResourceList
        titleHeader="Programa"
        columns={["Nivel", "Periodo", "Posición", "Última edición"]}
        resource="education"
        noun="Educación"
        plural="educación"
        feminine
        empty={{
          title: "Todavía no hay educación",
          description:
            "Crea el primer registro para mostrarlo en el portafolio cuando lo publiques.",
        }}
        rows={items.map((item) => ({
          id: item.id,
          title: item.program,
          subtitle: item.institution,
          cells: [
            educationLevels[item.level],
            `${formatMonth(item.startDate)} – ${item.endDate ? formatMonth(item.endDate) : "En curso"}`,
            String(item.position),
            formatDateTime(item.updatedAt),
          ],
          status: item.status,
          pending: Boolean(item.pending),
          editHref: `/admin/education/${item.id}/edit`,
          completeHref: `/admin/education/${item.id}/edit`,
        }))}
      />
    </div>
  );
}
