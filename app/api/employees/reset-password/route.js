import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request) {
  await ensureSchema();
  const session = await getSession();
  if (!session || session.role !== "direction") {
    return NextResponse.json({ error: "Accès réservé à la direction." }, { status: 403 });
  }

  const body = await request.json();
  const email = (body.email || "").trim().toLowerCase();
  const newPassword = body.newPassword || "";

  if (newPassword.length < 4) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 4 caractères." }, { status: 400 });
  }

  const existing = await sql`SELECT email FROM employees WHERE email = ${email}`;
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Aucun salarié avec cette adresse e-mail." }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await sql`
    UPDATE employees SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expiry = NULL
    WHERE email = ${email}
  `;

  return NextResponse.json({ ok: true });
}

export async function GET() {
  await ensureSchema();
  const session = await getSession();
  if (!session || session.role !== "direction") {
    return NextResponse.json({ error: "Accès réservé à la direction." }, { status: 403 });
  }
  const result = await sql`SELECT email, nom, prenom FROM employees ORDER BY prenom, nom`;
  return NextResponse.json({ employees: result.rows });
}
