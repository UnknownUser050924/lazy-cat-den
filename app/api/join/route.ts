import { NextResponse } from "next/server";
import { slugifyRoom } from "@/lib/constants";
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

  await applyAction(id, { type: "join", displayName });
  back.searchParams.set("room", id);
  back.searchParams.set("joined", displayName);
  return NextResponse.redirect(back, 303);
}
