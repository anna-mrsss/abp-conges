import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/session";

export async function POST(request) {
  const body = await request.json();
  const password = body.password || "";
  const expected = process.env.DIRECTION_PASSWORD || "ABPm2026";

  if (password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  await setSessionCookie({ role: "direction" });
  return NextResponse.json({ role: "direction" });
}
