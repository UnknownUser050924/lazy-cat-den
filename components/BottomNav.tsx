"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "", zh: "小屋", icon: "⌂", hint: "" },
  { href: "/chat", zh: "聊天", icon: "✎", hint: "" },
  { href: "/qa", zh: "问答", icon: "♡", hint: "qa" },
  { href: "/draw", zh: "抽签", icon: "✦", hint: "" },
  { href: "/wishlist", zh: "愿望", icon: "☆", hint: "" },
  { href: "/cat", zh: "猫", icon: "ᓚᘏᗢ", hint: "" },
] as const;

export function BottomNav({
  room,
  hints,
}: {
  room: string;
  hints: { qa: boolean; games: boolean; letter: boolean };
}) {
  const pathname = usePathname();
  const base = `/room/${encodeURIComponent(room)}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
        {ITEMS.map((item) => {
          const href = `${base}${item.href}`;
          const active = item.href === "" ? pathname === base : pathname.startsWith(href);
          const mark = item.hint === "qa" && hints.qa;
          return (
            <Link
              key={item.href}
              href={href}
              className={`relative rounded-2xl px-1 py-2 text-center transition ${
                active ? "bg-blush text-rose-deep" : "text-muted hover:bg-blush/50"
              }`}
            >
              {mark ? <span className="nav-dot" aria-label="有还没答的问题" /> : null}
              <div className="text-base leading-none">{item.icon}</div>
              <div className="mt-1 text-[11px] font-bold">{item.zh}</div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
