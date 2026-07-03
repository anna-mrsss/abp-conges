import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE(request, { params }) {
  await ensureSchema();
  const session = await getSession();
  if (!session || session.role !== "direction") {
    return NextResponse.json({ error: "Accès réservé à la direction." }, { status: 403 });
  }

  const { id } = params;
  await sql`DELETE FROM closures WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
