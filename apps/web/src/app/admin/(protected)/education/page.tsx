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
import { getAdminEducationList } from "@/lib/admin-api";
import { educationLevels } from "@/lib/education";
import { formatMonth } from "@/lib/experience";
import { EducationPublicationAction } from "./education-publication-action";

export default async function AdminEducation() {
  const items = await getAdminEducationList();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Educación</h1>
          <p className="text-muted-foreground">
            Prepara cada estudio como borrador, publícalo y retíralo cuando sea
            necesario.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/education/new" />}
        >
          Nueva educación
        </Button>
      </div>
      <Card>
        <CardContent>
          {items.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h2 className="font-medium">Todavía no hay educación</h2>
              <p className="text-sm text-muted-foreground">
                Crea el primer registro para mostrarla en el portafolio cuando
                la publiques.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Programa</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-64 font-medium whitespace-normal break-words">
                      {item.program}
                      <span className="block text-sm font-normal text-muted-foreground">
                        {item.institution}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {educationLevels[item.level]} ·{" "}
                      {formatMonth(item.startDate)} –{" "}
                      {item.endDate ? formatMonth(item.endDate) : "En curso"}
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
                              href={`/admin/education/${item.id}/edit`}
                              aria-label={`${item.status === "draft" ? "Editar" : "Ver"} ${item.program} en ${item.institution}`}
                            />
                          }
                        >
                          {item.status === "draft" ? "Editar" : "Ver"}
                        </Button>
                        <EducationPublicationAction
                          id={item.id}
                          name={`${item.program} en ${item.institution}`}
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
    </div>
  );
}
