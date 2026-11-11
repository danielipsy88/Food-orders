"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeOrder, updateOrder, type OrderInput } from "@/app/actions";
import type { Dish } from "@/lib/data";
import type { DaySlots } from "@/lib/slots";
import { money } from "@/lib/format";
import { btnPrimary, card, input, label } from "./ui";

type Initial = Omit<OrderInput, "items"> & { items: Record<number, number> };

export default function OrderForm({
  dishes,
  slots,
  pickupAddress,
  editToken,
  initial,
}: {
  dishes: Dish[];
  slots: DaySlots[];
  pickupAddress: string;
  editToken?: string;
  initial?: Initial;
}) {
  const router = useRouter();
  const detailsRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [qty, setQty] = useState<Record<number, number>>(initial?.items ?? {});
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [method, setMethod] = useState<"pickup" | "delivery">(initial?.method ?? "pickup");
  const [address, setAddress] = useState(initial?.address ?? "");

  const initialDay = slots.find((d) => d.date === initial?.date) ?? slots[0];
  const [date, setDate] = useState(initialDay?.date ?? "");
  const day = slots.find((d) => d.date === date);
  const [time, setTime] = useState(
    initialDay?.times.includes(initial?.time ?? "") ? initial!.time : "",
  );

  const chosen = useMemo(() => dishes.filter((d) => qty[d.id] > 0), [dishes, qty]);
  const count = chosen.reduce((n, d) => n + qty[d.id], 0);
  const total = chosen.reduce((n, d) => n + qty[d.id] * d.price, 0);

  const change = (id: number, delta: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(50, (q[id] ?? 0) + delta)) }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!count) return setError("לא נבחרו מנות");
    if (!time) return setError("נא לבחור שעה");
    const payload: OrderInput = {
      items: chosen.map((d) => ({ dishId: d.id, qty: qty[d.id] })),
      name,
      phone,
      note,
      method,
      address,
      date,
      time,
    };
    startTransition(async () => {
      const res = editToken ? await updateOrder(editToken, payload) : await placeOrder(payload);
      if (!res.ok) return setError(res.error);
      router.push(`/o/${res.token}?s=${editToken ? "updated" : "new"}`);
    });
  }

  return (
    <form onSubmit={submit} className="pb-28">
      <ul className="space-y-3">
        {dishes.map((d) => {
          const n = qty[d.id] ?? 0;
          return (
            <li key={d.id} className={`${card} flex gap-3 p-3 ${n ? "border-brand/60" : ""}`}>
              {d.has_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/img/${d.id}?v=${d.v}`}
                  alt=""
                  loading="lazy"
                  className="size-24 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-3xl">
                  🍽️
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="font-semibold leading-tight">{d.name}</h3>
                {d.description && (
                  <p className="mt-0.5 text-sm leading-snug text-stone-600">{d.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-semibold text-brand">{money(d.price)}</span>
                  {n === 0 ? (
                    <button
                      type="button"
                      onClick={() => change(d.id, 1)}
                      className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white"
                    >
                      הוספה
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`פחות ${d.name}`}
                        onClick={() => change(d.id, -1)}
                        className="size-9 rounded-full border border-stone-300 bg-white text-xl leading-none"
                      >
                        −
                      </button>
                      <span className="w-7 text-center font-semibold" aria-live="polite">
                        {n}
                      </span>
                      <button
                        type="button"
                        aria-label={`עוד ${d.name}`}
                        onClick={() => change(d.id, 1)}
                        className="size-9 rounded-full bg-brand text-xl leading-none text-white"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div ref={detailsRef} className={`${card} mt-6 scroll-mt-4 space-y-4 p-4`}>
        <h2 className="text-lg font-bold">פרטי ההזמנה</h2>

        {count > 0 && (
          <ul className="space-y-1 rounded-xl bg-stone-50 p-3 text-sm">
            {chosen.map((d) => (
              <li key={d.id} className="flex justify-between gap-3">
                <span>
                  {qty[d.id]} × {d.name}
                </span>
                <span className="shrink-0">{money(qty[d.id] * d.price)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-stone-200 pt-1 font-semibold">
              <span>סה״כ</span>
              <span>{money(total)}</span>
            </li>
          </ul>
        )}

        <div>
          <label className={label} htmlFor="name">שם מלא</label>
          <input id="name" required autoComplete="name" className={input} value={name}
            onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="phone">טלפון</label>
          <input id="phone" required type="tel" dir="ltr" autoComplete="tel"
            className={`${input} text-right`} value={phone}
            onChange={(e) => setPhone(e.target.value)} />
        </div>

        <fieldset>
          <legend className={label}>איך לקבל את האוכל?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["pickup", "delivery"] as const).map((m) => (
              <label
                key={m}
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center font-medium ${
                  method === m ? "border-brand bg-brand/10 text-brand-dark" : "border-stone-300 bg-white"
                }`}
              >
                <input type="radio" name="method" className="sr-only" checked={method === m}
                  onChange={() => setMethod(m)} />
                {m === "pickup" ? "איסוף עצמי" : "משלוח"}
              </label>
            ))}
          </div>
        </fieldset>

        {method === "pickup" ? (
          pickupAddress && (
            <p className="text-sm text-stone-600">
              כתובת האיסוף: <span className="font-medium text-ink" dir="auto">{pickupAddress}</span>
            </p>
          )
        ) : (
          <div>
            <label className={label} htmlFor="address">כתובת למשלוח</label>
            <input id="address" required dir="auto" autoComplete="street-address"
              placeholder="רחוב, מספר בית, שכונה" className={input} value={address}
              onChange={(e) => setAddress(e.target.value)} />
            <p className="mt-1.5 text-sm text-stone-600">
              עלות המשלוח לפי מחיר Bolt בפועל. הסכום יעודכן בעמוד ההזמנה שלך.
            </p>
          </div>
        )}

        <div className="grid grid-cols-[3fr_2fr] gap-2">
          <div>
            <label className={label} htmlFor="date">יום</label>
            <select id="date" className={input} value={date}
              onChange={(e) => { setDate(e.target.value); setTime(""); }}>
              {slots.map((d) => (
                <option key={d.date} value={d.date}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="time">
              {method === "pickup" ? "שעת איסוף" : "שעת משלוח"}
            </label>
            <select id="time" required className={input} value={time}
              onChange={(e) => setTime(e.target.value)}>
              <option value="" disabled>בחירת שעה</option>
              {day?.times.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="note">הערות (לא חובה)</label>
          <textarea id="note" rows={2} className={input} value={note}
            onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending || !count} className={`${btnPrimary} w-full`}>
          {pending ? "שולח…" : editToken ? "שמירת השינויים" : "שליחת ההזמנה"}
          {count > 0 && !pending && <span className="ms-2 font-normal">· {money(total)}</span>}
        </button>
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 p-3 backdrop-blur">
          <button
            type="button"
            onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="mx-auto flex w-full max-w-xl items-center justify-between rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            <span>{count} מנות · להמשך ההזמנה</span>
            <span>{money(total)}</span>
          </button>
        </div>
      )}
    </form>
  );
}
