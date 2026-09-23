export function keeperNames() {
  const raw = process.env.LCD_ADMIN_NAME ?? "宝宝,无名";
  return raw
    .split(/[,，]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function isKeeper(name: string) {
  return Boolean(name) && keeperNames().includes(name);
}
