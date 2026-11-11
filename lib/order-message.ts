import { formatDay, money } from "./format";
import type { Order } from "./data";

export function orderMessage(order: Order, kind: "new" | "updated" | "cancelled", url: string) {
  const title =
    kind === "cancelled"
      ? `ביטול הזמנה #${order.id}`
      : kind === "updated"
        ? `עדכון הזמנה #${order.id}`
        : `הזמנה חדשה #${order.id}`;
  const lines = [title, `שם: ${order.name}`, `טלפון: ${order.phone}`];
  if (kind !== "cancelled") {
    lines.push("");
    for (const i of order.items) lines.push(`• ${i.qty} × ${i.name}`);
    lines.push("", `סה״כ: ${money(order.subtotal)}`);
    const when = `${formatDay(order.date)} בשעה ${order.time}`;
    if (order.method === "pickup") lines.push(`איסוף עצמי: ${when}`);
    else lines.push(`משלוח: ${when}`, `כתובת: ${order.address}`);
    if (order.note) lines.push(`הערה: ${order.note}`);
  }
  lines.push("", url);
  return lines.join("\n");
}
