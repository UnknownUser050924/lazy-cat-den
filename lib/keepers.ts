function splitNames(raw: string) {
  return raw
    .split(/[,，]/)
    .map((name) => name.normalize("NFC").trim())
    .filter(Boolean);
}

export function keeperNames() {
  const extra = splitNames(process.env.LCD_ADMIN_NAME ?? "");
  return [...new Set(["宝宝", "无名", ...extra])];
}

export function isKeeper(name: string) {
  return Boolean(name) && keeperNames().includes(name.normalize("NFC").trim());
}
