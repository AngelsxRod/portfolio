import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { getAdminExperiences } from "@/lib/admin-api";
import { formatMonth } from "@/lib/experience";
import { formatDateTime } from "@/lib/format";

export default async function AdminExperience() {
  const experiences = await getAdminExperiences();
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
        rows={experiences.map((item) => ({
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
    </div>
  );
}
