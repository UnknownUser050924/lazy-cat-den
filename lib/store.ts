import { promises as fs } from "fs";
import path from "path";
import {
  CAT_FORMS,
  COUPLE_STATUSES,
  CORNER_OBJECTS,
  DRAW_JARS,
  DRAW_TYPES,
  EVENT_TYPES,
  FEELINGS,
  GENDERS,
  GIFT_KINDS,
  KNOW_PROMPTS,
  NOTE_COLORS,
  ONLINE_MS,
  PLAN_DRAWS,
  POCKET_KEYS,
  SWEET_DRAWS,
  TONIGHT_IDEAS,
  VIBES,
  WALLS,
  WHO_DRAWS,
  SEAT_CLEARED,
  SEAT_BANNED,
} from "./constants";
import { claimMatches, hashClaim, newClaim } from "./claim";
import { promptForDate } from "./cottage";
import { emptyGames, mergeGames, sanitizeGames } from "./games";
import { applyPlay, tickGames } from "./play";
import { isKeeper } from "./keepers";
import { isAvatarKind, isCharacterId, isEffectId, isFrameId, isThemeId } from "./look";
import { dateKey, daysBetweenKeys } from "./time";
import { emptyProfile } from "./profile";
import type { Member, Memory, Profile, Room, RoomAction } from "./types";

export type MemberAuth = { displayName?: string; claim?: string };

const NAME_TAKEN = "这个名字已经有人在用。用原来进过小屋的手机打开，或填进你保存的钥匙。";
const NEED_SESSION = "先走进小屋";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "rooms.json");

type GlobalStore = {
  rooms: Record<string, Room>;
  chain: Promise<unknown>;
};

