import { SESSION_KEY } from "./constants";

export type Session = {
  room: string;
  displayName: string;
  claim?: string;
};

const COOKIE = "lcd-session";

function pack(session: Session) {
  const base = `${encodeURIComponent(session.room)}|${encodeURIComponent(session.displayName)}`;
  return session.claim ? `${base}|${encodeURIComponent(session.claim)}` : base;
}

function unpack(raw: string): Session | null {
  const split = raw.indexOf("|");
  if (split <= 0) return null;
  try {
    const room = decodeURIComponent(raw.slice(0, split));
    const rest = raw.slice(split + 1);
    const claimAt = rest.lastIndexOf("|");
    const namePart = claimAt >= 0 ? rest.slice(0, claimAt) : rest;
    const claimRaw = claimAt >= 0 ? rest.slice(claimAt + 1) : undefined;
    const displayName = decodeURIComponent(namePart);
    const claim = claimRaw ? decodeURIComponent(claimRaw) : undefined;
    if (!room || !displayName) return null;
    return { room, displayName, claim };
  } catch {
    return null;
  }
}

function readCookie(): Session | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )lcd-session=([^;]*)/);
  if (!match) return null;
  return unpack(match[1]);
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Session;
      if (parsed.room && parsed.displayName) {
        const cookie = readCookie();
        if (cookie?.claim && cookie.room === parsed.room && cookie.displayName === parsed.displayName) {
          return { ...parsed, claim: parsed.claim || cookie.claim };
        }
        return parsed;
      }
    }
  } catch {
    // Fall through to the cookie.
  }
  const cookie = readCookie();
  if (cookie) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(cookie));
  }
  return cookie;
}

export function writeSession(session: Session) {
  const cookie = typeof document !== "undefined" ? readCookie() : null;
  const claim =
    session.claim ||
    (cookie?.room === session.room && cookie.displayName === session.displayName ? cookie.claim : undefined);
  const next = { ...session, claim };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  document.cookie = `${COOKIE}=${pack(next)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function sessionFromRequest(req: Request): Session | null {
  const header = req.headers.get("cookie") ?? "";
  const match = header.match(/(?:^|; )lcd-session=([^;]*)/);
  if (!match) return null;
  return unpack(match[1]);
}

export function sessionCookie(session: Session) {
  return `${COOKIE}=${pack(session)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
