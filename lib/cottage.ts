import { COUPLE_STATUSES, DAILY_PROMPTS, FEELINGS, GIFT_KINDS, ONLINE_MS } from "./constants";
import { dateKey, hourInCottage, shiftDateKey } from "./time";
import type { Member, Room } from "./types";

export type Sky = "day" | "evening" | "night";
export type CatSpot = "window" | "center" | "person" | "sleep";
export type CatPose = "idle" | "happy" | "sleepy" | "playing" | "eating" | "window" | "surprised";

export function skyPhase(now: number | Date = Date.now()): Sky {
  const hour = hourInCottage(now);
  if (hour >= 19 || hour < 6) return "night";
  if (hour >= 17) return "evening";
  return "day";
}

export function isNight(now: number | Date = Date.now()) {
  return skyPhase(now) === "night";
}

const WEEK_MS = 7 * 24 * 60 * 1000;

export function isHere(member: Member, now = Date.now()) {
  return now - member.lastSeen < ONLINE_MS;
}

export function presenceLabel(member: Member, selfName: string, now = Date.now()) {
  const today = dateKey(now);
  if (member.displayName === selfName || isHere(member, now)) return "在这儿";
  if ((member.visitDays ?? []).includes(today)) return "今天来过";
  if (member.lastSeen > 0 && now - member.lastSeen < WEEK_MS) return "最近来过";
  return "有一阵没来";
}

export function hereNow(members: Member[], selfName = "", now = Date.now()) {
  return members.filter((member) => member.displayName === selfName || isHere(member, now));
}

export function visitedToday(members: Member[], selfName = "", now = Date.now()) {
  const today = dateKey(now);
  const present = new Set(hereNow(members, selfName, now).map((member) => member.displayName));
  return members.filter((member) => !present.has(member.displayName) && (member.visitDays ?? []).includes(today));
}

export function peopleLine(members: Member[], selfName = "", now = Date.now()) {
  const here = hereNow(members, selfName, now);
  const today = visitedToday(members, selfName, now);
  const parts: string[] = [];
  if (here.length) parts.push(`在这儿 ${here.map((member) => member.displayName).join("、")}`);
  if (today.length) parts.push(`今天来过 ${today.map((member) => member.displayName).join("、")}`);
  if (!parts.length) {
    if (members.length <= 1) return "这间小屋还可以邀请别人";
    return `${members.length} 个人的小屋`;
  }
  return parts.join(" · ");
}

export function cottageHeadline(members: Member[], streak: number, now = Date.now()) {
  const here = members.filter((member) => isHere(member, now));
  if (here.length >= 3) return `现在 ${here.length} 个人在这儿`;
  if (here.length === 2) return `${here[0].displayName}和${here[1].displayName}在这儿`;
  if (members.length <= 1) return "还是一个人的小屋";
  if (streak > 0) return `一起 ${streak} 天`;
  if (members.length === 2) return "两个人的小屋";
  return `${members.length} 个人的小屋`;
}

export function feelingOf(statusId: string | null) {
  if (!statusId) return null;
  return (
    FEELINGS.find((item) => item.id === statusId) ??
    COUPLE_STATUSES.find((item) => item.id === statusId) ??
    null
  );
}

export function togetherStreak(members: Member[], now = Date.now()) {
  const group = members.filter((member) => now - member.lastSeen < WEEK_MS);
  if (group.length < 2) return 0;
  const sets = group.map((member) => new Set(member.visitDays ?? []));
  let key = dateKey(now);
  let streak = 0;
  for (let i = 0; i < 366; i += 1) {
    const shared = sets.every((days) => days.has(key));
    if (shared) streak += 1;
    else if (i > 0) break;
    key = shiftDateKey(key, -1);
  }
  return streak;
}

export function promptForDate(date: string) {
  const index = Math.abs(Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000)) % DAILY_PROMPTS.length;
  return DAILY_PROMPTS[index];
}

export function othersOf(room: Room, selfName: string) {
  return room.members
    .filter((member) => member.displayName !== selfName)
    .sort((a, b) => b.lastSeen - a.lastSeen);
}

export function partnerOf(room: Room, selfName: string) {
  return othersOf(room, selfName)[0] ?? null;
}

export function momentText(member: Member) {
  const profile = member.profile;
  return profile.thinking?.trim() || profile.need?.trim() || profile.want?.trim() || "";
}

export function catPose(room: Room, sky: Sky, now = Date.now()): CatPose {
  const gift = room.gifts?.[0];
  if (gift && now - gift.createdAt < 12_000) return "surprised";
  if (room.cat.lastPat > 0 && now - room.cat.lastPat < 20_000) return "happy";
  const memory = room.memories?.[0];
  if (memory?.kind === "wish-done" && now - memory.createdAt < 60_000) return "happy";
  if (room.cat.mood >= 85) return "happy";
  if (sky === "night" || room.cat.mood < 40) return "sleepy";
  if (sky === "evening") return "window";
  if (room.cat.mood >= 70) return "happy";
  return "idle";
}

