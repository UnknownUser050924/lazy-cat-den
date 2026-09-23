import { ONLINE_MS } from "@/lib/constants";
import {
  DRAW_MS,
  DRAW_REVEAL_MS,
  DRAW_WORDS,
  MEMORY_PAIRS,
  MEMORY_PEEK_MS,
  MEMORY_TURN_MS,
  RPS_GOAL,
  SYNC_GOAL,
  SYNC_MS,
  SYNC_PROMPTS,
} from "@/lib/play-data";
import { rpsRoundWinners } from "@/lib/games";
import type {
  DrawStroke,
  GameKind,
  GameSession,
  MemoryCard,
  MemorySession,
  Room,
  RoomAction,
  RpsPick,
  SyncSession,
} from "@/lib/types";
import type { Memory } from "@/lib/types";

type Remember = (room: Room, memory: Omit<Memory, "id" | "createdAt">) => void;

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function livePlayers(room: Room, name: string, now: number) {
  const names = room.members
    .filter((member) => now - member.lastSeen < ONLINE_MS)
    .map((member) => member.displayName);
  if (!names.includes(name)) names.unshift(name);
  return [...new Set(names)];
}

function scoresFor(players: string[], prev?: Record<string, number>) {
  const scores: Record<string, number> = {};
  for (const player of players) scores[player] = prev?.[player] ?? 0;
  return scores;
}

function addPlayer(game: GameSession, name: string) {
  if (game.players.includes(name)) return;
  game.players = [...game.players, name];
  game.scores[name] = game.scores[name] ?? 0;
  if (game.gameType === "draw" && !game.order.includes(name)) game.order = [...game.order, name];
}

function finishGame(room: Room, game: GameSession, now: number, remember: Remember, titleZh: string, titleEn: string, actor: string) {
  game.status = "done" as typeof game.status;
  game.updatedAt = now;
  room.games.stamp = now;
  const top = Math.max(0, ...game.players.map((player) => game.scores[player] ?? 0));
  const leaders = game.players.filter((player) => (game.scores[player] ?? 0) === top);
  game.winner = leaders.length === 1 ? leaders[0] : undefined;
  room.games.recent.unshift({
    id: game.id,
    gameType: game.gameType,
    titleZh,
    at: now,
  });
  room.games.recent = room.games.recent.slice(0, 12);
  remember(room, { kind: "game", titleZh, titleEn, actor, place: "games" });
}

function pickPrompt(round: number) {
  return SYNC_PROMPTS[(round - 1) % SYNC_PROMPTS.length];
}

