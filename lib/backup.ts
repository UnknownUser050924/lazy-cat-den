import type { Member, Room } from "./types";

const PREFIX = "lazy-cat-den-room:";

export function readBackup(roomId: string): Room | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + roomId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Room;
    if (!parsed || parsed.id !== roomId || !Array.isArray(parsed.members)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBackup(room: Room) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + room.id, JSON.stringify(room));
  } catch {
    // The phone can refuse a huge backup. The server copy still exists.
  }
}

function idsMissing(local: { id?: string }[] | undefined, server: { id?: string }[] | undefined) {
  const have = new Set((server ?? []).map((item) => item.id));
  return (local ?? []).some((item) => item.id && !have.has(item.id));
}

function memberHasMore(local: Member, server: Member | undefined) {
  if (!server) return true;
  const pocket = local.profile?.pocket ?? {};
  for (const [key, value] of Object.entries(pocket)) {
    if (value?.trim() && !(server.profile?.pocket?.[key] ?? "").trim()) return true;
  }
  for (const item of local.profile?.knowMe ?? []) {
    const found = server.profile?.knowMe?.find((answer) => answer.promptId === item.promptId);
    if (item.answer?.trim() && found?.answer?.trim() !== item.answer.trim()) return true;
  }
  const text = (value: string | undefined) => value?.trim() ?? "";
  if (text(local.profile?.signature) && !text(server.profile?.signature)) return true;
  if (text(local.profile?.gender) && !text(server.profile?.gender)) return true;
  if (text(local.profile?.thinking) && !text(server.profile?.thinking)) return true;
  if (text(local.profile?.need) && !text(server.profile?.need)) return true;
  if (text(local.profile?.want) && !text(server.profile?.want)) return true;
  if (text(local.profile?.formId) && local.profile.formId !== "sleepy" && server.profile?.formId === "sleepy") return true;
  if (text(local.profile?.wall) && local.profile.wall !== "cozy" && (!server.profile?.wall || server.profile.wall === "cozy")) {
    return true;
  }
  if ((local.profile?.vibes?.length ?? 0) > (server.profile?.vibes?.length ?? 0)) return true;
  if ((local.profile?.objects?.length ?? 0) > (server.profile?.objects?.length ?? 0)) return true;
  if ((local.profile?.guesses?.length ?? 0) > (server.profile?.guesses?.length ?? 0)) return true;
  if (local.statusId && !server.statusId) return true;
  if ((local.visitDays?.length ?? 0) > (server.visitDays?.length ?? 0)) return true;
  return false;
}

export function backupHasMore(local: Room, server: Room) {
  if (local.id !== server.id) return false;
  if ((local.members ?? []).some((member) => memberHasMore(member, server.members?.find((item) => item.displayName === member.displayName)))) {
    return true;
  }
  if (idsMissing(local.questions, server.questions)) return true;
  if (idsMissing(local.wishlist, server.wishlist)) return true;
  if (idsMissing(local.notes, server.notes)) return true;
  if (idsMissing(local.messages, server.messages)) return true;
  if (idsMissing(local.draws, server.draws)) return true;
  if (idsMissing(local.letters, server.letters)) return true;
  if (idsMissing(local.events, server.events)) return true;
  if (idsMissing(local.gifts, server.gifts)) return true;
  if (idsMissing(local.memories, server.memories)) return true;
  if (idsMissing(local.pats, server.pats)) return true;
  for (const day of local.daily ?? []) {
    const other = server.daily?.find((item) => item.date === day.date);
    if (!other) return true;
    if ((day.answers ?? []).some((answer) => !other.answers?.some((item) => item.name === answer.name && item.text === answer.text))) {
      return true;
    }
  }
  if ((local.questions ?? []).some((item) => item.answer && !server.questions?.find((question) => question.id === item.id)?.answer)) {
    return true;
  }
  if ((local.wishlist ?? []).some((item) => item.done && server.wishlist?.find((wish) => wish.id === item.id)?.done === false)) {
    return true;
  }
  if ((local.letters ?? []).some((item) => item.openedAt && !server.letters?.find((letter) => letter.id === item.id)?.openedAt)) {
    return true;
  }
  if ((local.cat?.mood ?? 0) > (server.cat?.mood ?? 0)) return true;
  if ((local.cat?.lastPat ?? 0) > (server.cat?.lastPat ?? 0)) return true;
  if ((local.cat?.lastToy ?? 0) > (server.cat?.lastToy ?? 0)) return true;
  if ((local.cat?.lastFeed ?? 0) > (server.cat?.lastFeed ?? 0)) return true;
  if ((local.cat?.lastCheckin ?? 0) > (server.cat?.lastCheckin ?? 0)) return true;
  if ((local.members ?? []).some((member) => !(server.members ?? []).some((item) => item.displayName === member.displayName))) {
    return true;
  }
  if (local.games?.active && (!server.games?.active || (local.games.active.updatedAt ?? 0) > (server.games.active.updatedAt ?? 0))) {
    return true;
  }
  if (idsMissing(local.games?.recent, server.games?.recent)) return true;
  return false;
}
