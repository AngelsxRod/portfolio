import { DraftForm } from "@/app/admin/(protected)/projects/draft-form";
import { getAdminProject, getTechnologySuggestions } from "@/lib/admin-api";

export default async function EditDraft({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const draft = await getAdminProject(id);
  const { saved } = await searchParams;
  return (
    <DraftForm
      key={draft.id}
      draft={draft}
      initialImages={draft.media}
      justCreated={saved === "1"}
      suggestions={await getTechnologySuggestions()}
    />
  );
}
