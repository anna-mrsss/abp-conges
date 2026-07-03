import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql, ensureSchema } from "@/lib/db";
import { isValidEmail } from "@/lib/dates";
import { sendResetEmail } from "@/lib/email";

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const email = (body.email || "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Merci de saisir une adresse e-mail valide." }, { status: 400 });
  }

  const result = await sql`SELECT email FROM employees WHERE email = ${email}`;
  if (result.rows.length === 0) {
    // On ne confirme pas l'existence du compte pour ne pas donner d'indice,
    // mais on renvoie un message générique cohérent dans les deux cas.
    return NextResponse.json({
      ok: true,
      message: "Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être envoyé (ou demandez à la direction de réinitialiser votre mot de passe).",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await sql`
    UPDATE employees SET reset_token = ${token}, reset_token_expiry = ${expiry.toISOString()}
    WHERE email = ${email}
  `;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const emailResult = await sendResetEmail(email, resetUrl);

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.sent,
    message: emailResult.sent
      ? "Un e-mail de réinitialisation vient de vous être envoyé."
      : "L'envoi automatique d'e-mail n'est pas configuré sur cette installation. Merci de demander à la direction de réinitialiser votre mot de passe depuis son espace.",
  });
}