export function catSpot(room: Room, sky: Sky, now = Date.now()): CatSpot {
  if (sky === "night" || room.cat.mood < 40) return "sleep";
  const online = room.members.filter((member) => isHere(member, now));
  if (online.length >= 2) return "person";
  if (online.length === 1) return "center";
  return "window";
}

export function catSpeech(room: Room, sky: Sky, viewer = "", now = Date.now()) {
  const online = room.members.filter((member) => isHere(member, now));
  if (now - room.cat.lastPat < 25_000 && room.cat.lastPat > 0) {
    return { zh: "嘿嘿。", en: "Hehe." };
  }
  const gift = room.gifts?.[0];
  const romantic = new Set(["kiss", "hug", "cuddle", "hand"]);
  if (gift && romantic.has(gift.kind) && now - gift.createdAt < 90_000) {
    return { zh: "嗯？我是不是打扰到你们了。", en: "Am I interrupting?" };
  }
  const memory = room.memories?.[0];
  if (memory?.kind === "wish-done" && now - memory.createdAt < 90_000) {
    return { zh: "又完成一个愿望！", en: "Another wish came true." };
  }
  const unread = room.letters.find((letter) => !letter.openedAt && letter.from !== viewer);
  if (unread) return { zh: "有一封信在等你…", en: "A letter is waiting." };
  if (online.length >= 3) {
    const names = online.map((member) => member.displayName).join("、");
    return { zh: `${names}都在这儿`, en: "The cottage is busy." };
  }
  if (online.length === 2) {
    return {
      zh: `${online[0].displayName}和${online[1].displayName}都在这儿`,
      en: "Two people are here.",
    };
  }
  if (online.length === 1) {
    return { zh: `呀！${online[0].displayName}来了 ♡`, en: `${online[0].displayName} is here.` };
  }
  if (sky === "night") return { zh: "小屋里好安静…还不睡吗？", en: "Still awake?" };
  return { zh: "今天的小屋好安静…", en: "The cottage is quiet today." };
}

export function tinyMoments(room: Room, viewer: string, now = Date.now()) {
  const today = dateKey(now);
  const lines: string[] = [];
  const streak = togetherStreak(room.members, now);
  if (streak >= 2) lines.push(`你们已经连续一起回来 ${streak} 天啦`);
  const patsToday = (room.pats ?? []).filter((pat) => dateKey(pat.at) === today).length;
  if (patsToday >= 3) lines.push(`猫猫今天被摸了 ${patsToday} 次`);
  const done = room.wishlist.filter((wish) => wish.done).length;
  if (done > 0) lines.push(`你们完成了 ${done} 个愿望`);
  const visited = room.members.filter((member) => (member.visitDays ?? []).includes(today));
  if (visited.length >= 3) lines.push(`今天 ${visited.length} 个人都来过`);
  else if (visited.length === 2) lines.push(`今天 ${visited[0].displayName}和${visited[1].displayName}都来过`);
  return lines.slice(0, 2);
}

export function roomDecor(room: Room) {
  const done = room.wishlist.filter((wish) => wish.done).length;
  return {
    toy: (room.pats ?? []).length >= 5,
    flower: done >= 1,
    seal: room.letters.some((letter) => letter.openedAt),
    star: togetherStreak(room.members) >= 3,
  };
}

export function closerSentLine(kind: string, target: string, note?: string) {
  if (kind === "hug") return `你抱了${target}一下`;
  if (kind === "kiss") return `你亲了${target}一下`;
  if (kind === "hand") return `你牵了${target}的手`;
  if (kind === "cuddle") return `你贴了贴${target}`;
  if (kind === "flower") return `你送了${target}一朵花`;
  if (kind === "cookie") return `你给了${target}一块饼干`;
  if (kind === "note") return note?.trim() ? `你对${target}留了句话` : `你对${target}留了句话`;
  return `你靠近了${target}一下`;
}

export function closerReceivedLine(kind: string, from: string, note?: string) {
  if (kind === "hug") return `${from}抱了你一下`;
  if (kind === "kiss") return `${from}亲了你一下`;
  if (kind === "hand") return `${from}牵了你的手`;
  if (kind === "cuddle") return `${from}贴了贴你`;
  if (kind === "flower") return `${from}送了你一朵花`;
  if (kind === "cookie") return `${from}给了你一块饼干`;
  if (kind === "note") return note?.trim() ? `${from}对你说：${note.trim()}` : `${from}给你留了句话`;
  return `${from}靠近了你一下`;
}

export function closerLine(kind: string, note?: string, target = "你") {
  if (kind === "note" && note?.trim()) return `留了句话：${note.trim()}`;
  return closerSentLine(kind, target, note).replace(/^你/, "");
}
