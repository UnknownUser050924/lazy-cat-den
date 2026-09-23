import { NextResponse } from "next/server";
import { slugifyRoom } from "@/lib/constants";
import { sessionCookie } from "@/lib/session";
import { applyAction } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const id = slugifyRoom(String(form.get("room") ?? ""));
  const displayName = String(form.get("displayName") ?? "").trim().slice(0, 24);
  const back = new URL("/", req.url);

  if (!id || !displayName) {
    back.searchParams.set("room", id);
    return NextResponse.redirect(back, 303);
  }

  try {
    const { claim } = await applyAction(id, { type: "join", displayName });
    back.searchParams.set("room", id);
    back.searchParams.set("joined", displayName);
    const response = NextResponse.redirect(back, 303);
    response.headers.append("Set-Cookie", sessionCookie({ room: id, displayName, claim }));
    return response;
  } catch (err) {
    back.searchParams.set("room", id);
    back.searchParams.set("error", err instanceof Error ? err.message : "进不去");
    return NextResponse.redirect(back, 303);
  }
}
