export type Member = {
  displayName: string;
  lastSeen: number;
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

export type DrawResult = {
  id: string;
  type: string;
  labelZh: string;
  labelEn: string;
  winner: string;
  createdAt: number;
};

export type CatState = {
  mood: number;
  lastPat: number;
  lastCheckin: number;
  decayAppliedOn: string;
};

export type Room = {
  id: string;
  createdAt: number;
  members: Member[];
  questions: Question[];
  wishlist: Wish[];
  notes: Note[];
  draws: DrawResult[];
  cat: CatState;
};

export type RoomAction =
  | { type: "join"; displayName: string }
  | { type: "checkin"; displayName: string }
  | { type: "pat"; displayName: string }
  | { type: "ask"; displayName: string; question: string }
  | { type: "answer"; displayName: string; questionId: string; answer: string }
  | { type: "addWish"; displayName: string; text: string }
  | { type: "toggleWish"; displayName: string; wishId: string }
  | { type: "removeWish"; displayName: string; wishId: string }
  | { type: "draw"; displayName: string; drawType: string }
  | { type: "addNote"; displayName: string; text: string }
  | { type: "removeNote"; displayName: string; noteId: string };

export type ClientAction = RoomAction extends infer T
  ? T extends { displayName: string }
    ? Omit<T, "displayName">
    : never
  : never;
