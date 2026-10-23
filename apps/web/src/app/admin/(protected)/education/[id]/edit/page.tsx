import { getAdminEducation } from "@/lib/admin-api";
import { EducationForm } from "../../education-form";

export default async function EditEducation({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const education = await getAdminEducation(id);
  const { saved } = await searchParams;
  return (
    <EducationForm
      key={education.id}
      education={education}
      justCreated={saved === "1"}
    />
  );
}
