import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(request, { params }) {
  await ensureSchema();
  const session = await getSession();
  if (!session || session.role !== "direction") {
    return NextResponse.json({ error: "Accès réservé à la direction." }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const statut = body.statut;
  if (!["En attente", "Validé", "Refusé"].includes(statut)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  await sql`UPDATE requests SET statut = ${statut} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
