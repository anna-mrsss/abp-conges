import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { isValidEmail } from "@/lib/dates";

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const nom = (body.nom || "").trim();
  const prenom = (body.prenom || "").trim();

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Merci de saisir une adresse e-mail valide." }, { status: 400 });
  }
  if (!nom || !prenom) {
    return NextResponse.json({ error: "Merci de renseigner votre nom et votre prénom." }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 4 caractères." }, { status: 400 });
  }

  const existing = await sql`SELECT email FROM employees WHERE email = ${email}`;
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cette adresse e-mail. Utilisez plutôt « Accéder à mon compte salarié »." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await sql`
    INSERT INTO employees (email, password_hash, nom, prenom)
    VALUES (${email}, ${passwordHash}, ${nom}, ${prenom})
  `;

  await setSessionCookie({ role: "employee", email, nom, prenom });
  return NextResponse.json({ email, nom, prenom });
}
