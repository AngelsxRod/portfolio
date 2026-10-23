import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { getAdminSkills } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";

export default async function AdminSkills() {
  const skills = await getAdminSkills();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Habilidades"
        description="Prepara habilidades como borrador, publícalas y retíralas cuando sea necesario."
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/skills/categories" />}
            >
              Categorías
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/admin/skills/new" />}
            >
              Nueva habilidad
            </Button>
          </>
        }
      />
      <ResourceList
        titleHeader="Habilidad"
        columns={["Categoría", "Posición", "Última edición"]}
        resource="skills"
        noun="Habilidad"
        plural="habilidades"
        feminine
        groupLabel="Categoría"
        empty={{
          title: "Todavía no hay habilidades",
          description:
            "Crea la primera para mostrarla en el portafolio cuando la publiques.",
        }}
        rows={skills.map((item) => ({
          id: item.id,
          title: item.name,
          cells: [
            item.category,
            String(item.position),
            formatDateTime(item.updatedAt),
          ],
          group: item.category,
          status: item.status,
          pending: Boolean(item.pending),
          editHref: `/admin/skills/${item.id}/edit`,
          completeHref: `/admin/skills/${item.id}/edit`,
        }))}
      />
    </div>
  );
}
