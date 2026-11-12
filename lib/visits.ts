import crypto from "node:crypto";
import { headers } from "next/headers";
import { sql } from "./db";
import { isAdmin } from "./auth";
import { TZ } from "./format";

const BOTS = /bot|crawl|spider|preview|whatsapp|facebookexternalhit|telegram|slack|discord|curl|wget|headless|monitor|lighthouse|python|axios|node-fetch/i;

function countryFrom(h: Headers) {
  const direct = h.get("x-country") ?? h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry");
  if (direct && /^[A-Za-z]{2}$/.test(direct)) return direct.toUpperCase();
  const geo = h.get("x-nf-geo");
  if (geo) {
    for (const text of [geo, Buffer.from(geo, "base64").toString("utf8")]) {
      try {
        const code = JSON.parse(text)?.country?.code;
        if (typeof code === "string" && /^[A-Za-z]{2}$/.test(code)) return code.toUpperCase();
      } catch {
        // not this encoding
      }
    }
  }
  return "";
}

function sourceFrom(h: Headers, src: unknown) {
  if (typeof src === "string" && /^[A-Za-z0-9_-]{1,30}$/.test(src)) return src.toLowerCase();
  try {
    const ref = h.get("referer");
    if (!ref) return "";
    const host = new URL(ref).hostname.replace(/^www\./, "");
    const own = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0];
    return host === own ? "" : host.slice(0, 60);
  } catch {
    return "";
  }
}

/** Counts a visit to the ordering page. Never throws: statistics must not break the shop. */
export async function recordVisit(src: unknown) {
  try {
    const h = await headers();
    const agent = h.get("user-agent") ?? "";
    if (!agent || BOTS.test(agent)) return;
    if (await isAdmin()) return;

    const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
    const [{ day }] = await sql`select to_char(now() at time zone ${TZ}, 'YYYY-MM-DD') as day`;
    // A keyed hash that changes every day: enough to count distinct visitors, useless for tracking them.
    const visitor = crypto
      .createHmac("sha256", process.env.AUTH_SECRET ?? "")
      .update(`${day}|${ip}|${agent}`)
      .digest("hex")
      .slice(0, 16);

    await sql`
      insert into visits (day, visitor, source, country)
      values (${day}::date, ${visitor}, ${sourceFrom(h, src)}, ${countryFrom(h)})
      on conflict (day, visitor, source) do update set hits = visits.hits + 1`;
    if (Math.random() < 0.01) await sql`delete from visits where day < current_date - 120`;
  } catch (e) {
    console.error("recordVisit failed", e);
  }
}

export type DayStats = { day: string; hits: number; visitors: number; orders: number };

export async function getDailyStats(days = 14) {
  const rows = await sql`
    with d as (
      select generate_series((now() at time zone ${TZ})::date - ${days - 1}::int,
                             (now() at time zone ${TZ})::date, interval '1 day')::date as day
    )
    select to_char(d.day, 'YYYY-MM-DD') as day,
      coalesce((select sum(hits) from visits v where v.day = d.day), 0)::int as hits,
      (select count(distinct visitor) from visits v where v.day = d.day)::int as visitors,
      (select count(*) from orders o
        where (o.created_at at time zone ${TZ})::date = d.day and o.status <> 'cancelled')::int as orders
    from d order by d.day desc`;
  return rows as unknown as DayStats[];
}

export type Breakdown = { label: string; visitors: number };

export async function getBreakdown(column: "source" | "country", days = 30) {
  const rows = await sql`
    select ${sql(column)} as label, count(distinct (day, visitor))::int as visitors
    from visits where day > (now() at time zone ${TZ})::date - ${days}::int
    group by 1 order by 2 desc, 1 limit 15`;
  return rows as unknown as Breakdown[];
}
