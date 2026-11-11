export const TZ = "Europe/Prague";

export function money(n: number) {
  // The left-to-right mark keeps "149 Kč" in that order inside Hebrew text.
  return `\u200E${n.toLocaleString("en-US")} Kč`;
}

export function formatDay(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TZ,
  }).format(d);
}

/** Turns a phone number as typed into the digits wa.me expects. */
export function whatsappDigits(phone: string) {
  const raw = phone.trim();
  let d = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return d;
  if (d.startsWith("00")) return d.slice(2);
  if (d.length === 9) return `420${d}`; // Czech local number
  if (d.length === 10 && d.startsWith("0")) return `972${d.slice(1)}`; // Israeli local number
  return d;
}

export function whatsappLink(phone: string, text?: string) {
  const base = `https://wa.me/${whatsappDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
