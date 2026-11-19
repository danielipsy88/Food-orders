import Link from "next/link";
import { btnGhost, btnPrimary, card, input } from "@/components/ui";
import { moveDish, setDishState, setDishStock, type DishState, type MenuSection } from "../../actions";
import { requireAdmin } from "@/lib/auth";
import { getDishes, type Dish } from "@/lib/data";
import { money } from "@/lib/format";

const states: { key: DishState; label: string; on: string }[] = [
  { key: "available", label: "מוצגת", on: "bg-olive text-white" },
  { key: "soldout", label: "נגמרה", on: "bg-amber-500 text-white" },
  { key: "offweek", label: "לא השבוע", on: "bg-[#6b4f7a] text-white" },
  { key: "hidden", label: "מוסתרת", on: "bg-stone-500 text-white" },
];

const stateOf = (d: Dish): DishState =>
  !d.visible ? "hidden" : d.off_week ? "offweek" : d.sold_out ? "soldout" : "available";

const sectionOf = (d: Dish): MenuSection => (!d.visible ? "hidden" : d.off_week ? "more" : "week");

const sections: { key: MenuSection; title: string; note: string }[] = [
  { key: "week", title: "תפריט השבוע", note: "מה שהלקוח רואה ראשון. מנות שנגמרו מופיעות כאן עם ״נגמר״." },
  { key: "more", title: "מנות נוספות", note: "בסוף התפריט, תחת ״לא נמכרות השבוע״." },
  { key: "hidden", title: "מוסתרות", note: "לא מופיעות ללקוחות בכלל." },
];

const views = [
  { key: "all", label: "כל המנות" },
  { key: "customer", label: "כמו שהלקוח רואה" },
] as const;

export default async function MenuPage({ searchParams }: PageProps<"/admin/menu">) {
  await requireAdmin();
  const { view } = await searchParams;
  const grouped = view === "customer";
  const dishes = await getDishes(true);

  return (
    <>
      <Link href="/admin/menu/new" className={`${btnPrimary} mb-4 w-full`}>+ מנה חדשה</Link>

      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-stone-200/70 p-1" role="group" aria-label="תצוגה">
        {views.map((v) => {
          const active = (v.key === "customer") === grouped;
          return (
            <Link
              key={v.key}
              href={v.key === "customer" ? "/admin/menu?view=customer" : "/admin/menu"}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg py-2 text-center text-sm font-semibold ${
                active ? "bg-white text-ink shadow-sm" : "text-stone-600"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>

      <p className="mb-3 text-sm text-stone-600">
        <b>מוצגת</b>: אפשר להזמין. <b>נגמרה</b>: הלקוח רואה אותה עם הסימון ״נגמר״ ולא יכול להזמין.{" "}
        <b>לא השבוע</b>: מופיעה בסוף התפריט, תחת ״מנות נוספות״, ואי אפשר להזמין.{" "}
        <b>מוסתרת</b>: לא מופיעה ללקוחות, אבל נשארת שמורה כאן.{" "}
        <b>מלאי</b>: כמה מנות נשארו. כל הזמנה מורידה מהמספר וכל ביטול מחזיר. כשמגיעים ל-0 המנה עוברת ל״נגמרה״ לבד. ריק = ללא הגבלה. הלקוחות לא רואים את המספר.{" "}
        {grouped ? "החיצים מזיזים מנה בתוך האזור שלה." : "החיצים משנים את סדר המנות באתר."}
      </p>

      {dishes.length === 0 && <p className={`${card} p-6 text-center text-stone-500`}>עדיין אין מנות</p>}

      {grouped ? (
        <div className="space-y-6">
          {sections.map((s) => {
            const list = dishes.filter((d) => sectionOf(d) === s.key);
            return (
              <section key={s.key} aria-labelledby={`sec-${s.key}`}>
                <h2 id={`sec-${s.key}`} className="flex items-baseline justify-between gap-2 font-bold">
                  <span>{s.title}</span>
                  <span className="text-sm font-normal text-stone-500">{list.length} מנות</span>
                </h2>
                <p className="mb-2 text-sm text-stone-500">{s.note}</p>
                {list.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
                    אין מנות באזור הזה
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((d, i) => (
                      <DishRow key={d.id} d={d} first={i === 0} last={i === list.length - 1} withinSection />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-2">
          {dishes.map((d, i) => (
            <DishRow key={d.id} d={d} first={i === 0} last={i === dishes.length - 1} />
          ))}
        </ul>
      )}
    </>
  );
}

function DishRow({ d, first, last, withinSection = false }: { d: Dish; first: boolean; last: boolean; withinSection?: boolean }) {
  const current = stateOf(d);
  return (
    <li className={`${card} p-3 ${current === "hidden" ? "bg-stone-50" : ""}`}>
      <div className="flex items-center gap-3">
        {d.has_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/img/${d.id}?v=${d.v}`}
            alt=""
            className={`size-14 shrink-0 rounded-lg object-cover ${current === "available" ? "" : "opacity-50"}`}
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xl">🍽️</div>
        )}
        <Link href={`/admin/menu/${d.id}`} className="min-w-0 flex-1">
          <p className={`truncate font-semibold ${current === "hidden" ? "text-stone-500" : ""}`}>{d.name}</p>
          <p className="text-sm text-stone-500">
            {money(d.price)} · עריכה
            {d.stock !== null && (
              <span className={`ms-1.5 font-semibold ${d.stock === 0 ? "text-red-700" : "text-olive"}`}>
                · {d.stock === 0 ? "אזל המלאי" : `נשארו ${d.stock}`}
              </span>
            )}
          </p>
        </Link>
        <div className="flex shrink-0 gap-1">
          {(["up", "down"] as const).map((dir) => (
            <form key={dir} action={moveDish.bind(null, d.id, dir, withinSection)}>
              <button
                disabled={dir === "up" ? first : last}
                aria-label={`${d.name}: ${dir === "up" ? "הזזה למעלה" : "הזזה למטה"}`}
                className="flex size-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 disabled:opacity-30"
              >
                {dir === "up" ? "▲" : "▼"}
              </button>
            </form>
          ))}
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-stone-100 p-1" role="group" aria-label={`${d.name}: מצב`}>
        {states.map((s) => (
          <form key={s.key} action={setDishState.bind(null, d.id, s.key)}>
            <button
              aria-pressed={current === s.key}
              className={`w-full whitespace-nowrap rounded-lg px-0.5 py-1.5 text-sm font-medium ${current === s.key ? s.on : "text-stone-600"}`}
            >
              {s.label}
            </button>
          </form>
        ))}
      </div>
      <form action={setDishStock.bind(null, d.id)} className="mt-2 flex items-center gap-2">
        <label htmlFor={`stock-${d.id}`} className="shrink-0 text-sm text-stone-600">מלאי</label>
        <input
          key={`${d.id}-${d.stock}`}
          id={`stock-${d.id}`}
          name="stock"
          type="number"
          min={0}
          inputMode="numeric"
          dir="ltr"
          placeholder="ללא הגבלה"
          defaultValue={d.stock ?? ""}
          className={`${input} py-1.5 text-right`}
        />
        <button className={`${btnGhost} shrink-0 py-1.5`}>שמירה</button>
      </form>
    </li>
  );
}
