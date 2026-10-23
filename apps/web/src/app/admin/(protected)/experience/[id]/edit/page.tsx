import { getAdminExperience } from "@/lib/admin-api";
import { ExperienceForm } from "../../experience-form";

export default async function EditExperience({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const experience = await getAdminExperience(id);
  const { saved } = await searchParams;
  return (
    <ExperienceForm
      key={experience.id}
      experience={experience}
      justCreated={saved === "1"}
    />
  );
}
