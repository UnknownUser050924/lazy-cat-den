import type { GameDesk, Room, RpsPick, RpsSession } from "@/lib/types";

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

export function presentRoom(room: Room, viewer: string): Room {
  const active = room.games?.active;
  if (!active || active.status !== "picking") return room;
  const picks: RpsSession["picks"] = {};
  const mine = viewer ? active.picks[viewer] : undefined;
  if (mine) picks[viewer] = mine;
  return {
    ...room,
    games: {
      active: { ...active, picks },
      recent: room.games.recent ?? [],
      stamp: room.games.stamp ?? 0,
    },
  };
}

export function consoleState(room: Room, selfName: string): "idle" | "waiting" | "active" {
  const game = room.games?.active;
  if (!game || game.status === "done") return "idle";
  if (game.status === "picking" && (!game.players.includes(selfName) || !game.locked.includes(selfName))) {
    return "waiting";
  }
  return "active";
}

const PICKS = new Set<RpsPick>(["rock", "scissors", "paper"]);

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
            gameType: "rps" as const,
            titleZh: item.titleZh.slice(0, 80),
            at: typeof item.at === "number" ? item.at : 0,
          }))
      : [],
  };
}

function sanitizeSession(raw: unknown): RpsSession | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Partial<RpsSession>;
  if (src.gameType !== "rps" || typeof src.id !== "string") return null;
  if (src.status !== "picking" && src.status !== "reveal" && src.status !== "done") return null;
  const players = Array.isArray(src.players)
    ? [...new Set(src.players.filter((name) => typeof name === "string" && name.trim()))].slice(0, 24)
    : [];
  if (players.length < 2) return null;
  const picks: RpsSession["picks"] = {};
  if (src.picks && typeof src.picks === "object") {
    for (const [name, pick] of Object.entries(src.picks)) {
      if (players.includes(name) && PICKS.has(pick as RpsPick)) picks[name] = pick as RpsPick;
    }
  }
  const scores: Record<string, number> = {};
  for (const name of players) {
    const value = src.scores?.[name];
    scores[name] = typeof value === "number" ? Math.max(0, Math.min(9, value)) : 0;
  }
  const locked = (Array.isArray(src.locked) ? src.locked.filter((name) => players.includes(name)) : Object.keys(picks)).filter(
    (name) => Boolean(picks[name]),
  );
  return {
    id: src.id,
    gameType: "rps",
    status: src.status,
    players,
    picks,
    locked,
    scores,
    round: typeof src.round === "number" ? Math.max(1, src.round) : 1,
    createdAt: typeof src.createdAt === "number" ? src.createdAt : 0,
    updatedAt: typeof src.updatedAt === "number" ? src.updatedAt : 0,
    lastActionBy: typeof src.lastActionBy === "string" ? src.lastActionBy : players[0],
    winner: typeof src.winner === "string" ? src.winner : undefined,
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

function mergeSession(a: RpsSession | null, b: RpsSession | null): RpsSession | null {
  if (!a) return b;
  if (!b) return a;
  if (a.id !== b.id) return a.updatedAt >= b.updatedAt ? a : b;
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
