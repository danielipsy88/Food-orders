import { card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDay } from "@/lib/format";
import { getBreakdown, getDailyStats, type Breakdown } from "@/lib/visits";

const regionNames = new Intl.DisplayNames(["he"], { type: "region" });

function countryName(code: string) {
  if (!code) return "לא ידוע";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export default async function StatsPage() {
  await requireAdmin();
  const [days, sources, countries] = await Promise.all([
    getDailyStats(14),
    getBreakdown("source"),
    getBreakdown("country"),
  ]);
  const sum = (n: number, k: "hits" | "visitors" | "orders") =>
    days.slice(0, n).reduce((t, d) => t + d[k], 0);

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Tile label="מבקרים היום" value={days[0]?.visitors ?? 0} />
        <Tile label="מבקרים ב-7 ימים" value={sum(7, "visitors")} />
        <Tile label="הזמנות ב-7 ימים" value={sum(7, "orders")} />
      </div>

      <section className={`${card} mb-4 overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-3 py-2 text-start font-medium">יום</th>
              <th className="px-3 py-2 text-end font-medium">מבקרים</th>
              <th className="px-3 py-2 text-end font-medium">כניסות</th>
              <th className="px-3 py-2 text-end font-medium">הזמנות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {days.map((d) => (
              <tr key={d.day} className={d.hits || d.orders ? "" : "text-stone-400"}>
                <td className="px-3 py-2">{formatDay(d.day)}</td>
                <td className="px-3 py-2 text-end font-semibold">{d.visitors}</td>
                <td className="px-3 py-2 text-end">{d.hits}</td>
                <td className="px-3 py-2 text-end">{d.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <List title="מאיפה הגיעו (30 ימים)" rows={sources} name={(l) => l || "ישיר (קישור בלי סימון)"} />
      <List title="מדינות (30 ימים)" rows={countries} name={countryName} />

      <p className="text-sm text-stone-500">
        מבקר נספר פעם אחת ביום. כניסות של המנהל ושל רובוטים לא נספרות. כדי להבדיל בין מקורות,
        אפשר לשתף קישור עם סימון, למשל <span dir="ltr">?src=whatsapp</span> בסוף הכתובת.
      </p>
    </>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${card} p-3 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}

function List({ title, rows, name }: { title: string; rows: Breakdown[]; name: (l: string) => string }) {
  return (
    <section className={`${card} mb-4 p-4`}>
      <h2 className="mb-2 font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">עדיין אין נתונים</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {rows.map((r) => (
            <li key={r.label} className="flex justify-between py-1.5">
              <span dir="auto">{name(r.label)}</span>
              <b>{r.visitors}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
