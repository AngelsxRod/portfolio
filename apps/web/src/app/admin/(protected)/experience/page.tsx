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
import { getAdminExperiences } from "@/lib/admin-api";
import { formatMonth } from "@/lib/experience";
import { ExperiencePublicationAction } from "./experience-publication-action";

export default async function AdminExperience() {
  const experiences = await getAdminExperiences();
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Experiencia</h1>
          <p className="text-muted-foreground">
            Prepara cada cargo como borrador, publícalo y retíralo cuando sea
            necesario.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/experience/new" />}
        >
          Nueva experiencia
        </Button>
      </div>
      <Card>
        <CardContent>
          {experiences.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h2 className="font-medium">Todavía no hay experiencia</h2>
              <p className="text-sm text-muted-foreground">
                Crea la primera para mostrarla en el portafolio cuando la
                publiques.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiences.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-64 font-medium whitespace-normal break-words">
                      {item.title}
                      <span className="block text-sm font-normal text-muted-foreground">
                        {item.organization}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {formatMonth(item.startDate)} –{" "}
                      {item.endDate ? formatMonth(item.endDate) : "Actual"}
                    </TableCell>
                    <TableCell>
                      {item.status === "published" ? (
                        <Badge>Publicada</Badge>
                      ) : (
                        <Badge variant="secondary">Borrador</Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.position}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-start gap-2">
                        <Button
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/admin/experience/${item.id}/edit`}
                              aria-label={`${item.status === "draft" ? "Editar" : "Ver"} ${item.title} en ${item.organization}`}
                            />
                          }
                        >
                          {item.status === "draft" ? "Editar" : "Ver"}
                        </Button>
                        <ExperiencePublicationAction
                          id={item.id}
                          name={`${item.title} en ${item.organization}`}
                          status={item.status}
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
