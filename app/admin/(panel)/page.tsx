import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import { btnGhost, card, input } from "@/components/ui";
import { setDeliveryFee, setOrderStatus } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { getOrderCounts, getOrders, type Order } from "@/lib/data";
import { formatDateTime, formatDay, money, whatsappLink } from "@/lib/format";

const filters = [
  { key: "new", label: "פתוחות" },
  { key: "done", label: "טופלו" },
  { key: "cancelled", label: "בוטלו" },
  { key: "all", label: "הכול" },
];

export default async function OrdersPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { status } = await searchParams;
  const current = filters.some((f) => f.key === status) ? (status as string) : "new";
  const [orders, counts] = await Promise.all([getOrders(current), getOrderCounts()]);
  const total = counts.new + counts.done + counts.cancelled;

  // Group by day so the list reads like a schedule.
  const days = new Map<string, Order[]>();
  for (const o of orders) days.set(o.date, [...(days.get(o.date) ?? []), o]);

  return (
    <>
      <AutoRefresh />
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key === "new" ? "/admin" : `/admin?status=${f.key}`}
            className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm ${
              current === f.key ? "border-brand bg-brand/10 font-semibold text-brand-dark" : "border-stone-300 bg-white"
            }`}
          >
            {f.label} ({f.key === "all" ? total : counts[f.key]})
          </Link>
        ))}
      </div>

      {orders.length === 0 && (
        <p className={`${card} p-6 text-center text-stone-500`}>אין הזמנות להצגה</p>
      )}

      {[...days].map(([date, list]) => (
        <section key={date} className="mb-6">
          <h2 className="mb-2 font-bold text-stone-700">
            {formatDay(date)} · {list.length} הזמנות
          </h2>
          <div className="space-y-3">
            {list.map((o) => (
              <OrderCard key={o.id} o={o} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

const statusBadge = {
  new: ["חדשה", "bg-amber-100 text-amber-900"],
  done: ["טופלה", "bg-green-100 text-green-800"],
  cancelled: ["בוטלה", "bg-stone-200 text-stone-600"],
} as const;

function OrderCard({ o }: { o: Order }) {
  const [badge, badgeClass] = statusBadge[o.status];
  const total = o.subtotal + (o.delivery_fee ?? 0);

  return (
    <article className={`${card} p-4 ${o.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold leading-tight">
            {o.time} · {o.method === "pickup" ? "איסוף" : "משלוח"}
          </p>
          <p className="font-medium">{o.name}</p>
        </div>
        <div className="text-end">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>{badge}</span>
          <p className="mt-1 text-sm text-stone-500">#{o.id}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-0.5 border-t border-stone-100 pt-3">
        {o.items.map((i) => (
          <li key={i.dish_id} className="flex justify-between gap-3">
            <span><b>{i.qty}</b> × {i.name}</span>
            <span className="shrink-0 text-stone-500">{money(i.qty * i.price)}</span>
          </li>
        ))}
      </ul>

      {o.note && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm">
          <b>הערה:</b> {o.note}
        </p>
      )}
      {o.method === "delivery" && (
        <p className="mt-2 text-sm" dir="auto">
          <a
            className="underline"
            target="_blank"
            rel="noopener"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`}
          >
            {o.address}
          </a>
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
        <p className="font-bold">
          {money(total)}
          {o.method === "delivery" && (
            <span className="ms-1 text-sm font-normal text-stone-500">
              {o.delivery_fee === null ? "+ משלוח" : `כולל משלוח ${money(o.delivery_fee)}`}
            </span>
          )}
        </p>
        <div className="flex gap-3 text-sm">
          <a className="underline" href={`tel:${o.phone}`} dir="ltr">{o.phone}</a>
          <a className="font-medium text-green-700 underline" target="_blank" rel="noopener"
            href={whatsappLink(o.phone)}>וואטסאפ</a>
        </div>
      </div>

      {o.method === "delivery" && o.status !== "cancelled" && (
        <form action={setDeliveryFee.bind(null, o.id)} className="mt-3 flex items-center gap-2">
          <label htmlFor={`fee-${o.id}`} className="shrink-0 text-sm text-stone-600">עלות משלוח (Kč)</label>
          <input id={`fee-${o.id}`} name="fee" type="number" min={0} inputMode="numeric" dir="ltr"
            defaultValue={o.delivery_fee ?? ""} className={`${input} py-1.5`} />
          <button className={`${btnGhost} shrink-0 py-1.5`}>שמירה</button>
        </form>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {o.status === "new" && (
          <>
            <form action={setOrderStatus.bind(null, o.id, "done")} className="flex-1">
              <button className="w-full rounded-xl bg-olive px-4 py-2.5 font-semibold text-white">
                סימון כטופלה
              </button>
            </form>
            <form action={setOrderStatus.bind(null, o.id, "cancelled")}>
              <button className={`${btnGhost} text-red-700`}>ביטול</button>
            </form>
          </>
        )}
        {o.status !== "new" && (
          <form action={setOrderStatus.bind(null, o.id, "new")}>
            <button className={btnGhost}>החזרה לפתוחות</button>
          </form>
        )}
        <span className="ms-auto text-xs text-stone-400">התקבלה {formatDateTime(o.created_at)}</span>
      </div>
    </article>
  );
}
