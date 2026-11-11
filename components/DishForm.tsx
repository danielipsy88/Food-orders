"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteDish, saveDish } from "@/app/admin/actions";
import type { Dish } from "@/lib/data";
import { btnGhost, btnPrimary, card, input, label } from "./ui";

/** Shrinks a photo in the browser so uploads stay small and fast. */
async function toJpeg(file: File, max = 1000): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function DishForm({ dish }: { dish?: Dish }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(dish?.name ?? "");
  const [description, setDescription] = useState(dish?.description ?? "");
  const [price, setPrice] = useState(dish ? String(dish.price) : "");
  // undefined = keep what is stored, null = remove, string = new image
  const [image, setImage] = useState<string | null | undefined>(undefined);

  const preview =
    image ?? (image === undefined && dish?.has_image ? `/img/${dish.id}?v=${dish.v}` : null);

  return (
    <form
      className={`${card} space-y-4 p-4`}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const err = await saveDish({ id: dish?.id, name, description, price: Number(price), image });
          if (err) setError(err);
        });
      }}
    >
      <h1 className="text-lg font-bold">{dish ? "עריכת מנה" : "מנה חדשה"}</h1>
      <div>
        <label className={label} htmlFor="name">שם המנה</label>
        <input id="name" required className={input} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className={label} htmlFor="description">תיאור</label>
        <textarea id="description" rows={2} className={input} value={description}
          onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label className={label} htmlFor="price">מחיר (Kč)</label>
        <input id="price" required type="number" min={0} inputMode="numeric" dir="ltr"
          className={`${input} text-right`} value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <div>
        <span className={label}>תמונה</span>
        <div className="flex items-center gap-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-24 rounded-xl object-cover" />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-xl bg-amber-100 text-3xl">🍽️</div>
          )}
          <div className="flex flex-col items-start gap-2">
            <label className={`${btnGhost} cursor-pointer py-1.5`}>
              {preview ? "החלפת תמונה" : "בחירת תמונה"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setImage(await toJpeg(file));
                  } catch {
                    setError("לא הצלחנו לקרוא את התמונה");
                  }
                }}
              />
            </label>
            {preview && (
              <button type="button" className="text-sm text-red-700 underline" onClick={() => setImage(null)}>
                הסרת התמונה
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button disabled={pending} className={`${btnPrimary} flex-1`}>{pending ? "שומר…" : "שמירה"}</button>
        <Link href="/admin/menu" className={btnGhost}>ביטול</Link>
      </div>

      {dish && (
        <button
          type="button"
          disabled={pending}
          className="text-sm text-red-700 underline"
          onClick={() => {
            if (confirm(`למחוק את "${dish.name}" מהתפריט?`)) start(() => deleteDish(dish.id));
          }}
        >
          מחיקת המנה
        </button>
      )}
    </form>
  );
}
