import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    name: "懒猫小屋",
    english: "Lazy Cat Den",
  });
}
