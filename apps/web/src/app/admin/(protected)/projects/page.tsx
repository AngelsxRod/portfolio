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
import { getDrafts, getPublishedProjects } from "@/lib/admin-api";
import { PublicationAction } from "./publication-action";

export default async function AdminHome() {
  const [drafts, published] = await Promise.all([
    getDrafts(),
    getPublishedProjects(),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">
            Prepara borradores, publícalos y retíralos cuando sea necesario.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/projects/new" />}
        >
          Nuevo borrador
        </Button>
      </div>
      <h2 className="text-xl font-semibold">Borradores</h2>
      <Card>
        <CardContent>
          {drafts.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h2 className="font-medium">Todavía no hay borradores</h2>
              <p className="text-sm text-muted-foreground">
                Crea el primero para empezar a documentar un proyecto.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>Última edición</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="max-w-72 whitespace-normal">
                      <p className="font-medium break-words">{draft.title}</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {draft.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Borrador</Badge>
                    </TableCell>
                    <TableCell>{draft.position}</TableCell>
                    <TableCell>
                      <time dateTime={draft.updatedAt}>
                        {new Intl.DateTimeFormat("es-GT", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Guatemala",
                        }).format(new Date(draft.updatedAt))}
                      </time>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-start gap-2">
                        <Button
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/admin/projects/${draft.id}/edit`}
                              aria-label={`Editar ${draft.title}`}
                            />
                          }
                        >
                          Editar
                        </Button>
                        <PublicationAction
                          id={draft.id}
                          title={draft.title}
                          status="draft"
                        />
                        <Button
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/admin/projects/${draft.id}/edit#images-title`}
                            />
                          }
                        >
                          Imágenes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <h2 className="text-xl font-semibold">Publicados</h2>
      <Card>
        <CardContent>
          {published.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <p className="font-medium">Todavía no hay proyectos publicados</p>
              <p className="text-sm text-muted-foreground">
                Completa un borrador y publícalo para mostrarlo en el
                portafolio.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>Última edición</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {published.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="max-w-72 whitespace-normal">
                      <p className="font-medium break-words">{project.title}</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {project.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge>Publicado</Badge>
                    </TableCell>
                    <TableCell>{project.position}</TableCell>
                    <TableCell>
                      <time dateTime={project.updatedAt}>
                        {new Intl.DateTimeFormat("es-GT", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Guatemala",
                        }).format(new Date(project.updatedAt))}
                      </time>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-start gap-2">
                        <Button
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/projects/${project.slug}`}
                              aria-label={`Ver ${project.title}`}
                            />
                          }
                        >
                          Ver
                        </Button>
                        <PublicationAction
                          id={project.id}
                          title={project.title}
                          status="published"
                        />
                        <Button
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/admin/projects/${project.id}/edit#images-title`}
                            />
                          }
                        >
                          Imágenes
                        </Button>
                      </div>
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