function store(): GlobalStore {
  const g = globalThis as typeof globalThis & { __lazyCatDen?: GlobalStore };
  if (!g.__lazyCatDen) {
    g.__lazyCatDen = { rooms: {}, chain: Promise.resolve() };
  }
  return g.__lazyCatDen;
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const s = store();
  const run = s.chain.then(fn, fn);
  s.chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function todayKey(now = Date.now()) {
  return dateKey(now);
}

function daysBetween(from: number, to: number) {
  return Math.max(0, daysBetweenKeys(from, to));
}

function isRealName(name: string) {
  const clean = name.trim();
  if (!clean || clean.length > 24) return false;
  return !["unknown", "undefined", "null"].includes(clean.toLowerCase());
}

function cleanName(name: string) {
  const clean = name.trim().slice(0, 24);
  if (!isRealName(clean)) throw new Error("Write your own name");
  return clean;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyRoom(id: string): Room {
  const now = Date.now();
  return {
    id,
    createdAt: now,
    members: [],
    questions: [],
    wishlist: [],
    notes: [],
    messages: [],
    draws: [],
    letters: [],
    daily: [],
    events: [],
    gifts: [],
    memories: [],
    pats: [],
    games: emptyGames(),
    clearedSeats: [],
    banned: [],
    cat: {
      mood: 72,
      lastPat: 0,
      lastCheckin: now,
      decayAppliedOn: todayKey(now),
    },
  };
}

function cloneRoom(room: Room): Room {
  return JSON.parse(JSON.stringify(room)) as Room;
}

function mergeProfile(a: Profile, b: Profile, aNewer: boolean): Profile {
  const primary = aNewer ? a : b;
  const other = aNewer ? b : a;
  const guesses = new Map<string, Profile["guesses"][number]>();
  for (const guess of [...(other.guesses ?? []), ...(primary.guesses ?? [])]) {
    const key = `${guess.target}:${guess.promptId}`;
    const prev = guesses.get(key);
    if (!prev || (guess.at ?? 0) >= (prev.at ?? 0)) guesses.set(key, guess);
  }
  return {
    gender: primary.gender || other.gender,
    signature: primary.signature || other.signature,
    vibes: primary.vibes.length ? primary.vibes : other.vibes,
    formId: primary.formId && primary.formId !== "sleepy" ? primary.formId : other.formId || primary.formId,
    thinking: primary.thinking || other.thinking,
    need: primary.need || other.need,
    want: primary.want || other.want,
    pocket: mergePocket(primary.pocket, other.pocket),
    wall: primary.wall && primary.wall !== "cozy" ? primary.wall : other.wall || primary.wall,
    objects: primary.objects.length ? primary.objects : other.objects,
    knowMe: mergeKnow(primary.knowMe, other.knowMe),
    guesses: [...guesses.values()],
    characterId: aNewer ? primary.characterId : primary.characterId || other.characterId,
    avatarKind: aNewer ? primary.avatarKind : primary.avatarKind || other.avatarKind,
    avatarFile: aNewer ? primary.avatarFile : primary.avatarFile || other.avatarFile,
    frameId: aNewer ? primary.frameId : primary.frameId || other.frameId,
    themeId: aNewer ? primary.themeId : primary.themeId || other.themeId,
    effectId: aNewer ? primary.effectId : primary.effectId || other.effectId,
    bio: aNewer ? primary.bio : primary.bio || other.bio,
  };
}

function mergePocket(primary: Profile["pocket"], other: Profile["pocket"]) {
  const pocket: Record<string, string> = {};
  for (const [key, value] of Object.entries(other ?? {})) {
    if (value?.trim()) pocket[key] = value;
  }
  for (const [key, value] of Object.entries(primary ?? {})) {
    if (value?.trim()) pocket[key] = value;
  }
  return pocket;
}

function mergeKnow(primary: Profile["knowMe"], other: Profile["knowMe"]) {
  const map = new Map<string, Profile["knowMe"][number]>();
  for (const item of [...(other ?? []), ...(primary ?? [])]) {
    if (item?.answer?.trim()) map.set(item.promptId, { promptId: item.promptId, answer: item.answer });
  }
  return [...map.values()];
}

function mergeMembers(a: Member[], b: Member[]): Member[] {
  const map = new Map<string, Member>();
  for (const raw of [...a, ...b]) {
    const member = normalizeMember(raw);
    const prev = map.get(member.displayName);
    if (!prev) {
      map.set(member.displayName, member);
      continue;
    }
    const newer = member.lastSeen >= prev.lastSeen ? member : prev;
    const older = newer === member ? prev : member;
    map.set(member.displayName, {
      ...newer,
      visitDays: [...new Set([...prev.visitDays, ...member.visitDays])],
      profile: mergeProfile(newer.profile, older.profile, true),
      ...(prev.claimHash || member.claimHash ? { claimHash: prev.claimHash || member.claimHash } : {}),
    });
  }
  return [...map.values()].sort((x, y) => x.displayName.localeCompare(y.displayName, "zh"));
}

function normalizeMember(member: Partial<Member> & { displayName: string }): Member {
  const profile = { ...emptyProfile(), ...(member.profile ?? {}) };
  profile.vibes = profile.vibes ?? [];
  profile.objects = profile.objects ?? [];
  profile.knowMe = profile.knowMe ?? [];
  profile.guesses = profile.guesses ?? [];
  profile.pocket = profile.pocket ?? {};
  return {
    displayName: member.displayName,
    lastSeen: member.lastSeen ?? 0,
    statusId: member.statusId ?? null,
    visitDays: member.visitDays ?? [],
    profile,
    ...(member.claimHash ? { claimHash: member.claimHash } : {}),
  };
}

function normalizeRoom(room: Room): Room {
  room.members = (room.members ?? [])
    .filter((member) => member && isRealName(member.displayName ?? ""))
    .map((member) => normalizeMember(member));
  room.questions = room.questions ?? [];
  room.wishlist = room.wishlist ?? [];
  room.notes = room.notes ?? [];
  room.messages = room.messages ?? [];
  room.draws = room.draws ?? [];
  room.letters = room.letters ?? [];
  room.daily = room.daily ?? [];
  room.events = room.events ?? [];
  room.gifts = room.gifts ?? [];
  room.memories = room.memories ?? [];
  room.pats = room.pats ?? [];
  room.games = room.games ?? emptyGames();
  room.clearedSeats = [...new Set((room.clearedSeats ?? []).filter((name) => isRealName(name)))].slice(0, 48);
  room.banned = [...new Set((room.banned ?? []).filter((name) => isRealName(name)))].slice(0, 48);
  delete room.away;
  delete room.admin;
  delete room.claim;
  return room;
}

function mergeQuestions(a: Room["questions"], b: Room["questions"]) {
  const map = new Map<string, Room["questions"][number]>();
  for (const item of [...(a ?? []), ...(b ?? [])]) {
    const prev = map.get(item.id);
    if (!prev) map.set(item.id, item);
    else if (prev.answer && !item.answer) map.set(item.id, prev);
    else map.set(item.id, item.answer ? item : prev);
  }
  return [...map.values()].sort((x, y) => y.createdAt - x.createdAt);
}

function mergeLetters(a: Room["letters"], b: Room["letters"]) {
  const map = new Map<string, Room["letters"][number]>();
  for (const item of [...(a ?? []), ...(b ?? [])]) {
    const prev = map.get(item.id);
    if (!prev) map.set(item.id, item);
    else if (prev.openedAt && !item.openedAt) map.set(item.id, prev);
    else map.set(item.id, item.openedAt ? item : prev);
  }
  return [...map.values()].sort((x, y) => y.createdAt - x.createdAt);
}

function mergeWishes(a: Room["wishlist"], b: Room["wishlist"]) {
  const map = new Map<string, Room["wishlist"][number]>();
  for (const item of [...(a ?? []), ...(b ?? [])]) {
    const prev = map.get(item.id);
    if (!prev) map.set(item.id, item);
    else map.set(item.id, { ...item, done: prev.done || item.done });
  }
  return [...map.values()].sort((x, y) => y.createdAt - x.createdAt);
}

function mergeDaily(a: Room["daily"], b: Room["daily"]): Room["daily"] {
  const map = new Map<string, Room["daily"][number]>();
  for (const day of [...(a ?? []), ...(b ?? [])]) {
    const prev = map.get(day.date);
    if (!prev) {
      map.set(day.date, { ...day, answers: [...(day.answers ?? [])] });
      continue;
    }
    const answers = new Map(prev.answers.map((item) => [item.name, item]));
    for (const answer of day.answers ?? []) {
      const existing = answers.get(answer.name);
      if (!existing || answer.at >= existing.at) answers.set(answer.name, answer);
    }
    map.set(day.date, { date: day.date, promptId: day.promptId || prev.promptId, answers: [...answers.values()] });
  }
  return [...map.values()].sort((x, y) => y.date.localeCompare(x.date));
}

function mergeRooms(left: Room, right: Room): Room {
  const room = normalizeRoom(cloneRoom(right));
  const other = normalizeRoom(cloneRoom(left));
  room.clearedSeats = [...new Set([...(other.clearedSeats ?? []), ...(room.clearedSeats ?? [])])].slice(0, 48);
  room.members = mergeMembers(other.members, room.members);
  room.questions = mergeQuestions(other.questions, room.questions);
  room.wishlist = mergeWishes(other.wishlist, room.wishlist);
  room.notes = mergeById(other.notes ?? [], room.notes ?? []);
  room.messages = mergeById(other.messages ?? [], room.messages ?? []);
  room.draws = mergeById(other.draws ?? [], room.draws ?? []);
  room.letters = mergeLetters(other.letters, room.letters);
  room.events = mergeById(other.events ?? [], room.events ?? []);
  room.gifts = mergeById(other.gifts ?? [], room.gifts ?? []);
  room.memories = mergeById(other.memories ?? [], room.memories ?? []);
  room.pats = mergePats(other.pats, room.pats);
  room.daily = mergeDaily(other.daily ?? [], room.daily ?? []);
  room.games = mergeGames(other.games, room.games);
  room.cat.lastCheckin = Math.max(room.cat.lastCheckin, other.cat.lastCheckin);
  room.cat.lastPat = Math.max(room.cat.lastPat, other.cat.lastPat);
  room.cat.lastToy = Math.max(room.cat.lastToy ?? 0, other.cat.lastToy ?? 0);
  room.cat.lastFeed = Math.max(room.cat.lastFeed ?? 0, other.cat.lastFeed ?? 0);
  room.cat.mood = Math.max(room.cat.mood, other.cat.mood);
  return room;
}

function mergeById<T extends { id: string; createdAt: number }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of [...a, ...b]) map.set(item.id, item);
  return [...map.values()].sort((x, y) => y.createdAt - x.createdAt);
}

