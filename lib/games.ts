import { DRAW_WORDS, MEMORY_PAIRS } from "@/lib/play-data";
import type {
  DrawSession,
  DrawStroke,
  GameDesk,
  GameKind,
  GameSession,
  MemoryCard,
  MemorySession,
  Room,
  RpsPick,
  RpsSession,
  SyncSession,
} from "@/lib/types";

export const RPS_PICKS: { id: RpsPick; zh: string; mark: string }[] = [
  { id: "rock", zh: "石头", mark: "✊" },
  { id: "scissors", zh: "剪刀", mark: "✌️" },
  { id: "paper", zh: "布", mark: "✋" },
];

export function rpsBeats(a: RpsPick, b: RpsPick) {
  return (
    (a === "rock" && b === "scissors") ||
    (a === "scissors" && b === "paper") ||
    (a === "paper" && b === "rock")
  );
}

export function emptyGames(): GameDesk {
  return { active: null, recent: [], stamp: 0 };
}

export function rpsRoundWinners(picks: Partial<Record<string, RpsPick>>) {
  const entries = Object.entries(picks).filter((item): item is [string, RpsPick] => Boolean(item[1]));
  const unique = [...new Set(entries.map((item) => item[1]))];
  if (unique.length !== 2) return [];
  const [left, right] = unique;
  const win = rpsBeats(left, right) ? left : rpsBeats(right, left) ? right : null;
  if (!win) return [];
  return entries.filter((item) => item[1] === win).map((item) => item[0]);
}

export function presentRoom(room: Room, viewer: string, admin = false): Room {
  const members = room.members.map((member) => {
    if (!("claimHash" in member) || !member.claimHash) return member;
    const { claimHash: _omit, ...rest } = member;
    return rest;
  });
  const cleared = new Set([...(room.clearedSeats ?? []), ...(room.banned ?? [])]);
  const seated = members.filter((member) => !cleared.has(member.displayName));
  const away = members.filter((member) => cleared.has(member.displayName));
  const memories = admin
    ? room.memories ?? []
    : (room.memories ?? []).filter((item) => !cleared.has(item.actor));
  const next: Room = {
    ...room,
    members: seated,
    memories,
    clearedSeats: admin ? [...(room.clearedSeats ?? [])] : [],
    banned: admin ? [...(room.banned ?? [])] : [],
    admin,
    ...(admin ? { away } : {}),
  };
  const active = next.games?.active;
  if (!active) return next;
  return {
    ...next,
    games: {
      active: presentGame(active, viewer),
      recent: next.games.recent ?? [],
      stamp: next.games.stamp ?? 0,
    },
  };
}

function presentGame(game: GameSession, viewer: string): GameSession {
  if (game.gameType === "rps") {
    if (game.status !== "picking") return game;
    const picks: RpsSession["picks"] = {};
    const mine = viewer ? game.picks[viewer] : undefined;
    if (mine) picks[viewer] = mine;
    return { ...game, picks };
  }
  if (game.gameType === "sync") {
    if (game.status !== "answering") return game;
    const answers: SyncSession["answers"] = {};
    const mine = viewer ? game.answers[viewer] : undefined;
    if (mine) answers[viewer] = mine;
    return { ...game, answers };
  }
  if (game.gameType === "memory") {
    const open = new Set<string>();
    if (game.peek?.a) open.add(game.peek.a);
    if (game.peek?.b) open.add(game.peek.b);
    const cards = game.cards.map((card) => {
      if (card.face !== "down" || open.has(card.id)) return card;
      return { id: card.id, pair: "", face: "down" as const };
    });
    return { ...game, cards };
  }
  if (game.gameType === "draw") {
    const showWord = game.status !== "play" || game.artist === viewer;
    return {
      ...game,
      word: showWord ? game.word : undefined,
      wordLen: game.word?.length ?? game.wordLen,
    };
  }
  return game;
}

