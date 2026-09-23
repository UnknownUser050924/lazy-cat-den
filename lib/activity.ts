import { consoleState } from "./games";
import type { Memory, Room } from "./types";

const PUBLIC_KINDS = new Set([
  "joined",
  "note",
  "first-note",
  "question",
  "first-question",
  "answer",
  "first-answer",
  "pat",
  "cat-100",
  "draw",
  "first-draw",
  "wish",
  "wish-done",
  "game",
]);

export function publicActivity(room: Room, limit = 5): Memory[] {
  const seen = new Set<string>();
  const out: Memory[] = [];
  for (const item of room.memories ?? []) {
    if (!PUBLIC_KINDS.has(item.kind)) continue;
    if (item.kind === "pat") {
      const key = `${item.actor}:${item.titleZh}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function activityHref(roomId: string, memory: Memory): string | null {
  const base = `/room/${encodeURIComponent(roomId)}`;
  if (memory.kind === "joined") {
    return memory.actor ? `${base}/corner?who=${encodeURIComponent(memory.actor)}` : `${base}/corner`;
  }
  if (memory.kind === "note" || memory.kind === "first-note") return `${base}#notes`;
  if (memory.kind === "pat" || memory.kind === "cat-100") return `${base}/cat`;
  if (memory.kind === "question" || memory.kind === "first-question" || memory.kind === "answer" || memory.kind === "first-answer") {
    return `${base}/qa`;
  }
  if (memory.kind === "draw" || memory.kind === "first-draw") return `${base}/draw`;
  if (memory.kind === "wish" || memory.kind === "wish-done") return `${base}/wishlist`;
  if (memory.kind === "game") return `${base}/games`;
  if (memory.kind === "chat" || memory.kind === "first-chat") return `${base}/chat`;
  if (memory.kind === "today") return `${base}/today`;
  if (memory.kind === "event") return `${base}/calendar`;
  if (memory.place) return `${base}/${memory.place}`;
  return null;
}

export function unreadLetterCount(room: Room, selfName: string) {
  return (room.letters ?? []).filter((letter) => letter.from !== selfName && !letter.openedAt).length;
}

export function navHints(room: Room, selfName: string) {
  const game = consoleState(room, selfName);
  const letterCount = unreadLetterCount(room, selfName);
  return {
    qa: (room.questions ?? []).some((item) => !item.answer),
    games: game === "waiting" || game === "active",
    letter: letterCount > 0,
    letterCount,
  };
}