function mergePats(a: Room["pats"], b: Room["pats"]) {
  const map = new Map<string, Room["pats"][number]>();
  for (const item of [...(a ?? []), ...(b ?? [])]) map.set(item.id, item);
  return [...map.values()].sort((x, y) => y.at - x.at).slice(0, 40);
}

const MEMORY_PLACE: Record<string, string> = {
  joined: "",
  "first-question": "qa",
  question: "qa",
  "first-answer": "qa",
  answer: "qa",
  "first-draw": "draw",
  draw: "draw",
  "first-note": "",
  note: "",
  "first-letter": "letter",
  letter: "letter",
  "letter-open": "letter",
  "first-chat": "chat",
  wish: "wishlist",
  "wish-done": "wishlist",
  "cat-100": "cat",
  pat: "cat",
  gift: "",
  pocket: "corner",
  know: "corner",
  today: "today",
  event: "calendar",
};

function applyDecay(room: Room) {
  const now = Date.now();
  const today = todayKey(now);
  if (room.cat.decayAppliedOn === today) return room;
  const missed = Math.max(0, daysBetween(room.cat.lastCheckin, now));
  if (missed > 0) {
    room.cat.mood = Math.max(4, room.cat.mood - missed * 28);
  }
  room.cat.decayAppliedOn = today;
  return room;
}

function bumpMood(room: Room, amount: number) {
  const before = room.cat.mood;
  room.cat.mood = Math.min(100, Math.max(4, room.cat.mood + amount));
  if (before < 100 && room.cat.mood >= 100) {
    remember(room, {
      kind: "cat-100",
      titleZh: "猫心情满了",
      titleEn: "Cat reached 100 mood",
      actor: "",
    });
  }
}

function remember(room: Room, memory: Omit<Memory, "id" | "createdAt">) {
  const once = new Set(["first-question", "first-answer", "first-draw", "first-note", "first-letter", "first-chat", "cat-100"]);
  if (once.has(memory.kind) && room.memories.some((item) => item.kind === memory.kind)) return;
  if (memory.kind === "joined" && room.memories.some((item) => item.kind === "joined" && item.actor === memory.actor)) {
    return;
  }
  room.memories.unshift({
    ...memory,
    place: memory.place ?? MEMORY_PLACE[memory.kind] ?? "",
    id: uid(),
    createdAt: Date.now(),
  });
  room.memories = room.memories.slice(0, 80);
}

function sameAnswer(guess: string, secret: string) {
  const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");
  return norm(guess) === norm(secret);
}

function touchMember(room: Room, displayName: string) {
  const now = Date.now();
  const day = todayKey(now);
  const existing = room.members.find((m) => m.displayName === displayName);
  if (existing) {
    existing.lastSeen = now;
    if (!existing.visitDays.includes(day)) existing.visitDays.push(day);
  } else {
    room.members.push(normalizeMember({ displayName, lastSeen: now, visitDays: [day] }));
    remember(room, {
      kind: "joined",
      titleZh: `${displayName}走进小屋`,
      titleEn: `${displayName} joined the den`,
      actor: displayName,
    });
  }
  room.members = mergeMembers(room.members, []);
}

function memberOf(room: Room, displayName: string) {
  touchMember(room, displayName);
  const member = room.members.find((item) => item.displayName === displayName);
  if (!member) throw new Error("Member missing");
  return member;
}

function returningClaim(name: string, auth?: MemberAuth) {
  return auth?.displayName === name ? auth.claim : undefined;
}

function admitMember(room: Room, name: string, auth?: MemberAuth) {
  if ((room.banned ?? []).includes(name)) throw new Error(SEAT_BANNED);
  room.clearedSeats = (room.clearedSeats ?? []).filter((item) => item !== name);
  const now = Date.now();
  const firstToday = todayKey(room.cat.lastCheckin) !== todayKey(now);
  const existing = room.members.find((item) => item.displayName === name);
  const presented = returningClaim(name, auth);

  if (existing?.claimHash) {
    if (!claimMatches(existing.claimHash, presented)) throw new Error(NAME_TAKEN);
    touchMember(room, name);
    room.cat.lastCheckin = now;
    bumpMood(room, firstToday ? 8 : 2);
    return presented as string;
  }

  const claim = presented || newClaim();
  if (existing) {
    existing.claimHash = hashClaim(claim);
    touchMember(room, name);
  } else {
    touchMember(room, name);
    const member = room.members.find((item) => item.displayName === name);
    if (!member) throw new Error("Member missing");
    member.claimHash = hashClaim(claim);
  }
  room.cat.lastCheckin = now;
  bumpMood(room, firstToday ? 8 : 2);
  return claim;
}

function requireActor(room: Room, name: string, claim?: string) {
  const member = room.members.find((item) => item.displayName === name);
  if (!member) throw new Error(NEED_SESSION);
  if (member.claimHash) {
    if (!claimMatches(member.claimHash, claim)) throw new Error("这不是你的名字");
    return undefined;
  }
  const next = claim || newClaim();
  member.claimHash = hashClaim(next);
  return next;
}

async function readDisk(): Promise<Record<string, Room>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Record<string, Room>;
  } catch {
    return {};
  }
}

