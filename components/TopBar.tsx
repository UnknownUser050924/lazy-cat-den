"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  IconBook,
  IconBox,
  IconCal,
  IconCat,
  IconChat,
  IconChevron,
  IconCorner,
  IconHome,
  IconHouse,
  IconJar,
  IconMail,
  IconMenu,
  IconPad,
  IconPaper,
  IconSun,
} from "@/components/NavIcons";
import { clockLabel, dateLabel } from "@/lib/time";

type Hints = { qa: boolean; games: boolean; letter: boolean; letterCount: number };

export function TopBar({
  room,
  name,
  presence,
  hints,
  admin = false,
  now,
  menuOpen,
  onOpenMenu,
}: {
  room: string;
  name: string;
  presence: string;
  hints: Hints;
  admin?: boolean;
  now: number;
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/room/${encodeURIComponent(room)}`;
  const [open, setOpen] = useState<"do" | "keep" | null>(null);

  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  const primary = [
    { href: base, zh: "小屋", icon: <IconHome />, active: pathname === base },
    { href: `${base}/chat`, zh: "聊天", icon: <IconChat />, active: pathname.startsWith(`${base}/chat`) },
    { href: `${base}/cat`, zh: "猫", icon: <IconCat />, active: pathname.startsWith(`${base}/cat`) },
    { href: `${base}/games`, zh: "游戏", icon: <IconPad />, active: pathname.startsWith(`${base}/games`), mark: hints.games, markLabel: "有一局在等" },
    { href: `${base}/calendar`, zh: "日历", icon: <IconCal />, active: pathname.startsWith(`${base}/calendar`) },
  ];

  const together = [
    { href: `${base}/qa`, zh: "问答", icon: <IconPaper />, active: pathname.startsWith(`${base}/qa`), mark: hints.qa, markLabel: "有还没答的问题" },
    { href: `${base}/draw`, zh: "抽签", icon: <IconJar />, active: pathname.startsWith(`${base}/draw`) },
    { href: `${base}/wishlist`, zh: "愿望", icon: <IconBox />, active: pathname.startsWith(`${base}/wishlist`) },
  ];

  const keepsakes = [
    { href: `${base}/letter`, zh: "信", icon: <IconMail />, active: pathname.startsWith(`${base}/letter`), mark: hints.letter, markLabel: "有还没拆的信", badge: hints.letterCount > 0 ? String(hints.letterCount) : "" },
    { href: `${base}/today`, zh: "今日", icon: <IconSun />, active: pathname.startsWith(`${base}/today`) },
    { href: `${base}/memories`, zh: "故事", icon: <IconBook />, active: pathname.startsWith(`${base}/memories`) },
  ];

  return (
    <header className="topbar sticky top-0 z-30 border-b border-[var(--line)] px-3 py-2 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-current hover:bg-blush/50 min-[68rem]:hidden"
          aria-label="打开菜单"
          aria-expanded={menuOpen}
          aria-controls="room-nav-drawer"
          onClick={onOpenMenu}
        >
          <IconMenu />
        </button>

        <Link href={base} className="flex min-w-0 items-center gap-2 rounded-2xl py-0.5 pr-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blush text-rose-deep">
            <IconHouse />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold leading-tight">懒猫小屋</span>
            <span className="block truncate text-[11px] text-muted">{room}</span>
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-0.5 min-[68rem]:flex" aria-label="小屋导航">
          {primary.map((item) => (
            <TopLink key={item.href} {...item} />
          ))}
          <NavMenu
            label="一起做点事"
            open={open === "do"}
            onToggle={() => setOpen((value) => (value === "do" ? null : "do"))}
            onClose={() => setOpen(null)}
            items={together}
          />
          <NavMenu
            label="留下的东西"
            open={open === "keep"}
            onToggle={() => setOpen((value) => (value === "keep" ? null : "keep"))}
            onClose={() => setOpen(null)}
            items={keepsakes}
          />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <p className="hidden text-xs text-muted min-[90rem]:block">
            <time dateTime={new Date(now).toISOString()}>
              {dateLabel(now)} · {clockLabel(now)}
            </time>
          </p>
          <Link
            href={`${base}/corner`}
            aria-current={pathname.startsWith(`${base}/corner`) ? "page" : undefined}
            className={`inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-bold ${
              pathname.startsWith(`${base}/corner`) ? "bg-blush text-ink" : "text-ink hover:bg-blush/55"
            }`}
          >
            <IconCorner />
            我的角落
          </Link>
          <p className="hidden max-w-[7rem] truncate text-sm font-bold text-ink sm:block">你是 {name}</p>
          {admin ? (
            <button
              type="button"
              onClick={() => router.push(`${base}/keep`)}
              className="hidden rounded-full border border-[var(--line)] bg-card px-3 py-1.5 text-sm font-bold text-ink min-[68rem]:inline"
            >
              看管
            </button>
          ) : null}
          <Link
            href="/"
            className="rounded-full border border-[var(--line)] bg-card px-3 py-1.5 text-sm font-bold text-ink"
          >
            换房间
          </Link>
        </div>
      </div>
      <p className="mt-1 hidden truncate pl-10 text-[11px] text-muted min-[68rem]:block">{presence}</p>
    </header>
  );
}

function TopLink({
  href,
  zh,
  icon,
  active,
  mark = false,
  markLabel = "",
}: {
  href: string;
  zh: string;
  icon: ReactNode;
  active: boolean;
  mark?: boolean;
  markLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-sm font-bold ${
        active ? "bg-blush text-ink" : "text-ink hover:bg-blush/55"
      }`}
    >
      <span className={`hidden min-[90rem]:inline ${active ? "text-rose-deep" : "text-rose-deep/80"}`}>{icon}</span>
      {zh}
      {mark ? <span className="h-1.5 w-1.5 rounded-full bg-rose-deep" aria-label={markLabel} /> : null}
    </Link>
  );
}

