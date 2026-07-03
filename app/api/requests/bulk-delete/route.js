import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request) {
  await ensureSchema();
  const session = await getSession();
  if (!session || session.role !== "direction") {
    return NextResponse.json({ error: "Accès réservé à la direction." }, { status: 403 });
  }

  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Aucune demande sélectionnée." }, { status: 400 });
  }

  await sql`DELETE FROM requests WHERE id = ANY(${ids})`;
  return NextResponse.json({ ok: true });
}