async function writeDisk(rooms: Record<string, Room>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rooms, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

async function loadRoom(id: string): Promise<Room> {
  const mem = store().rooms;
  const disk = await readDisk();
  const fromDisk = disk[id] ? normalizeRoom(cloneRoom(disk[id])) : null;
  const fromMem = mem[id] ? normalizeRoom(cloneRoom(mem[id])) : null;
  const room = fromDisk && fromMem ? mergeRooms(fromDisk, fromMem) : (fromDisk ?? fromMem ?? emptyRoom(id));
  mem[id] = cloneRoom(normalizeRoom(room));
  return cloneRoom(mem[id]);
}

function applySeatAuthority(merged: Room, current: Room): Room {
  const live = cloneRoom(current).members;
  const liveNames = new Set(live.map((item) => item.displayName));
  const blocked = [...new Set([...(current.clearedSeats ?? []), ...(current.banned ?? [])])];
  const erased = new Set(blocked.filter((name) => !liveNames.has(name)));
  const extras = merged.members.filter((item) => !liveNames.has(item.displayName) && !erased.has(item.displayName));
  merged.members = [...live, ...extras];
  merged.clearedSeats = [...(current.clearedSeats ?? [])];
  merged.banned = [...(current.banned ?? [])];
  delete merged.away;
  return normalizeRoom(merged);
}

async function saveRoom(room: Room) {
  const disk = await readDisk();
  const onDisk = disk[room.id];
  const merged = onDisk ? mergeRooms(normalizeRoom(cloneRoom(onDisk)), room) : cloneRoom(room);
  const saved = applySeatAuthority(merged, room);
  store().rooms[saved.id] = cloneRoom(saved);
  disk[saved.id] = cloneRoom(saved);
  await writeDisk(disk);
}

export async function notePresence(
  id: string,
  displayName: string,
  claim?: string,
): Promise<{ room: Room; claim?: string }> {
  return withLock(async () => {
    const name = cleanName(displayName);
    const room = applyDecay(await loadRoom(id));
    const ticked = tickGames(room, Date.now(), remember);
    const existing = room.members.find((item) => item.displayName === name);
    if (!existing) {
      if (ticked) await saveRoom(room);
      return { room: cloneRoom(room) };
    }
    if (existing.claimHash) {
      if (!claimMatches(existing.claimHash, claim)) {
        if (ticked) await saveRoom(room);
        return { room: cloneRoom(room) };
      }
      touchMember(room, name);
      await saveRoom(room);
      return { room: cloneRoom(room), claim };
    }
    const nextClaim = claim || newClaim();
    existing.claimHash = hashClaim(nextClaim);
    touchMember(room, name);
    await saveRoom(room);
    return { room: cloneRoom(room), claim: nextClaim };
  });
}

export async function getRoom(id: string): Promise<Room> {
  return withLock(async () => {
    // Read-only path: do not write on every poll (that was wiping concurrent joins).
    const room = applyDecay(await loadRoom(id));
    store().rooms[id] = cloneRoom(room);
    return cloneRoom(room);
  });
}

function takeNames(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && isRealName(item)))].slice(0, limit);
}

function requireKeeper(name: string) {
  if (!isKeeper(name)) throw new Error("这页只有管理人能用");
}

function hideName(room: Room, name: string) {
  if (!room.clearedSeats.includes(name)) room.clearedSeats.push(name);
}

function guardKeepTarget(actor: string, targetName: string) {
  requireKeeper(actor);
  if (!isRealName(targetName)) throw new Error("Write your own name");
  if (targetName === actor) throw new Error("不能对自己这样做");
  if (isKeeper(targetName)) throw new Error("管理人不能请出");
}

function erasePersonData(room: Room, name: string) {
  if (!isRealName(name)) throw new Error("Write your own name");
  room.members = room.members.filter((item) => item.displayName !== name);
  if (!room.clearedSeats.includes(name)) room.clearedSeats.push(name);
  room.notes = room.notes.filter((item) => item.author !== name);
  room.messages = room.messages.filter((item) => item.author !== name);
  room.letters = room.letters.filter((item) => item.from !== name);
  room.gifts = room.gifts.filter((item) => item.from !== name && item.to !== name);
  room.questions = room.questions.filter((item) => item.askedBy !== name);
  for (const question of room.questions) {
    if (question.answeredBy === name) {
      question.answer = null;
      question.answeredBy = null;
    }
  }
  room.wishlist = room.wishlist.filter((item) => item.addedBy !== name);
  room.events = room.events.filter((item) => item.addedBy !== name);
  room.memories = room.memories.filter((item) => item.actor !== name);
  room.pats = room.pats.filter((item) => item.name !== name);
  for (const day of room.daily) {
    day.answers = (day.answers ?? []).filter((item) => item.name !== name);
  }
  for (const member of room.members) {
    member.profile.guesses = (member.profile.guesses ?? []).filter((item) => item.target !== name);
  }
  dropFromGame(room, name);
}

function dropFromGame(room: Room, name: string) {
  const game = room.games?.active;
  if (!game) return;
  game.players = game.players.filter((player) => player !== name);
  delete game.scores[name];
  if (game.gameType === "rps") {
    delete game.picks[name];
    game.locked = game.locked.filter((player) => player !== name);
  }
  if (game.gameType === "sync") {
    delete game.answers[name];
    game.submitted = game.submitted.filter((player) => player !== name);
  }
  if (game.gameType === "memory" && game.turn === name) {
    game.turn = game.players[0] ?? "";
  }
  if (game.gameType === "draw") {
    game.order = game.order.filter((player) => player !== name);
    if (game.artist === name) game.artist = game.order[0] ?? game.players[0] ?? "";
  }
  if (game.lastActionBy === name) game.lastActionBy = game.players[0] ?? "";
  if (game.winner === name) delete game.winner;
  if (game.players.length < 2) room.games.active = null;
  game.updatedAt = Date.now();
  room.games.stamp = Date.now();
}

function takeList<T>(value: unknown, limit: number): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object").slice(0, limit) as T[];
}

