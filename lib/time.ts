export const COTTAGE_TZ = "Asia/Kuala_Lumpur";
const OFFSET = "+08:00";

function parts(now: number) {
  const map: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-GB", {
    timeZone: COTTAGE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now))) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  if (map.hour === "24") map.hour = "00";
  return map;
}

export function asTime(now: number | Date = Date.now()) {
  return now instanceof Date ? now.getTime() : now;
}

export function dateKey(now: number | Date = Date.now()) {
  const part = parts(asTime(now));
  return `${part.year}-${part.month}-${part.day}`;
}

export function hourInCottage(now: number | Date = Date.now()) {
  return Number(parts(asTime(now)).hour);
}

export function clockLabel(now: number | Date = Date.now()) {
  const part = parts(asTime(now));
  return `${part.hour.padStart(2, "0")}:${part.minute.padStart(2, "0")}`;
}

export function dateLabel(now: number | Date = Date.now()) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: COTTAGE_TZ,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(asTime(now)));
}

export function shiftDateKey(key: string, days: number) {
  return dateKey(Date.parse(`${key}T12:00:00${OFFSET}`) + days * 86_400_000);
}

export function daysBetweenKeys(from: number, to: number) {
  const start = Date.parse(`${dateKey(from)}T12:00:00${OFFSET}`);
  const end = Date.parse(`${dateKey(to)}T12:00:00${OFFSET}`);
  return Math.round((end - start) / 86_400_000);
}
