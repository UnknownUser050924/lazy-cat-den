import { consoleState } from "@/lib/games";
import type { Memory, Room } from "@/lib/types";

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

export function activityHref(roomId: string, memory: Memory) {
  const place = memory.place ?? "";
  const base = `/room/${encodeURIComponent(roomId)}`;
  return place ? `${base}/${place}` : `${base}#notes`;
}

export function navHints(room: Room, selfName: string) {
  const game = consoleState(room, selfName);
  return {
    qa: (room.questions ?? []).some((item) => !item.answer),
    games: game === "waiting" || game === "active",
    letter: (room.letters ?? []).some((letter) => letter.from !== selfName && letter.openedBy !== selfName),
  };
}
