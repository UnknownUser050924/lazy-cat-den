import { NextResponse } from "next/server";
import { slugifyRoom } from "@/lib/constants";
import { sessionCookie, sessionFromRequest } from "@/lib/session";
import { presentRoom } from "@/lib/games";
import { applyAction, notePresence, restoreRoom } from "@/lib/store";
import type { Room, RoomAction } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ room: string }> };

function asRoom(data: Room, viewer: string, extra?: { room: string; displayName: string; claim?: string }) {
  const response = NextResponse.json(presentRoom(data, viewer));
  if (extra?.claim) {
    response.headers.set("X-LCD-Claim", extra.claim);
    response.headers.append("Set-Cookie", sessionCookie({ room: extra.room, displayName: extra.displayName, claim: extra.claim }));
  }
  return response;
}

export async function GET(req: Request, ctx: Ctx) {
  const { room } = await ctx.params;
  const id = slugifyRoom(decodeURIComponent(room));
  if (!id) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }
  const session = sessionFromRequest(req);
  if (!session || session.room !== id) {
    return NextResponse.json({ error: "先走进小屋" }, { status: 401 });
  }
  const result = await notePresence(id, session.displayName, session.claim);
  const member = result.room.members.find((item) => item.displayName === session.displayName);
  if (member?.claimHash && !result.claim) {
    return NextResponse.json({ error: "这不是你的名字" }, { status: 401 });
  }
  return asRoom(result.room, session.displayName, {
    room: id,
    displayName: session.displayName,
    claim: result.claim,
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { room } = await ctx.params;
  const id = slugifyRoom(decodeURIComponent(room));
  if (!id) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }
  try {
    const body = (await req.json()) as { type?: string; displayName?: string; room?: unknown };
    const session = sessionFromRequest(req);
    const sessionForRoom = session?.room === id ? session : undefined;

    if (body.type === "restore") {
      if (!sessionForRoom) {
        return NextResponse.json({ error: "先走进小屋" }, { status: 401 });
      }
      const data = await restoreRoom(id, body.room);
      return asRoom(data, sessionForRoom.displayName);
    }

    if (body.type === "join" || body.type === "checkin") {
      const requested =
        (typeof body.displayName === "string" && body.displayName.trim()) || sessionForRoom?.displayName || "";
      const { room: data, claim } = await applyAction(
        id,
        { type: body.type, displayName: requested },
        sessionForRoom,
      );
      return asRoom(data, requested, { room: id, displayName: requested, claim });
    }

    if (!sessionForRoom) {
      return NextResponse.json({ error: "先走进小屋" }, { status: 401 });
    }
    const { room: data, claim } = await applyAction(id, body as RoomAction, sessionForRoom);
    return asRoom(data, sessionForRoom.displayName, {
      room: id,
      displayName: sessionForRoom.displayName,
      claim,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
