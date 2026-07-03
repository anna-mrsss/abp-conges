export async function sendResetEmail(toEmail, resetUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Pas de service d'e-mail configuré : on le signale simplement à l'appelant,
    // qui proposera la solution de secours (réinitialisation par la direction).
    return { sent: false, reason: "no_api_key" };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "conges@resend.dev";

  try {
    await resend.emails.send({
      from,
      to: toEmail,
      subject: "ABP Menuiseries — Réinitialisation de votre mot de passe",
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour l'application de gestion des congés ABP Menuiseries.</p>
        <p><a href="${resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a> (lien valable 1 heure).</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.</p>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error("Erreur envoi e-mail Resend:", err);
    return { sent: false, reason: "send_error" };
  }
}