function pickWord(used: string[]) {
  const remain = DRAW_WORDS.filter((item) => !used.includes(item.id));
  const pool = remain.length ? remain : DRAW_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffleCards(now: number): MemoryCard[] {
  const cards: MemoryCard[] = MEMORY_PAIRS.flatMap((pair) => [
    { id: `${pair.id}-a-${now.toString(36)}`, pair: pair.id, face: "down" },
    { id: `${pair.id}-b-${now.toString(36)}`, pair: pair.id, face: "down" },
  ]);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function nextPlayer(players: string[], current: string) {
  const index = Math.max(0, players.indexOf(current));
  return players[(index + 1) % players.length];
}

function leadersOf(game: GameSession) {
  const top = Math.max(0, ...game.players.map((player) => game.scores[player] ?? 0));
  return game.players.filter((player) => (game.scores[player] ?? 0) === top);
}

export function tickGames(room: Room, now: number, remember: Remember) {
  const game = room.games?.active;
  if (!game || game.status === "done") return false;
  const seated = new Set(room.members.map((member) => member.displayName));
  const before = game.players.join("|");
  game.players = game.players.filter((player) => seated.has(player));
  if (game.gameType === "draw") game.order = game.order.filter((player) => seated.has(player));
  if (game.players.length < 2) {
    room.games.active = null;
    room.games.stamp = now;
    return true;
  }
  let dirty = game.players.join("|") !== before;

  if (game.gameType === "sync" && game.status === "answering" && game.deadline && now >= game.deadline) {
    revealSync(room, game, now, remember);
    return true;
  }
  if (game.gameType === "memory") {
    if (game.status === "peek" && game.peek && now >= game.peek.until) {
      resolvePeek(room, game, now, remember);
      return true;
    }
    if (game.status === "turn" && game.deadline && now >= game.deadline) {
      if (game.peek?.a) {
        const card = game.cards.find((item) => item.id === game.peek?.a);
        if (card && card.face === "up") card.face = "down";
        game.peek = null;
      }
      game.turn = nextPlayer(game.players, game.turn);
      game.deadline = now + MEMORY_TURN_MS;
      game.updatedAt = now;
      room.games.stamp = now;
      return true;
    }
  }
  if (game.gameType === "draw") {
    if (game.status === "play" && game.deadline && now >= game.deadline) {
      beginDrawReveal(game, now);
      return true;
    }
    if (game.status === "reveal" && game.deadline && now >= game.deadline) {
      advanceDraw(room, game, now, remember);
      return true;
    }
  }
  return dirty;
}

function revealSync(room: Room, game: SyncSession, now: number, remember: Remember) {
  const counts = new Map<string, string[]>();
  for (const player of game.players) {
    const answer = game.answers[player];
    if (!answer) continue;
    const list = counts.get(answer) ?? [];
    list.push(player);
    counts.set(answer, list);
  }
  for (const names of counts.values()) {
    if (names.length < 2) continue;
    for (const player of names) game.scores[player] = (game.scores[player] ?? 0) + 1;
  }
  const top = Math.max(0, ...game.players.map((player) => game.scores[player] ?? 0));
  const leaders = leadersOf(game);
  const finished = top >= SYNC_GOAL && leaders.length === 1;
  game.status = finished ? "done" : "reveal";
  game.updatedAt = now;
  room.games.stamp = now;
  if (finished) {
    finishGame(room, game, now, remember, `${leaders[0]}赢了默契挑战`, "Won compatibility challenge", leaders[0]);
  }
}

function resolvePeek(room: Room, game: MemorySession, now: number, remember: Remember) {
  const a = game.cards.find((item) => item.id === game.peek?.a);
  const b = game.cards.find((item) => item.id === game.peek?.b);
  const match = Boolean(a && b && a.pair && a.pair === b.pair);
  if (match && a && b) {
    a.face = "matched";
    b.face = "matched";
    game.scores[game.peek?.by ?? game.turn] = (game.scores[game.peek?.by ?? game.turn] ?? 0) + 1;
    game.turn = game.peek?.by ?? game.turn;
  } else {
    if (a && a.face === "up") a.face = "down";
    if (b && b.face === "up") b.face = "down";
    game.turn = nextPlayer(game.players, game.peek?.by ?? game.turn);
  }
  game.peek = null;
  const leftover = game.cards.some((card) => card.face !== "matched");
  if (!leftover) {
    const leaders = leadersOf(game);
    finishGame(
      room,
      game,
      now,
      remember,
      leaders.length === 1 ? `${leaders[0]}赢了记忆翻牌` : "记忆翻牌平手",
      "Finished memory match",
      game.lastActionBy,
    );
    return;
  }
  game.status = "turn";
  game.deadline = now + MEMORY_TURN_MS;
  game.updatedAt = now;
  room.games.stamp = now;
}

function beginDrawReveal(game: Extract<GameSession, { gameType: "draw" }>, now: number) {
  game.status = "reveal";
  game.deadline = now + DRAW_REVEAL_MS;
  game.updatedAt = now;
}

function advanceDraw(room: Room, game: Extract<GameSession, { gameType: "draw" }>, now: number, remember: Remember) {
  const used = [game.wordId];
  const nextArtist = nextPlayer(game.order.length ? game.order : game.players, game.artist);
  if (game.round >= (game.order.length || game.players.length)) {
    const leaders = leadersOf(game);
    finishGame(
      room,
      game,
      now,
      remember,
      leaders.length === 1 ? `${leaders[0]}赢了你画我猜` : "你画我猜平手",
      "Finished draw and guess",
      game.lastActionBy,
    );
    return;
  }
  const word = pickWord(used);
  game.round += 1;
  game.artist = nextArtist;
  game.wordId = word.id;
  game.word = word.zh;
  game.wordLen = word.zh.length;
  game.strokes = [];
  game.guesses = [];
  game.status = "play";
  game.deadline = now + DRAW_MS;
  game.updatedAt = now;
  room.games.stamp = now;
}

function startKind(room: Room, name: string, kind: GameKind, now: number) {
  const players = livePlayers(room, name, now);
  if (players.length < 2) throw new Error("等另一个人走进小屋，就可以一起玩。");
  if (room.games.active?.status === "done") room.games.active = null;
  if (room.games.active) throw new Error("已经有一局了");
  const scores = scoresFor(players);
  room.games.stamp = now;
  if (kind === "rps") {
    room.games.active = {
      id: uid(),
      gameType: "rps",
      status: "picking",
      players,
      picks: {},
      locked: [],
      scores,
      round: 1,
      createdAt: now,
      updatedAt: now,
      lastActionBy: name,
    };
    return;
  }
  if (kind === "sync") {
    const prompt = pickPrompt(1);
    room.games.active = {
      id: uid(),
      gameType: "sync",
      status: "answering",
      players,
      scores,
      round: 1,
      createdAt: now,
      updatedAt: now,
      lastActionBy: name,
      deadline: now + SYNC_MS,
      promptId: prompt.id,
      promptZh: prompt.zh,
      options: [...prompt.options],
      answers: {},
      submitted: [],
    };
    return;
  }
  if (kind === "memory") {
    room.games.active = {
      id: uid(),
      gameType: "memory",
      status: "turn",
      players,
      scores,
      round: 1,
      createdAt: now,
      updatedAt: now,
      lastActionBy: name,
      deadline: now + MEMORY_TURN_MS,
      cards: shuffleCards(now),
      turn: name,
      peek: null,
    };
    return;
  }
  const word = pickWord([]);
  if (kind !== "draw") throw new Error("换一个游戏");
  room.games.active = {
    id: uid(),
    gameType: "draw",
    status: "play",
    players,
    scores,
    round: 1,
    createdAt: now,
    updatedAt: now,
    lastActionBy: name,
    deadline: now + DRAW_MS,
    artist: name,
    wordId: word.id,
    word: word.zh,
    wordLen: word.zh.length,
    strokes: [],
    guesses: [],
    order: players,
  };
}

export function applyPlay(room: Room, action: RoomAction, name: string, now: number, remember: Remember) {
  switch (action.type) {
    case "startRps":
      startKind(room, name, "rps", now);
      return true;
    case "startGame":
      startKind(room, name, action.gameType, now);
      return true;
    case "joinRps":
    case "joinGame": {
      const game = room.games.active;
      if (!game || game.status === "done") throw new Error("这局还没开始");
      addPlayer(game, name);
      game.updatedAt = now;
      game.lastActionBy = name;
      return true;
    }
    case "lockRps": {
      const game = room.games.active;
      if (!game || game.gameType !== "rps" || game.status !== "picking") throw new Error("这局还没开始");
      addPlayer(game, name);
      if (game.locked.includes(name)) throw new Error("已经选好了");
      const pick = action.pick;
      if (pick !== "rock" && pick !== "scissors" && pick !== "paper") throw new Error("选一个");
      game.picks[name] = pick as RpsPick;
      game.locked = [...new Set([...game.locked, name])];
      game.updatedAt = now;
      game.lastActionBy = name;
      const ready =
        game.players.length >= 2 && game.players.every((player) => game.locked.includes(player) && game.picks[player]);
      if (ready) {
        for (const winner of rpsRoundWinners(game.picks)) {
          game.scores[winner] = (game.scores[winner] ?? 0) + 1;
        }
        const top = Math.max(0, ...game.players.map((player) => game.scores[player] ?? 0));
        const leaders = game.players.filter((player) => (game.scores[player] ?? 0) === top);
        const finished = top >= RPS_GOAL && leaders.length === 1;
        game.status = finished ? "done" : "reveal";
        room.games.stamp = now;
        if (finished) {
          finishGame(room, game, now, remember, `${leaders[0]}赢了石头剪刀布`, "Played rock paper scissors", name);
        }
      }
      return true;
    }
    case "nextRps": {
      const game = room.games.active;
      if (!game || game.gameType !== "rps" || game.status !== "reveal") throw new Error("这回合还没揭晓");
      game.picks = {};
      game.locked = [];
      game.round += 1;
      game.status = "picking";
      game.updatedAt = now;
      game.lastActionBy = name;
      room.games.stamp = now;
      return true;
    }
    case "clearRps": {
      if (!room.games.active) return true;
      room.games.stamp = now;
      room.games.active = null;
      return true;
    }
    case "submitSync": {
      const game = room.games.active;
      if (!game || game.gameType !== "sync" || game.status !== "answering") throw new Error("这局还没开始");
      addPlayer(game, name);
      if (game.submitted.includes(name)) throw new Error("已经答过了");
      const answer = action.answer.trim().slice(0, 24);
      if (!game.options.includes(answer)) throw new Error("选一个答案");
      game.answers[name] = answer;
      game.submitted = [...new Set([...game.submitted, name])];
      game.updatedAt = now;
      game.lastActionBy = name;
      if (game.players.length >= 2 && game.players.every((player) => game.submitted.includes(player))) {
        revealSync(room, game, now, remember);
      }
      return true;
    }
    case "nextSync": {
      const game = room.games.active;
      if (!game || game.gameType !== "sync" || game.status !== "reveal") throw new Error("这回合还没揭晓");
      const prompt = pickPrompt(game.round + 1);
      game.round += 1;
      game.promptId = prompt.id;
      game.promptZh = prompt.zh;
      game.options = [...prompt.options];
      game.answers = {};
      game.submitted = [];
      game.status = "answering";
      game.deadline = now + SYNC_MS;
      game.updatedAt = now;
      game.lastActionBy = name;
      room.games.stamp = now;
      return true;
    }
    case "flipMemory": {
      const game = room.games.active;
      if (!game || game.gameType !== "memory") throw new Error("这局还没开始");
      addPlayer(game, name);
      if (game.status !== "turn") throw new Error("还不能翻");
      if (game.turn !== name) throw new Error("还没轮到你");
      const card = game.cards.find((item) => item.id === action.cardId);
      if (!card || card.face !== "down") throw new Error("这张不能翻");
      if (!game.peek) {
        card.face = "up";
        game.peek = { by: name, a: card.id, until: now + MEMORY_TURN_MS };
        game.updatedAt = now;
        game.lastActionBy = name;
        return true;
      }
      if (game.peek.by !== name || game.peek.b) throw new Error("等一下");
      if (game.peek.a === card.id) throw new Error("换一张");
      card.face = "up";
      game.peek = { ...game.peek, b: card.id, until: now + MEMORY_PEEK_MS };
      game.status = "peek";
      game.updatedAt = now;
      game.lastActionBy = name;
      room.games.stamp = now;
      if (MEMORY_PEEK_MS <= 0) resolvePeek(room, game, now, remember);
      return true;
    }
    case "drawStroke": {
      const game = room.games.active;
      if (!game || game.gameType !== "draw" || game.status !== "play") throw new Error("现在不能画");
      if (game.artist !== name) throw new Error("现在轮到别人画");
      const stroke = cleanStroke(action.stroke);
      if (!stroke) throw new Error("画一下再送出");
      game.strokes = [...game.strokes, stroke].slice(-220);
      game.updatedAt = now;
      game.lastActionBy = name;
      room.games.stamp = now;
      return true;
    }
    case "drawClear": {
      const game = room.games.active;
      if (!game || game.gameType !== "draw" || game.status !== "play") throw new Error("现在不能画");
      if (game.artist !== name) throw new Error("现在轮到别人画");
      game.strokes = [];
      game.updatedAt = now;
      game.lastActionBy = name;
      room.games.stamp = now;
      return true;
    }
    case "drawGuess": {
      const game = room.games.active;
      if (!game || game.gameType !== "draw" || game.status !== "play") throw new Error("现在不能猜");
      if (game.artist === name) throw new Error("画画的人不能猜");
      addPlayer(game, name);
      const text = action.text.trim().slice(0, 24);
      if (!text) throw new Error("先写一个");
      const secret = game.word ?? DRAW_WORDS.find((item) => item.id === game.wordId)?.zh ?? "";
      const correct = normalize(text) === normalize(secret);
      game.guesses.push({ by: name, text, at: now, correct: correct || undefined });
      game.guesses = game.guesses.slice(-40);
      game.updatedAt = now;
      game.lastActionBy = name;
      if (correct) {
        game.scores[name] = (game.scores[name] ?? 0) + 2;
        game.scores[game.artist] = (game.scores[game.artist] ?? 0) + 1;
        beginDrawReveal(game, now);
        room.games.stamp = now;
      }
      return true;
    }
    case "nextDraw": {
      const game = room.games.active;
      if (!game || game.gameType !== "draw" || game.status !== "reveal") throw new Error("这回合还没揭晓");
      advanceDraw(room, game, now, remember);
      return true;
    }
    default:
      return false;
  }
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function cleanStroke(raw: DrawStroke | undefined): DrawStroke | null {
  if (!raw || typeof raw.id !== "string" || !Array.isArray(raw.points)) return null;
  const points = raw.points.filter((n): n is number => typeof n === "number").slice(0, 160);
  if (points.length < 2) return null;
  return {
    id: raw.id.slice(0, 40) || uid(),
    color: typeof raw.color === "string" ? raw.color.slice(0, 20) : "#4a3b36",
    width: typeof raw.width === "number" ? Math.max(2, Math.min(18, raw.width)) : 4,
    mode: raw.mode === "erase" ? "erase" : "pen",
    points,
  };
}
