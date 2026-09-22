import { SESSION_KEY } from "./constants";

export type Session = {
  room: string;
  displayName: string;
};

const COOKIE = "lcd-session";

function pack(session: Session) {
  return `${session.room}|${encodeURIComponent(session.displayName)}`;
}

function unpack(raw: string): Session | null {
  const split = raw.indexOf("|");
  if (split <= 0) return null;
  try {
    const room = decodeURIComponent(raw.slice(0, split));
    const displayName = decodeURIComponent(raw.slice(split + 1));
    if (!room || !displayName) return null;
    return { room, displayName };
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
      if (parsed.room && parsed.displayName) return parsed;
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
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  document.cookie = `${COOKIE}=${pack(session)}; Path=/; Max-Age=31536000; SameSite=Lax`;
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
