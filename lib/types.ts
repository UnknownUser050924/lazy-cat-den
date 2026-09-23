export type Profile = {
  gender: string;
  signature: string;
  vibes: string[];
  formId: string;
  thinking: string;
  need: string;
  want: string;
  pocket: Record<string, string>;
  wall: string;
  objects: string[];
  knowMe: { promptId: string; answer: string }[];
  guesses: { target: string; promptId: string; correct: boolean; at: number }[];
};

export type Member = {
  displayName: string;
  lastSeen: number;
  statusId: string | null;
  visitDays: string[];
  profile: Profile;
  claimHash?: string;
};

export type Question = {
  id: string;
  question: string;
  askedBy: string;
  answer: string | null;
  answeredBy: string | null;
  createdAt: number;
};

export type Wish = {
  id: string;
  text: string;
  done: boolean;
  addedBy: string;
  createdAt: number;
};

export type Note = {
  id: string;
  text: string;
  author: string;
  color: string;
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  author: string;
  text: string;
  createdAt: number;
};

export type DrawResult = {
  id: string;
  type: string;
  labelZh: string;
  labelEn: string;
  winner: string;
  createdAt: number;
};

export type Letter = {
  id: string;
  from: string;
  text: string;
  createdAt: number;
  openedAt: number | null;
  openedBy: string | null;
};

export type DailyAnswer = {
  name: string;
  text: string;
  at: number;
};

export type DailyPrompt = {
  date: string;
  promptId: string;
  answers: DailyAnswer[];
};

export type CalEvent = {
  id: string;
  date: string;
  eventType: string;
  title: string;
  addedBy: string;
  createdAt: number;
};

export type Gift = {
  id: string;
  from: string;
  to: string;
  kind: string;
  createdAt: number;
  note?: string;
};

export type Memory = {
  id: string;
  kind: string;
  titleZh: string;
  titleEn: string;
  actor: string;
  createdAt: number;
  place?: string;
};

export type Pat = {
  id: string;
  name: string;
  at: number;
};

export type CatState = {
  mood: number;
  lastPat: number;
  lastCheckin: number;
  decayAppliedOn: string;
  lastToy?: number;
  lastFeed?: number;
};

export type RpsPick = "rock" | "scissors" | "paper";

export type RpsSession = {
  id: string;
  gameType: "rps";
  status: "picking" | "reveal" | "done";
  players: string[];
  picks: Partial<Record<string, RpsPick>>;
  locked: string[];
  scores: Record<string, number>;
  round: number;
  createdAt: number;
  updatedAt: number;
  lastActionBy: string;
  winner?: string;
};

export type GameRecent = {
  id: string;
  gameType: "rps";
  titleZh: string;
  at: number;
};

export type GameDesk = {
  active: RpsSession | null;
  recent: GameRecent[];
  stamp?: number;
};

export type Room = {
  id: string;
  createdAt: number;
  members: Member[];
  questions: Question[];
  wishlist: Wish[];
  notes: Note[];
  messages: ChatMessage[];
  draws: DrawResult[];
  letters: Letter[];
  daily: DailyPrompt[];
  events: CalEvent[];
  gifts: Gift[];
  memories: Memory[];
  pats: Pat[];
  cat: CatState;
  games: GameDesk;
  clearedSeats: string[];
  banned: string[];
  away?: Member[];
  admin?: boolean;
  claim?: string;
};

export type RoomAction =
  | { type: "join"; displayName: string }
  | { type: "checkin"; displayName: string }
  | { type: "pat"; displayName: string }
  | { type: "playToy"; displayName: string }
  | { type: "feedCat"; displayName: string }
  | { type: "ask"; displayName: string; question: string }
  | { type: "answer"; displayName: string; questionId: string; answer: string }
  | { type: "addWish"; displayName: string; text: string }
  | { type: "toggleWish"; displayName: string; wishId: string }
  | { type: "removeWish"; displayName: string; wishId: string }
  | { type: "draw"; displayName: string; drawType: string }
  | { type: "addNote"; displayName: string; text: string }
  | { type: "sendChat"; displayName: string; text: string }
  | { type: "removeNote"; displayName: string; noteId: string }
  | { type: "setStatus"; displayName: string; statusId: string }
  | { type: "sendLetter"; displayName: string; text: string }
  | { type: "openLetter"; displayName: string; letterId: string }
  | { type: "answerDaily"; displayName: string; text: string }
  | { type: "addEvent"; displayName: string; date: string; eventType: string; title: string }
  | { type: "removeEvent"; displayName: string; eventId: string }
  | { type: "setVibes"; displayName: string; vibes: string[] }
  | { type: "setForm"; displayName: string; formId: string }
  | { type: "setThoughts"; displayName: string; thinking: string; need: string; want: string }
  | { type: "setGender"; displayName: string; gender: string }
  | { type: "setSignature"; displayName: string; signature: string }
  | { type: "setPocket"; displayName: string; key: string; value: string }
  | { type: "setCorner"; displayName: string; wall: string; objects: string[] }
  | { type: "setKnowMe"; displayName: string; promptId: string; answer: string }
  | { type: "guessKnowMe"; displayName: string; target: string; promptId: string; guess: string }
  | { type: "gift"; displayName: string; target: string; kind: string; note?: string }
  | { type: "clearSeat"; displayName: string; target: string }
  | { type: "restoreSeat"; displayName: string; target: string }
  | { type: "banPerson"; displayName: string; target: string }
  | { type: "unbanPerson"; displayName: string; target: string }
  | { type: "wipeCorner"; displayName: string; target: string }
  | { type: "erasePerson"; displayName: string; target: string }
  | { type: "startRps"; displayName: string }
  | { type: "joinRps"; displayName: string }
  | { type: "lockRps"; displayName: string; pick: RpsPick }
  | { type: "nextRps"; displayName: string }
  | { type: "clearRps"; displayName: string };

export type ClientAction = RoomAction extends infer T
  ? T extends { displayName: string }
    ? Omit<T, "displayName">
    : never
  : never;
