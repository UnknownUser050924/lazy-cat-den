"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconBook,
  IconBox,
  IconCal,
  IconCat,
  IconChat,
  IconCorner,
  IconHome,
  IconHouse,
  IconJar,
  IconKeep,
  IconMail,
  IconPad,
  IconPaper,
  IconSun,
} from "@/components/NavIcons";

type Hints = { qa: boolean; games: boolean; letter: boolean; letterCount: number };

const STAY = [
  { href: "", zh: "小屋", icon: <IconHome /> },
  { href: "/chat", zh: "聊天", icon: <IconChat /> },
  { href: "/cat", zh: "猫", icon: <IconCat /> },
] as const;

const DO = [
  { href: "/qa", zh: "问答", icon: <IconPaper />, hint: "qa" as const },
  { href: "/draw", zh: "抽签", icon: <IconJar />, hint: "" as const },
  { href: "/wishlist", zh: "愿望", icon: <IconBox />, hint: "" as const },
  { href: "/games", zh: "游戏", icon: <IconPad />, hint: "games" as const },
] as const;

const KEEP = [
  { href: "/letter", zh: "信", icon: <IconMail />, hint: "letter" as const },
  { href: "/calendar", zh: "日历", icon: <IconCal />, hint: "" as const },
  { href: "/today", zh: "今日", icon: <IconSun />, hint: "" as const },
  { href: "/memories", zh: "故事", icon: <IconBook />, hint: "" as const },
] as const;

export function RoomNav({
  room,
  presence,
  hints,
  admin = false,
  onNavigate,
}: {
  room: string;
  presence: string;
  hints: Hints;
  admin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const base = `/room/${encodeURIComponent(room)}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-1 pb-3">
        <Link
          href={base}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-2xl px-2 py-1 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-deep"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blush text-rose-deep">
            <IconHouse />
          </span>
          <span>
            <span className="block text-sm font-extrabold leading-tight">懒猫小屋</span>
            <span className="block text-[11px] text-muted">Lazy Cat Den</span>
          </span>
        </Link>
        <article className="mt-3 rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--card)_88%,var(--blush))] px-3 py-2.5">
          <p className="truncate text-sm font-extrabold text-ink">{room}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{presence}</p>
        </article>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
        <NavGroup label="一起待着">
          {STAY.map((item) => (
            <NavLink
              key={item.href || "home"}
              href={`${base}${item.href}`}
              active={item.href === "" ? pathname === base : pathname.startsWith(`${base}${item.href}`)}
              zh={item.zh}
              icon={item.icon}
              onNavigate={onNavigate}
            />
          ))}
        </NavGroup>
        <NavGroup label="一起做点事">
          {DO.map((item) => (
            <NavLink
              key={item.href}
              href={`${base}${item.href}`}
              active={pathname.startsWith(`${base}${item.href}`)}
              zh={item.zh}
              icon={item.icon}
              mark={item.hint === "qa" ? hints.qa : item.hint === "games" ? hints.games : false}
              markLabel={item.hint === "qa" ? "有还没答的问题" : item.hint === "games" ? "有一局在等" : ""}
              onNavigate={onNavigate}
            />
          ))}
        </NavGroup>
        <NavGroup label="留下的东西">
          {KEEP.map((item) => (
            <NavLink
              key={item.href}
              href={`${base}${item.href}`}
              active={pathname.startsWith(`${base}${item.href}`)}
              zh={item.zh}
              icon={item.icon}
              mark={item.hint === "letter" ? hints.letter : false}
              markLabel={item.hint === "letter" ? "有还没拆的信" : ""}
              badge={item.hint === "letter" && hints.letterCount > 0 ? String(hints.letterCount) : ""}
              onNavigate={onNavigate}
            />
          ))}
        </NavGroup>
      </div>

      <div className="shrink-0 space-y-1 border-t border-[var(--line)] px-1 pt-3">
        <NavLink
          href={`${base}/corner`}
          active={pathname.startsWith(`${base}/corner`)}
          zh="我的角落"
          icon={<IconCorner />}
          personal
          onNavigate={onNavigate}
        />
        {admin ? (
          <NavLink
            href={`${base}/keep`}
            active={pathname.startsWith(`${base}/keep`)}
            zh="看管"
            icon={<IconKeep />}
            quiet
            onNavigate={onNavigate}
          />
        ) : null}
      </div>
    </div>
  );
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mb-3">
      <h2 className="px-2 pb-1 text-[10px] font-bold tracking-[0.12em] text-muted">{label}</h2>
      <nav className="space-y-0.5" aria-label={label}>
        {children}
      </nav>
    </section>
  );
}

function NavLink({
  href,
  active,
  zh,
  icon,
  mark = false,
  markLabel = "",
  badge = "",
  personal = false,
  quiet = false,
  onNavigate,
}: {
  href: string;
  active: boolean;
  zh: string;
  icon: ReactNode;
  mark?: boolean;
  markLabel?: string;
  badge?: string;
  personal?: boolean;
  quiet?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-10 items-center gap-2.5 rounded-2xl px-2.5 text-sm font-bold transition-colors duration-150 ${
        active
          ? "bg-blush text-ink before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-rose-deep"
          : quiet
            ? "text-muted hover:bg-blush/50 hover:text-ink"
            : "text-ink hover:bg-blush/55"
      }`}
    >
      <span className={active ? "text-rose-deep" : "text-[color-mix(in_srgb,var(--rose-deep)_70%,var(--ink))]"}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{zh}</span>
      {personal ? <span className="h-2 w-2 shrink-0 rounded-full bg-rose" aria-hidden /> : null}
      {badge ? (
        <span className="rounded-full bg-blush px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-ink">{badge}</span>
      ) : mark ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-rose-deep" aria-label={markLabel} />
      ) : null}
    </Link>
  );
}