function sanitizeRoom(id: string, raw: unknown): Room | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Partial<Room>;
  const base = emptyRoom(id);
  const cat = src.cat && typeof src.cat === "object" ? src.cat : base.cat;
  const mood = Number(cat.mood);
  const room = normalizeRoom({
    ...base,
    id,
    createdAt: typeof src.createdAt === "number" ? src.createdAt : base.createdAt,
    members: takeList<Member>(src.members, 24).map((member) => {
      const copy = { ...member };
      delete copy.claimHash;
      return copy;
    }),
    questions: takeList(src.questions, 80),
    wishlist: takeList(src.wishlist, 80),
    notes: takeList(src.notes, 24),
    messages: takeList(src.messages, 80),
    draws: takeList(src.draws, 40),
    letters: takeList(src.letters, 12),
    daily: takeList(src.daily, 60),
    events: takeList(src.events, 80),
    gifts: takeList(src.gifts, 30),
    memories: takeList(src.memories, 80),
    pats: takeList(src.pats, 40),
    games: sanitizeGames(src.games),
    clearedSeats: takeNames(src.clearedSeats, 48),
    banned: takeNames(src.banned, 48),
    cat: {
      mood: Number.isFinite(mood) ? Math.min(100, Math.max(4, mood)) : base.cat.mood,
      lastPat: typeof cat.lastPat === "number" ? cat.lastPat : 0,
      lastCheckin: typeof cat.lastCheckin === "number" ? cat.lastCheckin : base.cat.lastCheckin,
      decayAppliedOn: typeof cat.decayAppliedOn === "string" ? cat.decayAppliedOn : base.cat.decayAppliedOn,
      lastToy: typeof cat.lastToy === "number" ? cat.lastToy : 0,
      lastFeed: typeof cat.lastFeed === "number" ? cat.lastFeed : 0,
    },
  });
  const hasAnything =
    room.members.length > 0 ||
    room.questions.length > 0 ||
    room.messages.length > 0 ||
    room.notes.length > 0 ||
    room.draws.length > 0 ||
    room.letters.length > 0 ||
    room.wishlist.length > 0 ||
    room.memories.length > 0 ||
    room.pats.length > 0;
  return hasAnything ? room : null;
}

export async function restoreRoom(id: string, raw: unknown): Promise<Room> {
  return withLock(async () => {
    const incoming = sanitizeRoom(id, raw);
    const current = applyDecay(await loadRoom(id));
    if (!incoming) return cloneRoom(current);
    const merged = mergeRooms(current, incoming);
    merged.id = id;
    await saveRoom(merged);
    return cloneRoom(merged);
  });
}

