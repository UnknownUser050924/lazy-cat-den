"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN = [
  { href: "", zh: "小屋", en: "Home", hint: "" },
  { href: "/chat", zh: "聊天", en: "Chat", hint: "" },
  { href: "/qa", zh: "问答", en: "Q&A", hint: "qa" },
  { href: "/draw", zh: "抽签", en: "Draw", hint: "" },
  { href: "/wishlist", zh: "愿望", en: "Wish", hint: "" },
  { href: "/cat", zh: "猫", en: "Cat", hint: "" },
] as const;

const MORE = [
  { href: "/games", zh: "游戏", en: "Play", hint: "games" },
  { href: "/letter", zh: "信", en: "Letter", hint: "letter" },
  { href: "/calendar", zh: "日历", en: "Days", hint: "" },
  { href: "/today", zh: "今日", en: "Today", hint: "" },
  { href: "/memories", zh: "我们的故事", en: "Story", hint: "" },
  { href: "/corner", zh: "我的角落", en: "Corner", hint: "" },
] as const;

export function Sidebar({
  room,
  hints,
  admin = false,
}: {
  room: string;
  hints: { qa: boolean; games: boolean; letter: boolean };
  admin?: boolean;
}) {
  const pathname = usePathname();
  const base = `/room/${encodeURIComponent(room)}`;

  return (
    <aside className="sticky top-0 hidden max-h-dvh flex-col self-start overflow-y-auto border-r border-[var(--line)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] px-3 py-5 md:flex">
      <p className="px-2 text-sm font-extrabold tracking-wide">懒猫小屋</p>
      <p className="px-2 text-[11px] text-muted">Lazy Cat Den</p>
      <nav className="mt-6 space-y-1" aria-label="小屋">
        {MAIN.map((item) => (
          <NavLink
            key={item.href}
            href={`${base}${item.href}`}
            active={item.href === "" ? pathname === base : pathname.startsWith(`${base}${item.href}`)}
            zh={item.zh}
            en={item.en}
            mark={item.hint === "qa" && hints.qa}
            markLabel="有还没答的问题"
          />
        ))}
      </nav>
      <p className="mb-1 mt-6 px-2 text-[10px] font-bold tracking-[0.16em] text-muted">MORE</p>
      <nav className="space-y-1" aria-label="更多">
        {MORE.map((item) => (
          <NavLink
            key={item.href}
            href={`${base}${item.href}`}
            active={pathname.startsWith(`${base}${item.href}`)}
            zh={item.zh}
            en={item.en}
            mark={(item.hint === "games" && hints.games) || (item.hint === "letter" && hints.letter)}
            markLabel={item.hint === "games" ? "有一局在等" : item.hint === "letter" ? "有还没拆的信" : ""}
          />
        ))}
        {admin ? (
          <NavLink
            href={`${base}/keep`}
            active={pathname.startsWith(`${base}/keep`)}
            zh="看管"
            en="Keep"
            mark={false}
            markLabel=""
          />
        ) : null}
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  active,
  zh,
  en,
  mark,
  markLabel,
}: {
  href: string;
  active: boolean;
  zh: string;
  en: string;
  mark: boolean;
  markLabel: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative block rounded-2xl px-3 py-2 ${active ? "bg-blush text-rose-deep" : "text-ink hover:bg-blush/50"}`}
    >
      {mark ? <span className="nav-dot" aria-label={markLabel} /> : null}
      <span className="block text-sm font-bold">{zh}</span>
      <span className="block text-[10px] text-muted">{en}</span>
    </Link>
  );
}
