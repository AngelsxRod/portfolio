import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { getSkillCategories } from "@/lib/admin-api";

export default async function SkillCategories() {
  const categories = await getSkillCategories();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/admin/skills"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver a habilidades
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Categorías de habilidades
          </h1>
          <p className="text-muted-foreground">
            Lista controlada que organiza las habilidades en la portada.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/skills/categories/new" />}
        >
          Nueva categoría
        </Button>
      </div>
      <Card>
        <CardContent>
          {categories.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h2 className="font-medium">Todavía no hay categorías</h2>
              <p className="text-sm text-muted-foreground">
                Crea una categoría antes de añadir habilidades.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>Habilidades</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="max-w-72 font-medium whitespace-normal break-words">
                      {category.name}
                    </TableCell>
                    <TableCell>{category.position}</TableCell>
                    <TableCell>{category.skillCount}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/admin/skills/categories/${category.id}/edit`}
                            aria-label={`Editar ${category.name}`}
                          />
                        }
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
