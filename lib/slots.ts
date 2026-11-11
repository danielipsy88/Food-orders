import { TZ, formatDay } from "./format";

export type DaySlots = { date: string; label: string; times: string[] };

type SlotSettings = {
  open_hour: number;
  close_hour: number;
  lead_minutes: number;
  pickup_days: number[];
};

const STEP = 30;
const DAYS_AHEAD = 14;

/** Pickup / delivery times a customer may choose right now, in Prague time. */
export function getSlots(s: SlotSettings, now = new Date()): DaySlots[] {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((x) => [x.type, Number(x.value)]),
  );
  const today = Date.UTC(p.year, p.month - 1, p.day);
  const nowMinutes = p.hour * 60 + p.minute;

  const days: DaySlots[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date(today + i * 86400000);
    if (!s.pickup_days.includes(day.getUTCDay())) continue;
    const times: string[] = [];
    for (let m = s.open_hour * 60; m <= s.close_hour * 60; m += STEP) {
      if (i * 1440 + m - nowMinutes >= s.lead_minutes) {
        times.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
      }
    }
    if (!times.length) continue;
    const date = day.toISOString().slice(0, 10);
    const prefix = i === 0 ? "היום, " : i === 1 ? "מחר, " : "";
    days.push({ date, label: prefix + formatDay(date), times });
  }
  return days;
}

export function isValidSlot(slots: DaySlots[], date: string, time: string) {
  return slots.some((d) => d.date === date && d.times.includes(time));
}
