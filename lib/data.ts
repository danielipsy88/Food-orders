import { sql } from "./db";
import { TZ } from "./format";

export type Settings = {
  business_name: string;
  is_open: boolean;
  closed_message: string;
  admin_whatsapp: string;
  pickup_address: string;
  open_hour: number;
  close_hour: number;
  lead_minutes: number;
  edit_window_hours: number;
};

export type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  visible: boolean;
  has_image: boolean;
  v: number;
};

export type OrderItem = { dish_id: number; name: string; price: number; qty: number };

export type Order = {
  id: number;
  token: string;
  name: string;
  phone: string;
  note: string;
  method: "pickup" | "delivery";
  address: string;
  status: "new" | "done" | "cancelled";
  delivery_fee: number | null;
  created_at: Date;
  editable_until: Date;
  editable: boolean;
  date: string;
  time: string;
  items: OrderItem[];
  subtotal: number;
};

export async function getSettings() {
  const [s] = await sql`select * from settings where id = 1`;
  return s as unknown as Settings;
}

export async function getDishes(includeHidden = false) {
  const rows = await sql`
    select id, name, description, price, visible,
           (image is not null) as has_image,
           extract(epoch from updated_at)::int as v
    from dishes
    where deleted_at is null ${includeHidden ? sql`` : sql`and visible`}
    order by sort, id`;
  return rows as unknown as Dish[];
}

export async function getDish(id: number) {
  const [row] = await sql`
    select id, name, description, price, visible,
           (image is not null) as has_image,
           extract(epoch from updated_at)::int as v
    from dishes where id = ${id} and deleted_at is null`;
  return row as unknown as Dish | undefined;
}

const orderSelect = () => sql`
  select o.id, o.token, o.name, o.phone, o.note, o.method, o.address, o.status,
         o.delivery_fee, o.created_at,
         o.created_at + make_interval(hours => s.edit_window_hours) as editable_until,
         (o.status = 'new'
            and now() < o.created_at + make_interval(hours => s.edit_window_hours)
            and now() < o.scheduled_at) as editable,
         to_char(o.scheduled_at at time zone ${TZ}, 'YYYY-MM-DD') as date,
         to_char(o.scheduled_at at time zone ${TZ}, 'HH24:MI') as time,
         coalesce(i.items, '[]'::json) as items,
         coalesce(i.subtotal, 0)::int as subtotal
  from orders o
  cross join settings s
  left join lateral (
    select json_agg(json_build_object('dish_id', dish_id, 'name', dish_name,
                                      'price', unit_price, 'qty', qty) order by id) as items,
           sum(unit_price * qty) as subtotal
    from order_items where order_id = o.id
  ) i on true`;

export async function getOrderByToken(token: string) {
  const [row] = await sql`${orderSelect()} where o.token = ${token}`;
  return row as unknown as Order | undefined;
}

export async function getOrders(status: string) {
  const filter =
    status === "all" ? sql`` : sql`where o.status = ${status}`;
  const order = status === "new" ? sql`o.scheduled_at asc` : sql`o.scheduled_at desc`;
  const rows = await sql`${orderSelect()} ${filter} order by ${order}, o.id limit 300`;
  return rows as unknown as Order[];
}

export async function getOrderCounts() {
  const rows = await sql`select status, count(*)::int as count from orders group by status`;
  const counts: Record<string, number> = { new: 0, done: 0, cancelled: 0 };
  for (const r of rows) counts[r.status] = r.count;
  return counts;
}

export type SummaryRow = { date: string; name: string; qty: number };

/** How many of each dish to prepare, per day, for orders that are still open. */
export async function getPrepSummary() {
  const rows = await sql`
    select to_char(o.scheduled_at at time zone ${TZ}, 'YYYY-MM-DD') as date,
           i.dish_name as name, sum(i.qty)::int as qty
    from orders o join order_items i on i.order_id = o.id
    where o.status = 'new'
    group by 1, 2
    order by 1, 2`;
  return rows as unknown as SummaryRow[];
}
