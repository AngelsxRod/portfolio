import { DraftForm } from "@/app/admin/(protected)/projects/draft-form";
import { getTechnologySuggestions } from "@/lib/admin-api";

export default async function NewDraft() {
  return <DraftForm suggestions={await getTechnologySuggestions()} />;
}
