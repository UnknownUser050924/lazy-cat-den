import { NextResponse } from "next/server";
import { slugifyRoom } from "@/lib/constants";
import { sessionFromRequest } from "@/lib/session";
import { applyAction, getRoom, notePresence, restoreRoom } from "@/lib/store";
import type { RoomAction } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ room: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { room } = await ctx.params;
  const id = slugifyRoom(decodeURIComponent(room));
  if (!id) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }
  const session = sessionFromRequest(req);
  const data =
    session && session.room === id
      ? await notePresence(id, session.displayName).catch(() => getRoom(id))
      : await getRoom(id);
  return NextResponse.json(data);
}

export async function POST(req: Request, ctx: Ctx) {
  const { room } = await ctx.params;
  const id = slugifyRoom(decodeURIComponent(room));
  if (!id) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }
  try {
    const body = (await req.json()) as { type?: string; room?: unknown };
    if (body.type === "restore") {
      const data = await restoreRoom(id, body.room);
      return NextResponse.json(data);
    }
    const data = await applyAction(id, body as RoomAction);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
