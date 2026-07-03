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

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Merci de saisir une adresse e-mail valide." }, { status: 400 });
  }

  const result = await sql`SELECT * FROM employees WHERE email = ${email}`;
  const emp = result.rows[0];
  if (!emp) {
    return NextResponse.json(
      { error: "Aucun compte n'existe avec cette adresse e-mail (vérifiez qu'il n'y a pas de faute de frappe), ou créez d'abord votre compte salarié." },
      { status: 404 }
    );
  }

  const ok = await bcrypt.compare(password, emp.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Mot de passe incorrect pour cette adresse e-mail." }, { status: 401 });
  }

  await setSessionCookie({ role: "employee", email: emp.email, nom: emp.nom, prenom: emp.prenom });
  return NextResponse.json({ email: emp.email, nom: emp.nom, prenom: emp.prenom });
}
