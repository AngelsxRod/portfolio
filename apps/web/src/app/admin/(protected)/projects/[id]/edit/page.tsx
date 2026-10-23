import { DraftForm } from "@/app/admin/(protected)/projects/draft-form";
import { getDraft } from "@/lib/admin-api";

export default async function EditDraft({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const draft = await getDraft(id);
  const { saved } = await searchParams;
  return <DraftForm key={draft.id} draft={draft} justCreated={saved === "1"} />;
}
