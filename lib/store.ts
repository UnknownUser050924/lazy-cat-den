import { promises as fs } from "fs";
import path from "path";
import {
  CAT_FORMS,
  COUPLE_STATUSES,
  CORNER_OBJECTS,
  DRAW_JARS,
  DRAW_TYPES,
  EVENT_TYPES,
  GENDERS,
  GIFT_KINDS,
  KNOW_PROMPTS,
  NOTE_COLORS,
  POCKET_KEYS,
  TONIGHT_IDEAS,
  VIBES,
  WALLS,
} from "./constants";
import { promptForDate } from "./cottage";
import { emptyProfile } from "./profile";
import type { Member, Memory, Profile, Room, RoomAction } from "./types";

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
  return new Date(now).toISOString().slice(0, 10);
}

function daysBetween(from: number, to: number) {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
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
    formId: primary.formId || other.formId,
    thinking: primary.thinking || other.thinking,
    need: primary.need || other.need,
    want: primary.want || other.want,
    pocket: mergePocket(primary.pocket, other.pocket),
    wall: primary.wall || other.wall,
    objects: primary.objects.length ? primary.objects : other.objects,
    knowMe: mergeKnow(primary.knowMe, other.knowMe),
    guesses: [...guesses.values()],
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
  room.cat.lastCheckin = Math.max(room.cat.lastCheckin, other.cat.lastCheckin);
  room.cat.lastPat = Math.max(room.cat.lastPat, other.cat.lastPat);
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
  "cat-100": "cat",
  pat: "cat",
  gift: "corner",
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

async function saveRoom(room: Room) {
  const disk = await readDisk();
  const onDisk = disk[room.id];
  const merged = onDisk ? mergeRooms(normalizeRoom(cloneRoom(onDisk)), room) : room;
  store().rooms[merged.id] = cloneRoom(merged);
  disk[merged.id] = cloneRoom(merged);
  await writeDisk(disk);
}

export async function notePresence(id: string, displayName: string): Promise<Room> {
  return withLock(async () => {
    const name = cleanName(displayName);
    const room = applyDecay(await loadRoom(id));
    touchMember(room, name);
    await saveRoom(room);
    return cloneRoom(room);
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

export async function applyAction(id: string, action: RoomAction): Promise<Room> {
  return withLock(async () => {
    const room = applyDecay(await loadRoom(id));
    const now = Date.now();
    const name = cleanName(action.displayName ?? "");

    switch (action.type) {
      case "join":
      case "checkin": {
        const firstToday = todayKey(room.cat.lastCheckin) !== todayKey(now);
        touchMember(room, name);
        room.cat.lastCheckin = now;
        bumpMood(room, firstToday ? 8 : 2);
        break;
      }
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
        if (wish.done) bumpMood(room, 5);
        break;
      }
      case "removeWish": {
        touchMember(room, name);
        room.wishlist = room.wishlist.filter((item) => item.id !== action.wishId);
        break;
      }
      case "draw": {
        touchMember(room, name);
        if (action.drawType === "tonight") {
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
            if (names.length < 2) throw new Error("Need two people in the room first");
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
        if (!COUPLE_STATUSES.some((item) => item.id === action.statusId)) {
          throw new Error("Unknown status");
        }
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
          throw new Error("They're not in the den yet");
        }
        if (targetName === name) throw new Error("Leave this for them");
        if (!GIFT_KINDS.some((item) => item.id === action.kind)) throw new Error("Unknown gift");
        touchMember(room, name);
        room.gifts.unshift({
          id: uid(),
          from: name,
          to: targetName,
          kind: action.kind,
          createdAt: now,
        });
        room.gifts = room.gifts.slice(0, 30);
        bumpMood(room, 2);
        const giftLabel = GIFT_KINDS.find((item) => item.id === action.kind)?.zh ?? "礼物";
        remember(room, {
          kind: "gift",
          titleZh: `${name}给${targetName}${giftLabel}`,
          titleEn: "Left a gift",
          actor: name,
          place: "corner",
        });
        break;
      }
      default:
        throw new Error("Unknown action");
    }

    await saveRoom(room);
    return cloneRoom(room);
  });
}
