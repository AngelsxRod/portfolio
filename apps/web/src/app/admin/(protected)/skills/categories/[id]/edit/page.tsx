import { getSkillCategory } from "@/lib/admin-api";
import { CategoryForm } from "../../category-form";

export default async function EditCategory({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const category = await getSkillCategory(id);
  const { saved } = await searchParams;
  return (
    <CategoryForm
      key={category.id}
      category={category}
      justCreated={saved === "1"}
    />
  );
}