export async function applyAction(
  id: string,
  action: RoomAction,
  auth?: MemberAuth,
): Promise<{ room: Room; claim?: string }> {
  return withLock(async () => {
    const room = applyDecay(await loadRoom(id));
    const now = Date.now();
    tickGames(room, now, remember);
    let issuedClaim: string | undefined;
    let name: string;

    if (action.type === "join" || action.type === "checkin") {
      name = cleanName(action.displayName ?? auth?.displayName ?? "");
      issuedClaim = admitMember(room, name, auth);
      await saveRoom(room);
      return { room: cloneRoom(room), claim: issuedClaim };
    }

    if (!auth?.displayName) throw new Error(NEED_SESSION);
    name = cleanName(auth.displayName);
    issuedClaim = requireActor(room, name, auth.claim);
    if ((room.banned ?? []).includes(name)) throw new Error(SEAT_BANNED);
    if ((room.clearedSeats ?? []).includes(name)) throw new Error(SEAT_CLEARED);

    if (applyPlay(room, action, name, now, remember)) {
      await saveRoom(room);
      return { room: cloneRoom(room), claim: issuedClaim };
    }

    switch (action.type) {
      case "pat": {
        touchMember(room, name);
        room.cat.lastPat = now;
        room.cat.lastCheckin = now;
        room.pats.unshift({ id: uid(), name, at: now });
        room.pats = room.pats.slice(0, 40);
        bumpMood(room, 16);
        remember(room, {
          kind: "pat",
          titleZh: `${name}摸了摸懒猫`,
          titleEn: `${name} patted the cat`,
          actor: name,
          place: "cat",
        });
        break;
      }
      case "playToy": {
        touchMember(room, name);
        if (now - (room.cat.lastToy ?? 0) < 45_000) throw new Error("毛线球还在滚，等一下");
        room.cat.lastToy = now;
        bumpMood(room, 4);
        break;
      }
      case "feedCat": {
        touchMember(room, name);
        if (now - (room.cat.lastFeed ?? 0) < 90_000) throw new Error("碗里还有，等一下再喂");
        room.cat.lastFeed = now;
        bumpMood(room, 4);
        break;
      }
      case "ask": {
        const question = action.question.trim().slice(0, 280);
        if (!question) throw new Error("Question required");
        touchMember(room, name);
        room.questions.unshift({
          id: uid(),
          question,
          askedBy: name,
          answer: null,
          answeredBy: null,
          createdAt: now,
        });
        room.questions = room.questions.slice(0, 80);
        remember(room, {
          kind: "first-question",
          titleZh: "第一个问题",
          titleEn: "First question",
          actor: name,
          place: "qa",
        });
        remember(room, {
          kind: "question",
          titleZh: `问了：${question.slice(0, 28)}`,
          titleEn: "Asked a question",
          actor: name,
          place: "qa",
        });
        break;
      }
      case "answer": {
        const answer = action.answer.trim().slice(0, 400);
        if (!answer) throw new Error("Answer required");
        const q = room.questions.find((item) => item.id === action.questionId);
        if (!q) throw new Error("Question not found");
        if (q.answer) throw new Error("Already answered");
        touchMember(room, name);
        q.answer = answer;
        q.answeredBy = name;
        bumpMood(room, 4);
        remember(room, {
          kind: "first-answer",
          titleZh: "第一个回答",
          titleEn: "First answer",
          actor: name,
          place: "qa",
        });
        remember(room, {
          kind: "answer",
          titleZh: `答了：${answer.slice(0, 28)}`,
          titleEn: "Answered a question",
          actor: name,
          place: "qa",
        });
        break;
      }
      case "addWish": {
        const text = action.text.trim().slice(0, 120);
        if (!text) throw new Error("Wish text required");
        touchMember(room, name);
        room.wishlist.unshift({
          id: uid(),
          text,
          done: false,
          addedBy: name,
          createdAt: now,
        });
        room.wishlist = room.wishlist.slice(0, 80);
        remember(room, {
          kind: "wish",
          titleZh: `许了愿：${text.slice(0, 28)}`,
          titleEn: "Added a wish",
          actor: name,
          place: "wishlist",
        });
        break;
      }
      case "toggleWish": {
        const wish = room.wishlist.find((item) => item.id === action.wishId);
        if (!wish) throw new Error("Wish not found");
        touchMember(room, name);
        wish.done = !wish.done;
        if (wish.done) {
          bumpMood(room, 5);
          remember(room, {
            kind: "wish-done",
            titleZh: `完成了愿望：${wish.text.slice(0, 28)}`,
            titleEn: "Finished a wish",
            actor: name,
            place: "wishlist",
          });
        }
        break;
      }
      case "removeWish": {
        touchMember(room, name);
        room.wishlist = room.wishlist.filter((item) => item.id !== action.wishId);
        break;
      }
      case "draw": {
        touchMember(room, name);
        if (action.drawType === "plan") {
          const theme = PLAN_DRAWS[Math.floor(Math.random() * PLAN_DRAWS.length)];
          let winner: string;
          if ("jars" in theme) {
            const jarName = theme.jars[Math.floor(Math.random() * theme.jars.length)];
            const pool = DRAW_JARS[jarName];
            winner = pool[Math.floor(Math.random() * pool.length)].zh;
          } else {
            winner = theme.picks[Math.floor(Math.random() * theme.picks.length)];
          }
          room.draws.unshift({
            id: uid(),
            type: "plan",
            labelZh: theme.zh,
            labelEn: theme.en,
            winner,
            createdAt: now,
          });
        } else if (action.drawType === "who") {
          const names = [...new Set(room.members.map((m) => m.displayName))];
          if (names.length < 2) throw new Error("再等一个人进小屋吧");
          const task = WHO_DRAWS[Math.floor(Math.random() * WHO_DRAWS.length)];
          room.draws.unshift({
            id: uid(),
            type: "who",
            labelZh: task.zh,
            labelEn: task.en,
            winner: names[Math.floor(Math.random() * names.length)],
            createdAt: now,
          });
        } else if (action.drawType === "sweet") {
          const pick = SWEET_DRAWS[Math.floor(Math.random() * SWEET_DRAWS.length)];
          room.draws.unshift({
            id: uid(),
            type: "sweet",
            labelZh: "来点甜的",
            labelEn: pick.en,
            winner: pick.zh,
            createdAt: now,
          });
        } else if (action.drawType === "tonight") {
          const idea = TONIGHT_IDEAS[Math.floor(Math.random() * TONIGHT_IDEAS.length)];
          room.draws.unshift({
            id: uid(),
            type: "tonight",
            labelZh: "今晚做什么",
            labelEn: "What tonight",
            winner: idea.zh,
            createdAt: now,
          });
        } else {
          const spec = DRAW_TYPES.find((item) => item.id === action.drawType);
          if (!spec) throw new Error("Unknown draw type");
          let winner: string;
          if (spec.kind === "person") {
            const names = [...new Set(room.members.map((m) => m.displayName))];
            if (names.length < 2) throw new Error("再等一个人进小屋吧");
            winner = names[Math.floor(Math.random() * names.length)];
          } else {
            const pool = DRAW_JARS[spec.jar];
            winner = pool[Math.floor(Math.random() * pool.length)].zh;
          }
          room.draws.unshift({
            id: uid(),
            type: spec.id,
            labelZh: spec.zh,
            labelEn: spec.en,
            winner,
            createdAt: now,
          });
        }
        room.draws = room.draws.slice(0, 40);
        bumpMood(room, 3);
        remember(room, {
          kind: "first-draw",
          titleZh: "第一次抽签",
          titleEn: "First draw",
          actor: name,
          place: "draw",
        });
        remember(room, {
          kind: "draw",
          titleZh: `${room.draws[0].labelZh}：${room.draws[0].winner}`,
          titleEn: room.draws[0].labelEn,
          actor: name,
          place: "draw",
        });
        break;
      }
      case "addNote": {
        const text = action.text.trim().slice(0, 180);
        if (!text) throw new Error("Note required");
        touchMember(room, name);
        const color = NOTE_COLORS[room.notes.length % NOTE_COLORS.length];
        room.notes.unshift({
          id: uid(),
          text,
          author: name,
          color,
          createdAt: now,
        });
        room.notes = room.notes.slice(0, 24);
        remember(room, {
          kind: "first-note",
          titleZh: "第一张便签",
          titleEn: "First sticky note",
          actor: name,
          place: "",
        });
        remember(room, {
          kind: "note",
          titleZh: `贴了便签：${text.slice(0, 28)}`,
          titleEn: "Left a note",
          actor: name,
          place: "",
        });
        break;
      }
      case "sendChat": {
        const text = action.text.trim().slice(0, 200);
        if (!text) throw new Error("Message required");
        touchMember(room, name);
        room.messages.unshift({
          id: uid(),
          author: name,
          text,
          createdAt: now,
        });
        room.messages = room.messages.slice(0, 80);
        remember(room, {
          kind: "first-chat",
          titleZh: "第一次聊天",
          titleEn: "First chat",
          actor: name,
          place: "chat",
        });
        break;
      }
      case "removeNote": {
        touchMember(room, name);
        room.notes = room.notes.filter((item) => item.id !== action.noteId);
        break;
      }
      case "setStatus": {
        const knownFeeling =
          COUPLE_STATUSES.some((item) => item.id === action.statusId) ||
          FEELINGS.some((item) => item.id === action.statusId);
        if (!knownFeeling) throw new Error("Unknown status");
        memberOf(room, name).statusId = action.statusId;
        break;
      }
      case "sendLetter": {
        const text = action.text.trim().slice(0, 280);
        if (!text) throw new Error("Letter required");
        touchMember(room, name);
        room.letters.unshift({
          id: uid(),
          from: name,
          text,
          createdAt: now,
          openedAt: null,
          openedBy: null,
        });
        room.letters = room.letters.slice(0, 12);
        remember(room, {
          kind: "first-letter",
          titleZh: "第一封小信",
          titleEn: "First secret note",
          actor: name,
          place: "letter",
        });
        remember(room, {
          kind: "letter",
          titleZh: `${name}留了一封信`,
          titleEn: "Left a letter",
          actor: name,
          place: "letter",
        });
        break;
      }
      case "openLetter": {
        const letter = room.letters.find((item) => item.id === action.letterId);
        if (!letter) throw new Error("Letter not found");
        if (letter.from === name) throw new Error("Leave this letter for them");
        touchMember(room, name);
        if (!letter.openedAt) {
          letter.openedAt = now;
          letter.openedBy = name;
          remember(room, {
            kind: "letter-open",
            titleZh: `${name}打开了信`,
            titleEn: "Opened a letter",
            actor: name,
            place: "letter",
          });
        }
        break;
      }
      case "answerDaily": {
        const text = action.text.trim().slice(0, 280);
        if (!text) throw new Error("Answer required");
        const date = todayKey(now);
        const prompt = promptForDate(date);
        touchMember(room, name);
        let day = room.daily.find((item) => item.date === date);
        if (!day) {
          day = { date, promptId: prompt.id, answers: [] };
          room.daily.unshift(day);
        }
        const prev = day.answers.find((item) => item.name === name);
        if (prev) {
          prev.text = text;
          prev.at = now;
        } else {
          day.answers.push({ name, text, at: now });
        }
        room.daily = room.daily.slice(0, 60);
        remember(room, {
          kind: "today",
          titleZh: `今日回答：${text.slice(0, 28)}`,
          titleEn: "Answered today",
          actor: name,
          place: "today",
        });
        break;
      }
      case "addEvent": {
        const title = action.title.trim().slice(0, 80);
        const date = action.date.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Pick a date");
        if (!title) throw new Error("Event title required");
        if (!EVENT_TYPES.some((item) => item.id === action.eventType)) throw new Error("Unknown event");
        touchMember(room, name);
        room.events.unshift({
          id: uid(),
          date,
          eventType: action.eventType,
          title,
          addedBy: name,
          createdAt: now,
        });
        room.events = room.events.slice(0, 80);
        remember(room, {
          kind: "event",
          titleZh: `记下了：${title.slice(0, 28)}`,
          titleEn: "Added a day",
          actor: name,
          place: "calendar",
        });
        break;
      }
      case "removeEvent": {
        touchMember(room, name);
        room.events = room.events.filter((item) => item.id !== action.eventId);
        break;
      }
      case "setVibes": {
        const vibes = [...new Set(action.vibes)].filter((id) => VIBES.some((item) => item.id === id)).slice(0, 5);
        memberOf(room, name).profile.vibes = vibes;
        break;
      }
      case "setForm": {
        if (!CAT_FORMS.some((item) => item.id === action.formId)) throw new Error("Unknown form");
        memberOf(room, name).profile.formId = action.formId;
        break;
      }
      case "setThoughts": {
        const profile = memberOf(room, name).profile;
        profile.thinking = action.thinking.trim().slice(0, 80);
        profile.need = action.need.trim().slice(0, 80);
        profile.want = action.want.trim().slice(0, 80);
        break;
      }
      case "setGender": {
        if (action.gender !== "" && !GENDERS.some((item) => item.id === action.gender)) {
          throw new Error("Unknown gender");
        }
        memberOf(room, name).profile.gender = action.gender;
        break;
      }
      case "setSignature": {
        memberOf(room, name).profile.signature = action.signature.trim().slice(0, 40);
        break;
      }
      case "setLook": {
        touchMember(room, name);
        const profile = memberOf(room, name).profile;
        if (action.characterId !== "" && !isCharacterId(action.characterId)) throw new Error("Unknown character");
        if (!isAvatarKind(action.avatarKind)) throw new Error("Unknown picture");
        if (!isFrameId(action.frameId)) throw new Error("Unknown frame");
        if (!isThemeId(action.themeId)) throw new Error("Unknown theme");
        if (!isEffectId(action.effectId)) throw new Error("Unknown effect");
        profile.characterId = action.characterId;
        profile.frameId = action.frameId;
        profile.themeId = action.themeId;
        profile.effectId = action.effectId;
        profile.bio = action.bio.trim().slice(0, 80);
        if (action.avatarKind === "upload") {
          if (!profile.avatarFile) throw new Error("先选一张照片");
          profile.avatarKind = "upload";
        } else {
          profile.avatarKind = action.avatarKind;
        }
        break;
      }
      case "clearAvatar": {
        touchMember(room, name);
        const profile = memberOf(room, name).profile;
        profile.avatarFile = "";
        if (profile.avatarKind === "upload") profile.avatarKind = "";
        break;
      }
      case "setPocket": {
        if (!POCKET_KEYS.some((item) => item.id === action.key)) throw new Error("Unknown pocket");
        const value = action.value.trim().slice(0, 40);
        memberOf(room, name).profile.pocket[action.key] = value;
        if (value) {
          const label = POCKET_KEYS.find((item) => item.id === action.key)?.zh ?? "口袋";
          remember(room, {
            kind: "pocket",
            titleZh: `${name}写下了${label}`,
            titleEn: "Filled a pocket",
            actor: name,
            place: "corner",
          });
        }
        break;
      }
      case "setCorner": {
        if (!WALLS.some((item) => item.id === action.wall)) throw new Error("Unknown wall");
        const objects = [...new Set(action.objects)]
          .filter((id) => CORNER_OBJECTS.some((item) => item.id === id))
          .slice(0, 6);
        const profile = memberOf(room, name).profile;
        profile.wall = action.wall;
        profile.objects = objects;
        break;
      }
      case "setKnowMe": {
        if (!KNOW_PROMPTS.some((item) => item.id === action.promptId)) throw new Error("Unknown prompt");
        const answer = action.answer.trim().slice(0, 40);
        if (!answer) throw new Error("Answer required");
        const profile = memberOf(room, name).profile;
        const existing = profile.knowMe.find((item) => item.promptId === action.promptId);
        if (existing) existing.answer = answer;
        else profile.knowMe.push({ promptId: action.promptId, answer });
        const label = KNOW_PROMPTS.find((item) => item.id === action.promptId)?.zh ?? "Know Me";
        remember(room, {
          kind: "know",
          titleZh: `${name}写下了：${label}`,
          titleEn: "Answered Know Me",
          actor: name,
          place: "corner",
        });
        break;
      }
      case "guessKnowMe": {
        const target = room.members.find((item) => item.displayName === action.target.trim());
        if (!target) throw new Error("They're not in the den yet");
        if (target.displayName === name) throw new Error("This one is for them to guess");
        const secret = target.profile.knowMe.find((item) => item.promptId === action.promptId);
        if (!secret?.answer?.trim()) throw new Error("They haven't answered this yet");
        const guess = action.guess.trim().slice(0, 40);
        if (!guess) throw new Error("Guess required");
        const profile = memberOf(room, name).profile;
        const correct = sameAnswer(guess, secret.answer);
        const prev = profile.guesses.find((item) => item.target === target.displayName && item.promptId === action.promptId);
        if (prev) {
          prev.correct = correct;
          prev.at = now;
        } else {
          profile.guesses.push({ target: target.displayName, promptId: action.promptId, correct, at: now });
        }
        break;
      }
      case "gift": {
        const targetName = action.target.trim();
        if (!room.members.some((item) => item.displayName === targetName)) {
          throw new Error("他们还不在小屋里");
        }
        if (targetName === name) throw new Error("留给别人吧");
        if (!GIFT_KINDS.some((item) => item.id === action.kind)) throw new Error("换一个吧");
        const note = action.kind === "note" ? (action.note ?? "").trim().slice(0, 80) : "";
        if (action.kind === "note" && !note) throw new Error("先写一句");
        touchMember(room, name);
        room.gifts.unshift({
          id: uid(),
          from: name,
          to: targetName,
          kind: action.kind,
          note,
          createdAt: now,
        });
        room.gifts = room.gifts.slice(0, 30);
        bumpMood(room, 2);
        if (action.kind === "kiss" || action.kind === "flower" || action.kind === "note") {
          const giftLabel = GIFT_KINDS.find((item) => item.id === action.kind)?.zh ?? "靠近";
          remember(room, {
            kind: "gift",
            titleZh: note ? `${name}对${targetName}说：${note.slice(0, 24)}` : `${name}对${targetName}${giftLabel}`,
            titleEn: "Came closer",
            actor: name,
            place: "",
          });
        }
        break;
      }
      case "clearSeat": {
        const targetName = action.target.trim();
        guardKeepTarget(name, targetName);
        if (!room.members.some((item) => item.displayName === targetName)) {
          throw new Error("他们已经不在了");
        }
        hideName(room, targetName);
        const member = room.members.find((item) => item.displayName === targetName);
        if (member) delete member.claimHash;
        dropFromGame(room, targetName);
        break;
      }
      case "restoreSeat": {
        const targetName = action.target.trim();
        guardKeepTarget(name, targetName);
        if ((room.banned ?? []).includes(targetName)) throw new Error("先解开不让进");
        room.clearedSeats = room.clearedSeats.filter((item) => item !== targetName);
        const member = room.members.find((item) => item.displayName === targetName);
        if (member) delete member.claimHash;
        break;
      }
      case "banPerson": {
        const targetName = action.target.trim();
        guardKeepTarget(name, targetName);
        hideName(room, targetName);
        if (!room.banned.includes(targetName)) room.banned.push(targetName);
        dropFromGame(room, targetName);
        break;
      }
      case "unbanPerson": {
        const targetName = action.target.trim();
        guardKeepTarget(name, targetName);
        room.banned = (room.banned ?? []).filter((item) => item !== targetName);
        room.clearedSeats = room.clearedSeats.filter((item) => item !== targetName);
        const member = room.members.find((item) => item.displayName === targetName);
        if (member) delete member.claimHash;
        break;
      }
      case "wipeCorner": {
        const targetName = action.target.trim();
        guardKeepTarget(name, targetName);
        const member = room.members.find((item) => item.displayName === targetName);
        if (!member) throw new Error("他们已经不在了");
        member.profile = emptyProfile();
        member.statusId = null;
        break;
      }
      case "erasePerson": {
        const targetName = action.target.trim();
        guardKeepTarget(name, targetName);
        erasePersonData(room, targetName);
        break;
      }
      default:
        throw new Error("Unknown action");
    }

    await saveRoom(room);
    return { room: cloneRoom(room), claim: issuedClaim };
  });
}

export async function saveMemberAvatar(
  id: string,
  auth: MemberAuth,
  fileId: string,
): Promise<Room> {
  return withLock(async () => {
    if (!auth.displayName) throw new Error(NEED_SESSION);
    const name = cleanName(auth.displayName);
    const room = applyDecay(await loadRoom(id));
    requireActor(room, name, auth.claim);
    const profile = memberOf(room, name).profile;
    profile.avatarFile = fileId;
    profile.avatarKind = "upload";
    await saveRoom(room);
    return cloneRoom(room);
  });
}

