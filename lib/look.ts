export const CHARACTERS = [
  { id: "window-seat", zh: "窗边坐着", src: "/assets/people/person-window-seat.png" },
  { id: "sofa", zh: "沙发盘腿", src: "/assets/people/person-sofa.png" },
  { id: "left-chair", zh: "靠椅坐着", src: "/assets/people/person-left-chair.png" },
  { id: "right-chair", zh: "捧杯坐着", src: "/assets/people/person-right-chair.png" },
] as const;

export const FRAMES = [
  { id: "", zh: "不加框" },
  { id: "rose-garden", zh: "蔷薇花园" },
  { id: "moonlit-silver", zh: "月光银饰" },
  { id: "forest-wreath", zh: "森林花环" },
  { id: "cloud-porcelain", zh: "云纹瓷边" },
  { id: "hearth-copper", zh: "炉火铜饰" },
  { id: "starlit-brass", zh: "星砂黄铜" },
  { id: "aurora-ribbon", zh: "极光缎带" },
  { id: "pearl-lace", zh: "珍珠蕾丝" },
] as const;

export const THEMES = [
  { id: "", zh: "默认" },
  { id: "rose-atelier", zh: "蔷薇画室" },
  { id: "moon-room", zh: "月下小屋" },
  { id: "greenhouse", zh: "夜色温室" },
  { id: "dusk-library", zh: "黄昏书房" },
  { id: "peach-letter", zh: "桃色来信" },
  { id: "observatory", zh: "星夜阁楼" },
] as const;

export const EFFECTS = [
  { id: "none", zh: "关闭" },
  { id: "fireflies", zh: "萤火晚灯" },
  { id: "petals", zh: "花信缓落" },
  { id: "comets", zh: "流星来信" },
  { id: "aurora", zh: "极光轻纱" },
  { id: "embers", zh: "壁炉余温" },
  { id: "moonorbit", zh: "月亮轨道" },
] as const;

export const AVATAR_KINDS = [
  { id: "", zh: "用名字" },
  { id: "peach", zh: "蜜桃晕染" },
  { id: "dusk", zh: "黄昏绒面" },
  { id: "mint", zh: "薄荷软糖" },
  { id: "lilac", zh: "丁香暮色" },
  { id: "honey", zh: "暖糖光" },
  { id: "upload", zh: "自己的照片" },
] as const;

export const SEATS = [
  { id: "window", zh: "窗边" },
  { id: "sofa", zh: "沙发" },
  { id: "left", zh: "左边椅子" },
  { id: "right", zh: "右边椅子" },
] as const;

export const NATIVE_SEAT = {
  "window-seat": "window",
  sofa: "sofa",
  "left-chair": "left",
  "right-chair": "right",
} as const;

export const COMPATIBLE_SEATS = {
  "window-seat": ["window"],
  sofa: ["sofa"],
  "left-chair": ["left", "right"],
  "right-chair": ["right", "left"],
} as const;

export type CharacterId = (typeof CHARACTERS)[number]["id"] | "";
export type FrameId = (typeof FRAMES)[number]["id"];
export type ThemeId = (typeof THEMES)[number]["id"];
export type EffectId = (typeof EFFECTS)[number]["id"];
export type AvatarKind = (typeof AVATAR_KINDS)[number]["id"];
export type SeatId = (typeof SEATS)[number]["id"];

export function characterOf(id: string | undefined) {
  return CHARACTERS.find((item) => item.id === id) ?? null;
}

export function frameSrc(id: string | undefined) {
  if (!id) return "";
  return FRAMES.some((item) => item.id === id && item.id) ? `/assets/profile/frames/${id}.svg` : "";
}

export function themeSrc(id: string | undefined) {
  if (!id) return "";
  return THEMES.some((item) => item.id === id && item.id) ? `/assets/profile/themes/${id}.svg` : "";
}

export function isCharacterId(id: string): id is Exclude<CharacterId, ""> {
  return CHARACTERS.some((item) => item.id === id);
}

export function isFrameId(id: string): id is FrameId {
  return FRAMES.some((item) => item.id === id);
}

export function isThemeId(id: string): id is ThemeId {
  return THEMES.some((item) => item.id === id);
}

export function isEffectId(id: string): id is EffectId {
  return EFFECTS.some((item) => item.id === id);
}

export function isAvatarKind(id: string): id is AvatarKind {
  return AVATAR_KINDS.some((item) => item.id === id);
}

export function figureClass(characterId: string) {
  return characterOf(characterId) ? `cottage-figure cottage-char-${characterId}` : "cottage-figure";
}

export function preferredSeats(characterId: string): SeatId[] {
  const art = characterOf(characterId);
  if (!art) return [];
  return [...COMPATIBLE_SEATS[art.id]];
}