export function consoleState(room: Room, selfName: string): "idle" | "waiting" | "active" {
  const game = room.games?.active;
  if (!game || game.status === "done") return "idle";
  if (game.gameType === "rps" && game.status === "picking" && (!game.players.includes(selfName) || !game.locked.includes(selfName))) {
    return "waiting";
  }
  if (game.gameType === "sync" && game.status === "answering" && (!game.players.includes(selfName) || !game.submitted.includes(selfName))) {
    return "waiting";
  }
  if (!game.players.includes(selfName)) return "waiting";
  return "active";
}

export function pollMs(room: Room | null) {
  const game = room?.games?.active;
  if (game?.gameType === "draw" && game.status === "play") return 700;
  if (game && game.status !== "done") return 1200;
  return 2500;
}

export function gameTitle(kind: GameKind) {
  if (kind === "sync") return "默契挑战";
  if (kind === "memory") return "记忆翻牌";
  if (kind === "draw") return "你画我猜";
  return "石头剪刀布";
}

export function pairLabel(id: string) {
  return MEMORY_PAIRS.find((item) => item.id === id)?.zh ?? id;
}

export function drawWord(id: string) {
  return DRAW_WORDS.find((item) => item.id === id);
}

const PICKS = new Set<RpsPick>(["rock", "scissors", "paper"]);
const KINDS = new Set<GameKind>(["rps", "sync", "memory", "draw"]);

export function sanitizeGames(raw: unknown): GameDesk {
  if (!raw || typeof raw !== "object") return emptyGames();
  const src = raw as Partial<GameDesk>;
  return {
    active: sanitizeSession(src.active),
    stamp: typeof src.stamp === "number" ? src.stamp : 0,
    recent: Array.isArray(src.recent)
      ? src.recent
          .filter((item) => item && typeof item.id === "string" && typeof item.titleZh === "string")
          .slice(0, 12)
          .map((item) => ({
            id: item.id,
            gameType: KINDS.has(item.gameType) ? item.gameType : "rps",
            titleZh: item.titleZh.slice(0, 80),
            at: typeof item.at === "number" ? item.at : 0,
          }))
      : [],
  };
}

function sanitizeSession(raw: unknown): GameSession | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Partial<GameSession> & { gameType?: string };
  if (src.gameType === "sync") return sanitizeSync(src as Partial<SyncSession>);
  if (src.gameType === "memory") return sanitizeMemory(src as Partial<MemorySession>);
  if (src.gameType === "draw") return sanitizeDraw(src as Partial<DrawSession>);
  return sanitizeRps(src as Partial<RpsSession>);
}

function takePlayers(raw: unknown) {
  return Array.isArray(raw)
    ? [...new Set(raw.filter((name): name is string => typeof name === "string" && Boolean(name.trim())))].slice(0, 24)
    : [];
}

function takeScores(players: string[], raw: unknown) {
  const scores: Record<string, number> = {};
  const src = raw && typeof raw === "object" ? (raw as Record<string, number>) : {};
  for (const name of players) {
    const value = src[name];
    scores[name] = typeof value === "number" ? Math.max(0, Math.min(99, value)) : 0;
  }
  return scores;
}

function baseFrom(src: Partial<GameSession>, players: string[], fallbackStatus: string) {
  return {
    id: typeof src.id === "string" ? src.id : "",
    players,
    scores: takeScores(players, src.scores),
    round: typeof src.round === "number" ? Math.max(1, src.round) : 1,
    createdAt: typeof src.createdAt === "number" ? src.createdAt : 0,
    updatedAt: typeof src.updatedAt === "number" ? src.updatedAt : 0,
    lastActionBy: typeof src.lastActionBy === "string" ? src.lastActionBy : players[0] ?? "",
    deadline: typeof src.deadline === "number" ? src.deadline : undefined,
    winner: typeof src.winner === "string" ? src.winner : undefined,
    status: typeof src.status === "string" ? src.status : fallbackStatus,
  };
}

