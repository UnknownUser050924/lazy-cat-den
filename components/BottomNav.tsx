"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "", zh: "小屋", en: "Home", icon: "⌂" },
  { href: "/qa", zh: "问答", en: "Q&A", icon: "♡" },
  { href: "/draw", zh: "抽签", en: "Draw", icon: "✦" },
  { href: "/wishlist", zh: "愿望", en: "Wish", icon: "☆" },
  { href: "/cat", zh: "猫", en: "Cat", icon: "ᓚᘏᗢ" },
];

export function BottomNav({ room }: { room: string }) {
  const pathname = usePathname();
  const base = `/room/${encodeURIComponent(room)}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {ITEMS.map((item) => {
          const href = `${base}${item.href}`;
          const active = item.href === "" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={item.href}
              href={href}
              className={`rounded-2xl px-1 py-2 text-center transition ${
                active ? "bg-blush text-rose-deep" : "text-muted hover:bg-blush/50"
              }`}
            >
              <div className="text-base leading-none">{item.icon}</div>
              <div className="mt-1 text-[11px] font-bold">{item.zh}</div>
              <div className="text-[9px] opacity-70">{item.en}</div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
