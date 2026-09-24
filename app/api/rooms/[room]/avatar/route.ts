import { NextResponse } from "next/server";
import { slugifyRoom } from "@/lib/constants";
import { writeAvatar } from "@/lib/avatars";
import { sessionFromRequest } from "@/lib/session";
import { presentRoom } from "@/lib/games";
import { isKeeper } from "@/lib/keepers";
import { saveMemberAvatar } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ room: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { room } = await ctx.params;
  const id = slugifyRoom(decodeURIComponent(room));
  if (!id) return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  const session = sessionFromRequest(req);
  if (!session || session.room !== id) {
    return NextResponse.json({ error: "先走进小屋" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const blob = form.get("file");
    if (!(blob instanceof Blob)) throw new Error("请选一张照片");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const file = await writeAvatar(id, bytes);
    const data = await saveMemberAvatar(id, session, file);
    return NextResponse.json({ ...presentRoom(data, session.displayName, isKeeper(session.displayName)), file });
  } catch (err) {
    const message = err instanceof Error ? err.message : "没存上";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
