import Link from "next/link";
import { btnPrimary, card } from "@/components/ui";
import { moveDish, setDishState, type DishState } from "../../actions";
import { requireAdmin } from "@/lib/auth";
import { getDishes, type Dish } from "@/lib/data";
import { money } from "@/lib/format";

const states: { key: DishState; label: string; on: string }[] = [
  { key: "available", label: "מוצגת", on: "bg-olive text-white" },
  { key: "soldout", label: "נגמרה", on: "bg-amber-500 text-white" },
  { key: "hidden", label: "מוסתרת", on: "bg-stone-500 text-white" },
];

const stateOf = (d: Dish): DishState => (!d.visible ? "hidden" : d.sold_out ? "soldout" : "available");

export default async function MenuPage() {
  await requireAdmin();
  const dishes = await getDishes(true);

  return (
    <>
      <Link href="/admin/menu/new" className={`${btnPrimary} mb-4 w-full`}>+ מנה חדשה</Link>
      <p className="mb-3 text-sm text-stone-600">
        <b>מוצגת</b>: אפשר להזמין. <b>נגמרה</b>: הלקוח רואה אותה עם הסימון ״נגמר״ ולא יכול להזמין.{" "}
        <b>מוסתרת</b>: לא מופיעה ללקוחות, אבל נשארת שמורה כאן. החיצים משנים את סדר המנות באתר.
      </p>
      {dishes.length === 0 && <p className={`${card} p-6 text-center text-stone-500`}>עדיין אין מנות</p>}
      <ul className="space-y-2">
        {dishes.map((d, i) => {
          const current = stateOf(d);
          return (
            <li key={d.id} className={`${card} p-3 ${current === "hidden" ? "bg-stone-50" : ""}`}>
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
                  <p className="text-sm text-stone-500">{money(d.price)} · עריכה</p>
                </Link>
                <div className="flex shrink-0 gap-1">
                  {(["up", "down"] as const).map((dir) => {
                    const disabled = dir === "up" ? i === 0 : i === dishes.length - 1;
                    return (
                      <form key={dir} action={moveDish.bind(null, d.id, dir)}>
                        <button
                          disabled={disabled}
                          aria-label={`${d.name}: ${dir === "up" ? "הזזה למעלה" : "הזזה למטה"}`}
                          className="flex size-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 disabled:opacity-30"
                        >
                          {dir === "up" ? "▲" : "▼"}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1" role="group" aria-label={`${d.name}: מצב`}>
                {states.map((s) => (
                  <form key={s.key} action={setDishState.bind(null, d.id, s.key)}>
                    <button
                      aria-pressed={current === s.key}
                      className={`w-full rounded-lg py-1.5 text-sm font-medium ${current === s.key ? s.on : "text-stone-600"}`}
                    >
                      {s.label}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