function sanitizeRps(src: Partial<RpsSession>): RpsSession | null {
  if (src.gameType && src.gameType !== "rps") return null;
  if (typeof src.id !== "string") return null;
  if (src.status !== "picking" && src.status !== "reveal" && src.status !== "done") return null;
  const players = takePlayers(src.players);
  if (players.length < 2) return null;
  const picks: RpsSession["picks"] = {};
  if (src.picks && typeof src.picks === "object") {
    for (const [name, pick] of Object.entries(src.picks)) {
      if (players.includes(name) && PICKS.has(pick as RpsPick)) picks[name] = pick as RpsPick;
    }
  }
  const locked = (Array.isArray(src.locked) ? src.locked.filter((name) => players.includes(name)) : Object.keys(picks)).filter(
    (name) => Boolean(picks[name]),
  );
  return {
    ...baseFrom(src, players, "picking"),
    gameType: "rps",
    status: src.status,
    picks,
    locked,
  };
}

function sanitizeSync(src: Partial<SyncSession>): SyncSession | null {
  if (typeof src.id !== "string") return null;
  if (src.status !== "answering" && src.status !== "reveal" && src.status !== "done") return null;
  const players = takePlayers(src.players);
  if (players.length < 2) return null;
  const options = Array.isArray(src.options) ? src.options.filter((item) => typeof item === "string").slice(0, 6) : [];
  const answers: SyncSession["answers"] = {};
  if (src.answers && typeof src.answers === "object") {
    for (const [name, answer] of Object.entries(src.answers)) {
      if (players.includes(name) && typeof answer === "string") answers[name] = answer.slice(0, 24);
    }
  }
  return {
    ...baseFrom(src, players, "answering"),
    gameType: "sync",
    status: src.status,
    promptId: typeof src.promptId === "string" ? src.promptId : "",
    promptZh: typeof src.promptZh === "string" ? src.promptZh.slice(0, 80) : "",
    options,
    answers,
    submitted: (Array.isArray(src.submitted) ? src.submitted : []).filter((name) => players.includes(name)),
  };
}

function sanitizeMemory(src: Partial<MemorySession>): MemorySession | null {
  if (typeof src.id !== "string") return null;
  if (src.status !== "turn" && src.status !== "peek" && src.status !== "done") return null;
  const players = takePlayers(src.players);
  if (players.length < 2) return null;
  const cards: MemoryCard[] = Array.isArray(src.cards)
    ? src.cards
        .filter((card) => card && typeof card.id === "string")
        .slice(0, 24)
        .map((card) => ({
          id: card.id,
          pair: typeof card.pair === "string" ? card.pair : "",
          face: card.face === "up" || card.face === "matched" ? card.face : "down",
        }))
    : [];
  const peek =
    src.peek && typeof src.peek.by === "string" && typeof src.peek.a === "string"
      ? {
          by: src.peek.by,
          a: src.peek.a,
          b: typeof src.peek.b === "string" ? src.peek.b : undefined,
          until: typeof src.peek.until === "number" ? src.peek.until : 0,
        }
      : null;
  return {
    ...baseFrom(src, players, "turn"),
    gameType: "memory",
    status: src.status,
    cards,
    turn: typeof src.turn === "string" && players.includes(src.turn) ? src.turn : players[0],
    peek,
  };
}

