import { promises as fs } from "fs";
import path from "path";
import { DRAW_TYPES, NOTE_COLORS } from "./constants";
import type { Member, Room, RoomAction } from "./types";

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
    draws: [],
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

function mergeMembers(a: Member[], b: Member[]): Member[] {
  const map = new Map<string, Member>();
  for (const member of [...a, ...b]) {
    const prev = map.get(member.displayName);
    if (!prev || member.lastSeen >= prev.lastSeen) {
      map.set(member.displayName, member);
    }
  }
  return [...map.values()].sort((x, y) => x.displayName.localeCompare(y.displayName, "zh"));
}

function mergeById<T extends { id: string; createdAt: number }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of [...a, ...b]) map.set(item.id, item);
  return [...map.values()].sort((x, y) => y.createdAt - x.createdAt);
}

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
  room.cat.mood = Math.min(100, Math.max(4, room.cat.mood + amount));
}

function touchMember(room: Room, displayName: string) {
  const now = Date.now();
  const existing = room.members.find((m) => m.displayName === displayName);
  if (existing) {
    existing.lastSeen = now;
  } else {
    room.members.push({ displayName, lastSeen: now });
  }
  room.members = mergeMembers(room.members, []);
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
  if (mem[id]) return cloneRoom(mem[id]);

  const disk = await readDisk();
  const room = cloneRoom(disk[id] ?? emptyRoom(id));
  mem[id] = cloneRoom(room);
  return room;
}

async function saveRoom(room: Room) {
  const mem = store().rooms;
  // Pull any members another worker may have written to disk.
  const disk = await readDisk();
  const onDisk = disk[room.id];
  if (onDisk) {
    room.members = mergeMembers(onDisk.members, room.members);
    room.questions = mergeById(onDisk.questions, room.questions);
    room.wishlist = mergeById(onDisk.wishlist, room.wishlist);
    room.notes = mergeById(onDisk.notes, room.notes);
    room.draws = mergeById(onDisk.draws, room.draws);
    room.cat.lastCheckin = Math.max(room.cat.lastCheckin, onDisk.cat.lastCheckin);
    room.cat.lastPat = Math.max(room.cat.lastPat, onDisk.cat.lastPat);
  }

  mem[room.id] = cloneRoom(room);
  disk[room.id] = cloneRoom(room);
  await writeDisk(disk);
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
    const name = action.displayName.trim().slice(0, 24);
    if (!name) throw new Error("Display name required");

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
        bumpMood(room, 16);
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
        const spec = DRAW_TYPES.find((item) => item.id === action.drawType);
        if (!spec) throw new Error("Unknown draw type");
        const names = [...new Set(room.members.map((m) => m.displayName))];
        if (names.length < 2) {
          throw new Error("Need two people in the room first");
        }
        const winner = names[Math.floor(Math.random() * names.length)];
        touchMember(room, name);
        room.draws.unshift({
          id: uid(),
          type: spec.id,
          labelZh: spec.zh,
          labelEn: spec.en,
          winner,
          createdAt: now,
        });
        room.draws = room.draws.slice(0, 40);
        bumpMood(room, 3);
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
        break;
      }
      case "removeNote": {
        touchMember(room, name);
        room.notes = room.notes.filter((item) => item.id !== action.noteId);
        break;
      }
      default:
        throw new Error("Unknown action");
    }

    await saveRoom(room);
    return cloneRoom(room);
  });
}
