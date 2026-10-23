import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceList } from "@/components/admin/resource-list";
import { getAdminCertificates } from "@/lib/admin-api";
import { formatMonth } from "@/lib/experience";
import { formatDateTime } from "@/lib/format";

export default async function AdminCertificates() {
  const items = await getAdminCertificates();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificados"
        description="Prepara cada certificado como borrador, publícalo y retíralo cuando sea necesario."
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/admin/certificates/new" />}
          >
            Nuevo certificado
          </Button>
        }
      />
      <ResourceList
        titleHeader="Certificado"
        columns={["Emisión", "Posición", "Última edición"]}
        resource="certificates"
        noun="Certificado"
        plural="certificados"
        empty={{
          title: "Todavía no hay certificados",
          description:
            "Crea el primero para mostrarlo en el portafolio cuando lo publiques.",
        }}
        rows={items.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.issuer,
          cells: [
            formatMonth(item.issueDate),
            String(item.position),
            formatDateTime(item.updatedAt),
          ],
          status: item.status,
          editHref: `/admin/certificates/${item.id}/edit`,
          completeHref: `/admin/certificates/${item.id}/edit`,
        }))}
      />
    </div>
  );
}
