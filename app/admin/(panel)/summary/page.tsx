import AutoRefresh from "@/components/AutoRefresh";
import { card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getPrepSummary } from "@/lib/data";
import { formatDay } from "@/lib/format";

export default async function SummaryPage() {
  await requireAdmin();
  const rows = await getPrepSummary();
  const days = new Map<string, typeof rows>();
  for (const r of rows) days.set(r.date, [...(days.get(r.date) ?? []), r]);

  return (
    <>
      <AutoRefresh />
      <p className="mb-4 text-sm text-stone-600">כמויות להכנה לפי יום, מתוך ההזמנות הפתוחות בלבד.</p>
      {rows.length === 0 && (
        <p className={`${card} p-6 text-center text-stone-500`}>אין הזמנות פתוחות</p>
      )}
      {[...days].map(([date, list]) => (
        <section key={date} className={`${card} mb-4 p-4`}>
          <h2 className="mb-2 flex justify-between font-bold">
            <span>{formatDay(date)}</span>
            <span className="text-stone-500">{list.reduce((n, r) => n + r.qty, 0)} מנות</span>
          </h2>
          <ul className="divide-y divide-stone-100">
            {list.map((r) => (
              <li key={r.name} className="flex justify-between py-1.5">
                <span>{r.name}</span>
                <b className="text-lg">{r.qty}</b>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
