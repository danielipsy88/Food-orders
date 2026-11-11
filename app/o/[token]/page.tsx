import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CancelButton from "@/components/CancelButton";
import { btnGhost, card } from "@/components/ui";
import { getOrderByToken, getSettings } from "@/lib/data";
import { formatDateTime, formatDay, money, whatsappLink } from "@/lib/format";
import { orderMessage } from "@/lib/order-message";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/o/[token]">) {
  const { token } = await params;
  const { s } = await searchParams;
  const [order, settings] = await Promise.all([getOrderByToken(token), getSettings()]);
  if (!order) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/o/${order.token}`;

  const cancelled = order.status === "cancelled";
  const kind = cancelled ? "cancelled" : s === "updated" ? "updated" : "new";
  const justActed = s === "new" || s === "updated" || s === "cancelled";
  const feeKnown = order.delivery_fee !== null;
  const total = order.subtotal + (order.delivery_fee ?? 0);
  const when = `${formatDay(order.date)} בשעה ${order.time}`;

  const heading = cancelled
    ? "ההזמנה בוטלה"
    : s === "updated"
      ? "ההזמנה עודכנה"
      : order.status === "done"
        ? "ההזמנה טופלה"
        : "ההזמנה התקבלה!";

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
      <header className="text-center">
        <p className="text-sm text-stone-500">{settings.business_name}</p>
        <h1 className={`text-2xl font-extrabold ${cancelled ? "text-stone-600" : "text-olive"}`}>
          {heading}
        </h1>
        <p className="mt-1 text-stone-600">הזמנה מספר #{order.id}</p>
      </header>

      {settings.admin_whatsapp && justActed && (
        <div className={`${card} border-green-600/40 bg-green-50 p-4 text-center`}>
          <p className="mb-3 font-medium">
            {cancelled
              ? "כדי שנדע על הביטול, נא לשלוח לנו הודעה:"
              : "שלב אחרון: שליחת ההזמנה אלינו בוואטסאפ"}
          </p>
          <a
            href={whatsappLink(settings.admin_whatsapp, orderMessage(order, kind, url))}
            target="_blank"
            rel="noopener"
            className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
          >
            שליחה בוואטסאפ
          </a>
        </div>
      )}

      <section className={`${card} p-4 ${cancelled ? "opacity-60" : ""}`}>
        <ul className="space-y-1.5">
          {order.items.map((i) => (
            <li key={i.dish_id} className="flex justify-between gap-3">
              <span>{i.qty} × {i.name}</span>
              <span className="shrink-0">{money(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-stone-200 pt-3">
          {order.method === "delivery" && (
            <div className="flex justify-between gap-3">
              <dt>משלוח</dt>
              <dd>{feeKnown ? money(order.delivery_fee!) : "יעודכן בהמשך"}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 text-lg font-bold">
            <dt>{order.method === "delivery" && !feeKnown ? "סה״כ לפני משלוח" : "סה״כ לתשלום"}</dt>
            <dd>{money(total)}</dd>
          </div>
        </dl>
      </section>

      <section className={`${card} space-y-2 p-4`}>
        <Row k={order.method === "pickup" ? "איסוף עצמי" : "משלוח"} v={when} />
        {order.method === "pickup"
          ? settings.pickup_address && <Row k="כתובת האיסוף" v={settings.pickup_address} />
          : <Row k="כתובת" v={order.address} />}
        <Row k="שם" v={order.name} />
        <Row k="טלפון" v={order.phone} ltr />
        {order.note && <Row k="הערות" v={order.note} />}
      </section>

      {order.editable ? (
        <section className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/o/${order.token}/edit`} className={btnGhost}>שינוי ההזמנה</Link>
            <CancelButton token={order.token} />
          </div>
          <p className="text-center text-sm text-stone-500">
            אפשר לשנות או לבטל עד {formatDateTime(order.editable_until)}
          </p>
        </section>
      ) : (
        !cancelled && order.status === "new" && (
          <p className="text-center text-sm text-stone-500">
            כבר אי אפשר לשנות את ההזמנה באתר. לכל שינוי נא לפנות אלינו ישירות.
          </p>
        )
      )}

      <p className="text-center text-sm text-stone-500">
        כדאי לשמור את הקישור לעמוד הזה כדי לחזור להזמנה.
      </p>
      {cancelled && (
        <p className="text-center">
          <Link href="/" className="font-medium text-brand underline">להזמנה חדשה</Link>
        </p>
      )}
    </main>
  );
}

function Row({ k, v, ltr }: { k: string; v: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-stone-500">{k}</span>
      <span className="text-end font-medium" dir={ltr ? "ltr" : "auto"}>{v}</span>
    </div>
  );
}
