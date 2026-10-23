import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { getAdminSkills } from "@/lib/admin-api";
import { SkillPublicationAction } from "./skill-publication-action";

export default async function AdminSkills() {
  const skills = await getAdminSkills();
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Habilidades</h1>
          <p className="text-muted-foreground">
            Prepara habilidades como borrador, publícalas y retíralas cuando sea
            necesario.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
      <Card>
        <CardContent>
          {skills.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h2 className="font-medium">Todavía no hay habilidades</h2>
              <p className="text-sm text-muted-foreground">
                Crea la primera para mostrarla en el portafolio cuando la
                publiques.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Habilidad</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>Última edición</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="max-w-56 font-medium whitespace-normal break-words">
                      {skill.name}
                    </TableCell>
                    <TableCell className="max-w-48 whitespace-normal break-words">
                      {skill.category}
                    </TableCell>
                    <TableCell>
                      {skill.status === "published" ? (
                        <Badge>Publicada</Badge>
                      ) : (
                        <Badge variant="secondary">Borrador</Badge>
                      )}
                    </TableCell>
                    <TableCell>{skill.position}</TableCell>
                    <TableCell>
                      <time dateTime={skill.updatedAt}>
                        {new Intl.DateTimeFormat("es-GT", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Guatemala",
                        }).format(new Date(skill.updatedAt))}
                      </time>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-start gap-2">
                        <Button
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/admin/skills/${skill.id}/edit`}
                              aria-label={`${skill.status === "draft" ? "Editar" : "Ver"} ${skill.name}`}
                            />
                          }
                        >
                          {skill.status === "draft" ? "Editar" : "Ver"}
                        </Button>
                        <SkillPublicationAction
                          id={skill.id}
                          name={skill.name}
                          status={skill.status}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
