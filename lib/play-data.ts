export const SYNC_PROMPTS = [
  {
    id: "eat",
    zh: "今晚最想吃什么？",
    options: ["火锅", "拉面", "随便吃", "先喝奶茶"],
  },
  {
    id: "night",
    zh: "现在更想怎样待着？",
    options: ["看电影", "打游戏", "聊天", "什么都不做"],
  },
  {
    id: "weather",
    zh: "此刻窗外更像哪一种？",
    options: ["暖暖的", "有点困", "想出门", "想盖被子"],
  },
  {
    id: "sweet",
    zh: "现在想吃甜的吗？",
    options: ["想", "再等一会儿", "咸的更好", "喝水就好"],
  },
  {
    id: "cat",
    zh: "懒猫现在最该做什么？",
    options: ["睡觉", "吃饭", "挨摸", "看窗外"],
  },
  {
    id: "song",
    zh: "屋里该放什么？",
    options: ["轻的歌", "热闹一点", "安静", "随你"],
  },
] as const;

export const MEMORY_PAIRS = [
  { id: "cat", zh: "猫" },
  { id: "fish", zh: "鱼" },
  { id: "moon", zh: "月" },
  { id: "tea", zh: "茶" },
  { id: "mail", zh: "信" },
  { id: "flower", zh: "花" },
  { id: "star", zh: "星" },
  { id: "yarn", zh: "线" },
] as const;

export const DRAW_WORDS = [
  { id: "cat", zh: "懒猫", hint: "两个字" },
  { id: "fish", zh: "小鱼", hint: "两个字" },
  { id: "moon", zh: "月亮", hint: "两个字" },
  { id: "cup", zh: "杯子", hint: "两个字" },
  { id: "letter", zh: "信封", hint: "两个字" },
  { id: "flower", zh: "小花", hint: "两个字" },
  { id: "house", zh: "小屋", hint: "两个字" },
  { id: "cloud", zh: "云朵", hint: "两个字" },
  { id: "fishball", zh: "鱼丸", hint: "两个字" },
  { id: "lamp", zh: "台灯", hint: "两个字" },
  { id: "book", zh: "故事", hint: "两个字" },
  { id: "rain", zh: "下雨", hint: "两个字" },
] as const;

export const SYNC_GOAL = 3;
export const RPS_GOAL = 2;
export const SYNC_MS = 45_000;
export const MEMORY_TURN_MS = 20_000;
export const MEMORY_PEEK_MS = 1_200;
export const DRAW_MS = 75_000;
export const DRAW_REVEAL_MS = 4_000;
