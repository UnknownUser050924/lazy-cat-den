export const APP_NAME_ZH = "懒猫小屋";
export const APP_NAME_EN = "Lazy Cat Den";
export const DEFAULT_ROOM = "yiyi-and-you";
export const DEFAULT_NAMES = ["嘉怡", "宝宝"] as const;

export const DRAW_TYPES = [
  { id: "who-pays", zh: "谁请客", en: "Who pays", emoji: "🍜" },
  { id: "who-dinner", zh: "谁选晚餐", en: "Who chooses dinner", emoji: "🍱" },
  { id: "who-movie", zh: "谁选电影", en: "Who chooses movie", emoji: "🎬" },
  { id: "who-texts", zh: "今晚谁先传讯", en: "Who texts first tonight", emoji: "💌" },
] as const;

export const NOTE_COLORS = [
  "#F8E1B0",
  "#F5C6CE",
  "#D4E5C5",
  "#D5E3F0",
  "#E8D5F2",
];

export const SESSION_KEY = "lazy-cat-den-session";

export function slugifyRoom(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .slice(0, 48);
}
