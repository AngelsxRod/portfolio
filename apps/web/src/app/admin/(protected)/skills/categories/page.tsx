import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { getSkillCategories } from "@/lib/admin-api";

export default async function SkillCategories() {
  const categories = await getSkillCategories();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías de habilidades"
        description="Lista controlada que organiza las habilidades en la portada."
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/skills" />}
            >
              Volver a habilidades
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/admin/skills/categories/new" />}
            >
              Nueva categoría
            </Button>
          </>
        }
      />
      <ResourceList
        titleHeader="Categoría"
        columns={["Posición", "Habilidades"]}
        noun="Categoría"
        plural="categorías"
        feminine
        empty={{
          title: "Todavía no hay categorías",
          description: "Crea una categoría antes de añadir habilidades.",
        }}
        rows={categories.map((category) => ({
          id: category.id,
          title: category.name,
          cells: [String(category.position), String(category.skillCount)],
          editHref: `/admin/skills/categories/${category.id}/edit`,
        }))}
      />
    </div>
  );
}