function sanitizeDraw(src: Partial<DrawSession>): DrawSession | null {
  if (typeof src.id !== "string") return null;
  if (src.status !== "play" && src.status !== "reveal" && src.status !== "done") return null;
  const players = takePlayers(src.players);
  if (players.length < 2) return null;
  const strokes: DrawStroke[] = Array.isArray(src.strokes)
    ? src.strokes
        .filter((item) => item && typeof item.id === "string" && Array.isArray(item.points))
        .slice(0, 220)
        .map((item) => ({
          id: item.id.slice(0, 40),
          color: typeof item.color === "string" ? item.color.slice(0, 20) : "#4a3b36",
          width: typeof item.width === "number" ? Math.max(2, Math.min(18, item.width)) : 4,
          mode: item.mode === "erase" ? "erase" : "pen",
          points: item.points.filter((n): n is number => typeof n === "number").slice(0, 160),
        }))
    : [];
  return {
    ...baseFrom(src, players, "play"),
    gameType: "draw",
    status: src.status,
    artist: typeof src.artist === "string" ? src.artist : players[0],
    wordId: typeof src.wordId === "string" ? src.wordId : "",
    word: typeof src.word === "string" ? src.word.slice(0, 12) : undefined,
    wordLen: typeof src.wordLen === "number" ? src.wordLen : undefined,
    strokes,
    guesses: Array.isArray(src.guesses)
      ? src.guesses
          .filter((item) => item && typeof item.by === "string" && typeof item.text === "string")
          .slice(-40)
          .map((item) => ({
            by: item.by,
            text: item.text.slice(0, 24),
            at: typeof item.at === "number" ? item.at : 0,
            correct: item.correct ? true : undefined,
          }))
      : [],
    order: takePlayers(src.order).length ? takePlayers(src.order) : players,
  };
}

export function mergeGames(a?: GameDesk, b?: GameDesk): GameDesk {
  const left = a ?? emptyGames();
  const right = b ?? emptyGames();
  const recent = new Map<string, GameDesk["recent"][number]>();
  for (const item of [...right.recent, ...left.recent]) recent.set(item.id, item);
  const leftStamp = left.stamp ?? 0;
  const rightStamp = right.stamp ?? 0;
  const stamp = Math.max(leftStamp, rightStamp);
  const active =
    leftStamp === rightStamp
      ? mergeSession(left.active, right.active)
      : leftStamp > rightStamp
        ? left.active
        : right.active;
  return {
    active,
    stamp,
    recent: [...recent.values()].sort((x, y) => y.at - x.at).slice(0, 12),
  };
}

function mergeSession(a: GameSession | null, b: GameSession | null): GameSession | null {
  if (!a) return b;
  if (!b) return a;
  if (a.gameType !== b.gameType || a.id !== b.id) return a.updatedAt >= b.updatedAt ? a : b;
  if (a.gameType === "rps" && b.gameType === "rps") return mergeRps(a, b);
  if (a.gameType === "draw" && b.gameType === "draw") {
    const primary = a.updatedAt >= b.updatedAt ? a : b;
    const secondary = primary === a ? b : a;
    const seen = new Set(primary.strokes.map((item) => item.id));
    const strokes = [...primary.strokes];
    for (const stroke of secondary.strokes) {
      if (!seen.has(stroke.id)) strokes.push(stroke);
    }
    return { ...primary, strokes: strokes.slice(-220) };
  }
  return a.updatedAt >= b.updatedAt ? a : b;
}

function mergeRps(a: RpsSession, b: RpsSession): RpsSession {
  const rank = { picking: 0, reveal: 1, done: 2 };
  const primary =
    a.round !== b.round
      ? a.round >= b.round
        ? a
        : b
      : rank[a.status] !== rank[b.status]
        ? rank[a.status] > rank[b.status]
          ? a
          : b
        : a.updatedAt >= b.updatedAt
          ? a
          : b;
  const secondary = primary === a ? b : a;
  const scores = { ...secondary.scores };
  for (const [name, score] of Object.entries(primary.scores)) {
    scores[name] = Math.max(scores[name] ?? 0, score);
  }
  const players = [...new Set([...primary.players, ...secondary.players])];
  if (primary.round !== secondary.round) {
    return {
      ...primary,
      players,
      scores,
      winner: primary.winner || secondary.winner,
    };
  }
  const picks = { ...secondary.picks };
  for (const [name, pick] of Object.entries(primary.picks)) {
    if (pick) picks[name] = pick;
  }
  const locked = [...new Set([...primary.locked, ...secondary.locked])].filter((name) => Boolean(picks[name]));
  return {
    ...primary,
    players,
    picks,
    locked,
    scores,
    winner: primary.winner || secondary.winner,
  };
}
