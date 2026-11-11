import { notFound } from "next/navigation";
import DishForm from "@/components/DishForm";
import { requireAdmin } from "@/lib/auth";
import { getDish } from "@/lib/data";

export default async function EditDishPage({ params }: PageProps<"/admin/menu/[id]">) {
  await requireAdmin();
  const dish = await getDish(Number((await params).id) || 0);
  if (!dish) notFound();
  return <DishForm dish={dish} />;
}
