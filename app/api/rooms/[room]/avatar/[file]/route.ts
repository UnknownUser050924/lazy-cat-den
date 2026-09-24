import { NextResponse } from "next/server";
import { slugifyRoom } from "@/lib/constants";
import { readAvatar } from "@/lib/avatars";
import { sessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ room: string; file: string }> };

const TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(req: Request, ctx: Ctx) {
  const { room, file } = await ctx.params;
  const id = slugifyRoom(decodeURIComponent(room));
  if (!id) return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  const session = sessionFromRequest(req);
  if (!session || session.room !== id) {
    return NextResponse.json({ error: "先走进小屋" }, { status: 401 });
  }
  try {
    const bytes = await readAvatar(id, decodeURIComponent(file));
    const ext = file.split(".").pop()?.toLowerCase() ?? "png";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPE[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "找不到这张照片" }, { status: 404 });
  }
}
