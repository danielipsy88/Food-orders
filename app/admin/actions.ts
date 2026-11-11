"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  await new Promise((r) => setTimeout(r, 600)); // slows down password guessing
  if (!checkPassword(String(form.get("password") ?? ""))) return "סיסמה שגויה";
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function setOrderStatus(id: number, status: "new" | "done" | "cancelled") {
  await requireAdmin();
  await sql`update orders set status = ${status}, updated_at = now() where id = ${id}`;
  revalidatePath("/admin", "layout");
}

export async function setDeliveryFee(id: number, form: FormData) {
  await requireAdmin();
  const raw = String(form.get("fee") ?? "").trim();
  const fee = raw === "" ? null : Math.round(Number(raw));
  if (fee !== null && (!Number.isFinite(fee) || fee < 0 || fee > 100000)) return;
  await sql`update orders set delivery_fee = ${fee}, updated_at = now() where id = ${id}`;
  revalidatePath("/admin", "layout");
}

export type DishInput = {
  id?: number;
  name: string;
  description: string;
  price: number;
  /** data URL of a new image, null to remove the image, undefined to keep it */
  image?: string | null;
};

export async function saveDish(input: DishInput): Promise<string | null> {
  await requireAdmin();
  const name = String(input.name ?? "").trim().slice(0, 80);
  const description = String(input.description ?? "").trim().slice(0, 400);
  const price = Math.round(Number(input.price));
  if (!name) return "נא למלא שם למנה";
  if (!Number.isFinite(price) || price < 0 || price > 100000) return "נא למלא מחיר תקין";

  let image: Buffer | null | undefined;
  if (input.image === null) image = null;
  else if (typeof input.image === "string") {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(input.image);
    if (!m) return "קובץ התמונה לא תקין";
    image = Buffer.from(m[1], "base64");
    if (image.length > 2_000_000) return "התמונה גדולה מדי";
  }

  if (input.id) {
    await sql`
      update dishes set name = ${name}, description = ${description}, price = ${price},
        updated_at = now() where id = ${input.id} and deleted_at is null`;
    if (image !== undefined) {
      await sql`update dishes set image = ${image}::bytea where id = ${input.id}`;
    }
  } else {
    await sql`
      insert into dishes (name, description, price, image, sort)
      values (${name}, ${description}, ${price}, ${image ?? null}::bytea,
              (select coalesce(max(sort), 0) + 1 from dishes))`;
  }
  revalidatePath("/", "layout");
  redirect("/admin/menu");
}

export async function setDishVisible(id: number, visible: boolean) {
  await requireAdmin();
  await sql`update dishes set visible = ${visible}, updated_at = now() where id = ${id}`;
  revalidatePath("/", "layout");
}

export async function deleteDish(id: number) {
  await requireAdmin();
  // Soft delete: past orders keep pointing at the dish.
  await sql`update dishes set deleted_at = now(), visible = false where id = ${id}`;
  revalidatePath("/", "layout");
  redirect("/admin/menu");
}

export async function setOpen(open: boolean) {
  await requireAdmin();
  await sql`update settings set is_open = ${open} where id = 1`;
  revalidatePath("/", "layout");
}

export async function saveSettings(_prev: string | null, form: FormData): Promise<string | null> {
  await requireAdmin();
  const text = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const int = (k: string) => Math.round(Number(form.get(k)));
  const open = int("open_hour");
  const close = int("close_hour");
  const lead = int("lead_minutes");
  const edit = int("edit_window_hours");
  const days = [...new Set(form.getAll("pickup_days").map(Number))].filter(
    (d) => Number.isInteger(d) && d >= 0 && d <= 6,
  );
  if (!days.length) return "נא לבחור לפחות יום אחד לאיסוף ומשלוחים";
  if (!(open >= 0 && close <= 24 && open < close)) return "שעות האיסוף לא תקינות";
  if (!(lead >= 0 && lead <= 7 * 24 * 60)) return "זמן ההכנה לא תקין";
  if (!(edit >= 0 && edit <= 24 * 14)) return "חלון השינויים לא תקין";
  if (!text("business_name", 60)) return "נא למלא שם לעסק";

  await sql`
    update settings set
      business_name = ${text("business_name", 60)},
      admin_whatsapp = ${text("admin_whatsapp", 30)},
      pickup_address = ${text("pickup_address", 200)},
      closed_message = ${text("closed_message", 300)},
      open_hour = ${open}, close_hour = ${close},
      lead_minutes = ${lead}, edit_window_hours = ${edit},
      pickup_days = ${`{${days.join(",")}}`}::int[]
    where id = 1`;
  revalidatePath("/", "layout");
  return "נשמר";
}
