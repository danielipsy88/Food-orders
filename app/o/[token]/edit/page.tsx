import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderForm from "@/components/OrderForm";
import { getDishes, getOrderByToken, getSettings } from "@/lib/data";
import { getSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function EditOrder({ params }: PageProps<"/o/[token]/edit">) {
  const { token } = await params;
  const [order, settings, dishes] = await Promise.all([
    getOrderByToken(token),
    getSettings(),
    getDishes(),
  ]);
  if (!order) notFound();
  if (!order.editable) redirect(`/o/${order.token}`);

  const available = new Set(dishes.filter((d) => !d.sold_out).map((d) => d.id));
  const items = Object.fromEntries(
    order.items.filter((i) => available.has(i.dish_id)).map((i) => [i.dish_id, i.qty]),
  );
  const dropped = order.items.filter((i) => !available.has(i.dish_id));

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <header className="mb-5 text-center">
        <h1 className="text-2xl font-extrabold text-brand-dark">שינוי הזמנה #{order.id}</h1>
        <Link href={`/o/${order.token}`} className="text-sm text-stone-600 underline">
          חזרה בלי לשנות
        </Link>
      </header>
      {dropped.length > 0 && (
        <p className="mb-4 rounded-xl bg-amber-100 px-3 py-2 text-sm">
          המנות הבאות נגמרו או ירדו מהתפריט, ויוסרו אם ההזמנה תישמר מחדש:{" "}
          {dropped.map((i) => i.name).join(", ")}
        </p>
      )}
      <OrderForm
        dishes={dishes}
        slots={getSlots(settings)}
        pickupAddress={settings.pickup_address}
        editToken={order.token}
        initial={{
          items,
          name: order.name,
          phone: order.phone,
          note: order.note,
          method: order.method,
          address: order.address,
          date: order.date,
          time: order.time,
        }}
      />
    </main>
  );
}
