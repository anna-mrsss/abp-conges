import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE(request, { params }) {
  await ensureSchema();
  const session = await getSession();
  if (!session || session.role !== "direction") {
    return NextResponse.json({ error: "Accès réservé à la direction." }, { status: 403 });
  }

  const email = decodeURIComponent(params.email || "").toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Adresse e-mail manquante." }, { status: 400 });
  }

  // On supprime d'abord ses demandes de congé, puis le compte lui-même.
  await sql`DELETE FROM requests WHERE email = ${email}`;
  await sql`DELETE FROM employees WHERE email = ${email}`;

  return NextResponse.json({ ok: true });
}
