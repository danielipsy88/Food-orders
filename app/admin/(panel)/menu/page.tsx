import Link from "next/link";
import { btnPrimary, card } from "@/components/ui";
import { setDishVisible } from "../../actions";
import { requireAdmin } from "@/lib/auth";
import { getDishes } from "@/lib/data";
import { money } from "@/lib/format";

export default async function MenuPage() {
  await requireAdmin();
  const dishes = await getDishes(true);

  return (
    <>
      <Link href="/admin/menu/new" className={`${btnPrimary} mb-4 w-full`}>+ מנה חדשה</Link>
      <p className="mb-3 text-sm text-stone-600">
        מנה מוסתרת נשארת שמורה כאן ולא מופיעה ללקוחות. כך אפשר להחליף תפריט בלי להקליד מחדש.
      </p>
      {dishes.length === 0 && <p className={`${card} p-6 text-center text-stone-500`}>עדיין אין מנות</p>}
      <ul className="space-y-2">
        {dishes.map((d) => (
          <li key={d.id} className={`${card} flex items-center gap-3 p-3 ${d.visible ? "" : "bg-stone-50"}`}>
            {d.has_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/img/${d.id}?v=${d.v}`} alt="" className={`size-14 shrink-0 rounded-lg object-cover ${d.visible ? "" : "opacity-50"}`} />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xl">🍽️</div>
            )}
            <Link href={`/admin/menu/${d.id}`} className="min-w-0 flex-1">
              <p className={`truncate font-semibold ${d.visible ? "" : "text-stone-500"}`}>{d.name}</p>
              <p className="text-sm text-stone-500">{money(d.price)} · עריכה</p>
            </Link>
            <form action={setDishVisible.bind(null, d.id, !d.visible)}>
              <button
                role="switch"
                aria-checked={d.visible}
                aria-label={`${d.name}: מוצגת בתפריט`}
                className={`flex h-7 w-12 items-center rounded-full p-0.5 transition ${
                  d.visible ? "justify-end bg-olive" : "justify-start bg-stone-300"
                }`}
              >
                <span className="size-6 rounded-full bg-white shadow" />
              </button>
              <span className="mt-0.5 block text-center text-xs text-stone-500">{d.visible ? "מוצגת" : "מוסתרת"}</span>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
