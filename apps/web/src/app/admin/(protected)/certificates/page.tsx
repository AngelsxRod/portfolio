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
import { getAdminCertificates } from "@/lib/admin-api";
import { formatMonth } from "@/lib/experience";
import { CertificatePublicationAction } from "./certificate-publication-action";

export default async function AdminCertificates() {
  const items = await getAdminCertificates();
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Certificados
          </h1>
          <p className="text-muted-foreground">
            Prepara cada certificado como borrador, publícalo y retíralo cuando
            sea necesario.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/certificates/new" />}
        >
          Nuevo certificado
        </Button>
      </div>
      <Card>
        <CardContent>
          {items.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h2 className="font-medium">Todavía no hay certificados</h2>
              <p className="text-sm text-muted-foreground">
                Crea el primero para mostrarla en el portafolio cuando la
                publiques.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Emisión</TableHead>
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
                      {item.name}
                      <span className="block text-sm font-normal text-muted-foreground">
                        {item.issuer}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {formatMonth(item.issueDate)}
                    </TableCell>
                    <TableCell>
                      {item.status === "published" ? (
                        <Badge>Publicado</Badge>
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
                              href={`/admin/certificates/${item.id}/edit`}
                              aria-label={`${item.status === "draft" ? "Editar" : "Ver"} ${item.name} de ${item.issuer}`}
                            />
                          }
                        >
                          {item.status === "draft" ? "Editar" : "Ver"}
                        </Button>
                        <CertificatePublicationAction
                          id={item.id}
                          name={`${item.name} de ${item.issuer}`}
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
