"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN = [
  { href: "", zh: "小屋", en: "Home" },
  { href: "/chat", zh: "聊天", en: "Chat" },
  { href: "/qa", zh: "问答", en: "Q&A" },
  { href: "/draw", zh: "抽签", en: "Draw" },
  { href: "/wishlist", zh: "愿望", en: "Wish" },
  { href: "/cat", zh: "猫", en: "Cat" },
];

const MORE = [
  { href: "/games", zh: "游戏", en: "Play" },
  { href: "/letter", zh: "信", en: "Letter" },
  { href: "/calendar", zh: "日历", en: "Days" },
  { href: "/today", zh: "今日", en: "Today" },
  { href: "/memories", zh: "我们的故事", en: "Story" },
  { href: "/corner", zh: "我的角落", en: "Corner" },
];

export function Sidebar({ room }: { room: string }) {
  const pathname = usePathname();
  const base = `/room/${encodeURIComponent(room)}`;

  return (
    <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-[var(--line)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] px-3 py-5 md:flex">
      <p className="px-2 text-sm font-extrabold tracking-wide">懒猫小屋</p>
      <p className="px-2 text-[11px] text-muted">Lazy Cat Den</p>
      <nav className="mt-6 space-y-1" aria-label="小屋">
        {MAIN.map((item) => (
          <NavLink key={item.href} href={`${base}${item.href}`} active={item.href === "" ? pathname === base : pathname.startsWith(`${base}${item.href}`)} zh={item.zh} en={item.en} />
        ))}
      </nav>
      <p className="mb-1 mt-6 px-2 text-[10px] font-bold tracking-[0.16em] text-muted">MORE</p>
      <nav className="space-y-1" aria-label="更多">
        {MORE.map((item) => (
          <NavLink key={item.href} href={`${base}${item.href}`} active={pathname.startsWith(`${base}${item.href}`)} zh={item.zh} en={item.en} />
        ))}
      </nav>
    </aside>
  );
}

function NavLink({ href, active, zh, en }: { href: string; active: boolean; zh: string; en: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-2xl px-3 py-2 ${active ? "bg-blush text-rose-deep" : "text-ink hover:bg-blush/50"}`}
    >
      <span className="block text-sm font-bold">{zh}</span>
      <span className="block text-[10px] text-muted">{en}</span>
    </Link>
  );
}
