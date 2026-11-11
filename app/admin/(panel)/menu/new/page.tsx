import DishForm from "@/components/DishForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewDishPage() {
  await requireAdmin();
  return <DishForm />;
}
