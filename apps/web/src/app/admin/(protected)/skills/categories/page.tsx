import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { getSkillCategoriesPage } from "@/lib/admin-api";
import { ListPagination } from "@/components/admin/list-pagination";
import { parsePage } from "@/lib/pagination";

export default async function SkillCategories({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const categories = await getSkillCategoriesPage(
    parsePage((await searchParams).page),
  );
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
        rows={categories.items.map((category) => ({
          id: category.id,
          title: category.name,
          cells: [String(category.position), String(category.skillCount)],
          editHref: `/admin/skills/categories/${category.id}/edit`,
        }))}
      />
      <ListPagination
        basePath="/admin/skills/categories"
        page={categories.page}
        totalPages={categories.totalPages}
        total={categories.total}
        pageSize={categories.pageSize}
      />
    </div>
  );
}
