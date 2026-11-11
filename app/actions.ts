"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { TZ } from "@/lib/format";
import { getOrderByToken, getSettings } from "@/lib/data";
import { getSlots, isValidSlot } from "@/lib/slots";

export type OrderInput = {
  items: { dishId: number; qty: number }[];
  name: string;
  phone: string;
  note: string;
  method: "pickup" | "delivery";
  address: string;
  date: string;
  time: string;
};

type Result = { ok: true; token: string } | { ok: false; error: string };

const MAX_QTY = 50;

type Clean = Omit<OrderInput, "items"> & {
  items: { dishId: number; name: string; price: number; qty: number }[];
};

async function validate(input: OrderInput): Promise<{ error: string } | { clean: Clean }> {
  const name = String(input.name ?? "").trim().slice(0, 80);
  const phone = String(input.phone ?? "").trim().slice(0, 30);
  const note = String(input.note ?? "").trim().slice(0, 500);
  const address = String(input.address ?? "").trim().slice(0, 200);
  const method = input.method === "delivery" ? "delivery" : "pickup";

  if (name.length < 2) return { error: "נא למלא שם מלא" };
  if (phone.replace(/\D/g, "").length < 7) return { error: "נא למלא מספר טלפון תקין" };
  if (method === "delivery" && address.length < 5) return { error: "נא למלא כתובת למשלוח" };

  const wanted = new Map<number, number>();
  for (const i of Array.isArray(input.items) ? input.items : []) {
    const id = Number(i.dishId);
    const qty = Number(i.qty);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1) continue;
    if (qty > MAX_QTY) return { error: `אפשר להזמין עד ${MAX_QTY} יחידות מכל מנה` };
    wanted.set(id, qty);
  }
  if (!wanted.size) return { error: "לא נבחרו מנות" };

  const settings = await getSettings();
  if (!isValidSlot(getSlots(settings), String(input.date), String(input.time))) {
    return { error: "המועד שנבחר כבר לא זמין, נא לבחור מועד אחר" };
  }

  // Prices always come from the database, never from the browser.
  const dishes = await sql`
    select id, name, price from dishes
    where id in ${sql([...wanted.keys()])} and visible and deleted_at is null`;
  if (dishes.length !== wanted.size) {
    return { error: "אחת המנות כבר לא זמינה. נא לרענן את העמוד ולבחור מחדש" };
  }

  return {
    clean: {
      name,
      phone,
      note,
      address: method === "delivery" ? address : "",
      method,
      date: input.date,
      time: input.time,
      items: dishes.map((d) => ({
        dishId: d.id as number,
        name: d.name as string,
        price: d.price as number,
        qty: wanted.get(d.id)!,
      })),
    },
  };
}

const scheduledAt = (c: Clean) =>
  sql`(${`${c.date} ${c.time}`}::timestamp at time zone ${TZ})`;

export async function placeOrder(input: OrderInput): Promise<Result> {
  const settings = await getSettings();
  if (!settings.is_open) return { ok: false, error: settings.closed_message };

  const v = await validate(input);
  if ("error" in v) return { ok: false, error: v.error };
  const c = v.clean;
  const token = crypto.randomBytes(16).toString("base64url");

  await sql.begin(async (tx) => {
    const [order] = await tx`
      insert into orders (token, name, phone, note, method, address, scheduled_at)
      values (${token}, ${c.name}, ${c.phone}, ${c.note}, ${c.method}, ${c.address}, ${scheduledAt(c)})
      returning id`;
    for (const i of c.items) {
      await tx`
        insert into order_items (order_id, dish_id, dish_name, unit_price, qty)
        values (${order.id}, ${i.dishId}, ${i.name}, ${i.price}, ${i.qty})`;
    }
  });

  revalidatePath("/admin", "layout");
  return { ok: true, token };
}

export async function updateOrder(token: string, input: OrderInput): Promise<Result> {
  const existing = await getOrderByToken(String(token));
  if (!existing) return { ok: false, error: "ההזמנה לא נמצאה" };
  if (!existing.editable) return { ok: false, error: "כבר אי אפשר לשנות את ההזמנה הזו" };

  const v = await validate(input);
  if ("error" in v) return { ok: false, error: v.error };
  const c = v.clean;

  await sql.begin(async (tx) => {
    // A changed address or method makes the old delivery fee meaningless.
    const keepFee = c.method === "delivery" && c.address === existing.address;
    await tx`
      update orders set name = ${c.name}, phone = ${c.phone}, note = ${c.note},
        method = ${c.method}, address = ${c.address}, scheduled_at = ${scheduledAt(c)},
        delivery_fee = ${keepFee ? existing.delivery_fee : null}, updated_at = now()
      where id = ${existing.id}`;
    await tx`delete from order_items where order_id = ${existing.id}`;
    for (const i of c.items) {
      await tx`
        insert into order_items (order_id, dish_id, dish_name, unit_price, qty)
        values (${existing.id}, ${i.dishId}, ${i.name}, ${i.price}, ${i.qty})`;
    }
  });

  revalidatePath("/admin", "layout");
  return { ok: true, token: existing.token };
}

export async function cancelOrder(token: string): Promise<Result> {
  const existing = await getOrderByToken(String(token));
  if (!existing) return { ok: false, error: "ההזמנה לא נמצאה" };
  if (!existing.editable) return { ok: false, error: "כבר אי אפשר לבטל את ההזמנה הזו" };
  await sql`update orders set status = 'cancelled', updated_at = now() where id = ${existing.id}`;
  revalidatePath("/admin", "layout");
  return { ok: true, token: existing.token };
}
