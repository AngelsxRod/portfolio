import { redirect } from "next/navigation";

export default async function ProjectMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/projects/${encodeURIComponent(id)}/edit#images-title`);
}
