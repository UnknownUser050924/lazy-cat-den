"use client";

import { useEffect, useId, useRef } from "react";
import { IconClose } from "@/components/NavIcons";
import { RoomNav } from "@/components/RoomNav";

export function NavDrawer({
  open,
  onClose,
  room,
  presence,
  hints,
  admin = false,
}: {
  open: boolean;
  onClose: () => void;
  room: string;
  presence: string;
  hints: { qa: boolean; games: boolean; letter: boolean; letterCount: number };
  admin?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function focusables() {
      return [...(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [])];
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      lastFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
      <button type="button" className="absolute inset-0 bg-[rgba(74,59,54,0.38)]" aria-label="关闭菜单" onClick={onClose} />
      <div
        id="room-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        className="room-nav absolute inset-y-0 left-0 flex w-[min(15rem,calc(100vw-2.5rem))] max-w-full flex-col overflow-hidden border-r border-[var(--line)] px-3 py-4 text-ink shadow-none"
      >
        <div className="mb-2 flex items-center justify-between px-1">
          <p id={titleId} className="text-sm font-extrabold">
            菜单
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink hover:bg-blush/60"
            aria-label="关闭菜单"
          >
            <IconClose />
          </button>
        </div>
        <RoomNav room={room} presence={presence} hints={hints} admin={admin} onNavigate={onClose} />
      </div>
    </div>
  );
}
