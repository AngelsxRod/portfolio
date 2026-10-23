import { getAdminCertificate } from "@/lib/admin-api";
import { CertificateForm } from "../../certificate-form";

export default async function EditCertificate({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const certificate = await getAdminCertificate(id);
  const { saved } = await searchParams;
  return (
    <CertificateForm
      key={certificate.id}
      certificate={certificate}
      justCreated={saved === "1"}
    />
  );
}
