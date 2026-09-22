import { DAILY_PROMPTS, ONLINE_MS } from "./constants";
import type { Member, Room } from "./types";

export function isNight(date = new Date()) {
  const hour = date.getHours();
  return hour >= 19 || hour < 6;
}

export function isHere(member: Member, now = Date.now()) {
  return now - member.lastSeen < ONLINE_MS;
}

export function togetherStreak(members: Member[]) {
  if (members.length < 2) return 0;
  const sets = members.map((member) => new Set(member.visitDays ?? []));
  const cursor = new Date();
  let streak = 0;
  for (let i = 0; i < 366; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    const shared = sets.every((days) => days.has(key));
    if (shared) streak += 1;
    else if (i > 0) break;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function promptForDate(date: string) {
  const index = Math.abs(Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000)) % DAILY_PROMPTS.length;
  return DAILY_PROMPTS[index];
}

export function catSpeech(room: Room, night: boolean) {
  const now = Date.now();
  const online = room.members.filter((member) => isHere(member, now));
  const unread = room.letters.some((letter) => !letter.openedAt);
  if (unread) return { zh: "发现了一张纸条！", en: "There's a letter." };
  if (online.length >= 2) return { zh: "你们两个都在！", en: "You're both here." };
  if (online.length === 1) {
    return { zh: `${online[0].displayName}来过啦！`, en: `${online[0].displayName} is here.` };
  }
  const away = [...room.members].sort((a, b) => a.lastSeen - b.lastSeen)[0];
  if (away) {
    return {
      zh: `${away.displayName}今天怎么还没来……`,
      en: `Still waiting for ${away.displayName}.`,
    };
  }
  return night
    ? { zh: "小屋好安静……", en: "The den is quiet." }
    : { zh: "小屋好安静……", en: "The den is so quiet." };
}