function NavMenu({
  label,
  open,
  onToggle,
  onClose,
  items,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: { href: string; zh: string; icon: ReactNode; active: boolean; mark?: boolean; markLabel?: string; badge?: string }[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"first" | "last" | null>(null);
  const menuId = useId();
  const childActive = items.some((item) => item.active);

  useEffect(() => {
    if (!open || !pendingFocus.current) return;
    const links = wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!links?.length) return;
    (pendingFocus.current === "last" ? links[links.length - 1] : links[0]).focus();
    pendingFocus.current = null;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={onToggle}
        className={`inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-sm font-bold ${
          open || childActive ? "bg-blush text-ink" : "text-ink hover:bg-blush/55"
        }`}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            pendingFocus.current = event.key === "ArrowUp" ? "last" : "first";
            if (!open) {
              onToggle();
              return;
            }
            const links = wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
            if (!links?.length) return;
            (pendingFocus.current === "last" ? links[links.length - 1] : links[0]).focus();
            pendingFocus.current = null;
          }
        }}
      >
        {label}
        <IconChevron />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="surface absolute left-0 top-[calc(100%+0.35rem)] z-40 min-w-[10.5rem] rounded-2xl border border-[var(--line)] bg-card p-1.5 shadow-[0_12px_28px_rgba(74,59,54,0.12)]"
          onKeyDown={(event) => {
            const items = [...(wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
            if (!items.length) return;
            const index = items.indexOf(document.activeElement as HTMLElement);
            if (event.key === "ArrowDown") {
              event.preventDefault();
              items[(index + 1 + items.length) % items.length].focus();
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              items[(index - 1 + items.length) % items.length].focus();
            } else if (event.key === "Home") {
              event.preventDefault();
              items[0].focus();
            } else if (event.key === "End") {
              event.preventDefault();
              items[items.length - 1].focus();
            } else if (event.key === "Tab") {
              onClose();
            }
          }}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              aria-current={item.active ? "page" : undefined}
              onClick={onClose}
              className={`flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-bold ${
                item.active ? "bg-blush text-ink" : "text-ink hover:bg-blush/55"
              }`}
            >
              <span className="text-rose-deep">{item.icon}</span>
              <span className="flex-1">{item.zh}</span>
              {item.badge ? (
                <span className="rounded-full bg-blush px-1.5 py-0.5 text-[10px] font-extrabold text-ink">{item.badge}</span>
              ) : item.mark ? (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-deep" aria-label={item.markLabel} />
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
