import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const email = (body.email || "").trim().toLowerCase();
  const token = body.token || "";
  const password = body.password || "";

  if (password.length < 4) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 4 caractères." }, { status: 400 });
  }

  const result = await sql`SELECT * FROM employees WHERE email = ${email}`;
  const emp = result.rows[0];
  if (!emp || !emp.reset_token || emp.reset_token !== token) {
    return NextResponse.json({ error: "Lien de réinitialisation invalide." }, { status: 400 });
  }
  if (!emp.reset_token_expiry || new Date(emp.reset_token_expiry) < new Date()) {
    return NextResponse.json({ error: "Ce lien de réinitialisation a expiré. Merci de refaire une demande." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await sql`
    UPDATE employees SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expiry = NULL
    WHERE email = ${email}
  `;

  return NextResponse.json({ ok: true });
}
