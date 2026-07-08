import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/session";
import { overlaps, uid } from "@/lib/dates";

function rowToRequest(r) {
  return {
    id: r.id,
    horodateurTs: Number(r.horodateur_ts),
    horodateur: r.horodateur,
    email: r.email,
    nom: r.nom,
    prenom: r.prenom,
    dateDebut: r.date_debut.toISOString().slice(0, 10),
    dateFin: r.date_fin.toISOString().slice(0, 10),
    commentaire: r.commentaire || "",
    statut: r.statut,
  };
}

export async function GET() {
  await ensureSchema();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let result;
  if (session.role === "direction") {
    result = await sql`SELECT * FROM requests ORDER BY horodateur_ts ASC`;
  } else {
    result = await sql`SELECT * FROM requests WHERE email = ${session.email} ORDER BY horodateur_ts DESC`;
  }
  return NextResponse.json({ requests: result.rows.map(rowToRequest) });
}

export async function POST(request) {
  await ensureSchema();
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json();
  const dateDebut = body.dateDebut;
  const dateFin = body.dateFin;
  const commentaire = (body.commentaire || "").trim();

  if (!dateDebut || !dateFin) {
    return NextResponse.json({ error: "Merci de renseigner une date de début et une date de fin." }, { status: 400 });
  }
  if (new Date(dateFin) < new Date(dateDebut)) {
    return NextResponse.json({ error: "La date de fin doit être postérieure ou égale à la date de début." }, { status: 400 });
  }

  // Fermetures d'entreprise : blocage serveur.
  const closuresResult = await sql`SELECT * FROM closures`;
  const closure = closuresResult.rows.find((c) =>
    overlaps(dateDebut, dateFin, c.date_debut.toISOString().slice(0, 10), c.date_fin.toISOString().slice(0, 10))
  );
  if (closure) {
    return NextResponse.json(
      {
        error: `Impossible : cette période chevauche une fermeture de l'entreprise (${closure.libelle || "Fermeture"}, du ${closure.date_debut.toISOString().slice(0, 10)} au ${closure.date_fin.toISOString().slice(0, 10)}).`,
      },
      { status: 409 }
    );
  }

  // Périodes de blocage temporaire (forte activité, inventaire...) : blocage serveur.
  const blockingResult = await sql`SELECT * FROM blocking_periods`;
  const blocking = blockingResult.rows.find((c) =>
    overlaps(dateDebut, dateFin, c.date_debut.toISOString().slice(0, 10), c.date_fin.toISOString().slice(0, 10))
  );
  if (blocking) {
    return NextResponse.json(
      {
        error: `Impossible : les congés sont temporairement bloqués sur cette période (${blocking.libelle || "Période de blocage"}, du ${blocking.date_debut.toISOString().slice(0, 10)} au ${blocking.date_fin.toISOString().slice(0, 10)}).`,
      },
      { status: 409 }
    );
  }

  // Doublon exact ou chevauchement avec une autre demande du même salarié.
  const mineResult = await sql`SELECT * FROM requests WHERE email = ${session.email}`;
  const overlapMine = mineResult.rows.find((r) =>
    overlaps(dateDebut, dateFin, r.date_debut.toISOString().slice(0, 10), r.date_fin.toISOString().slice(0, 10))
  );
  if (overlapMine) {
    return NextResponse.json(
      { error: "Vous avez déjà une demande enregistrée qui chevauche ces dates." },
      { status: 409 }
    );
  }

  const id = uid();
  const now = Date.now();
  const horodateur = new Date(now).toLocaleString("fr-FR");

  await sql`
    INSERT INTO requests (id, horodateur_ts, horodateur, email, nom, prenom, date_debut, date_fin, commentaire, statut)
    VALUES (${id}, ${now}, ${horodateur}, ${session.email}, ${session.nom}, ${session.prenom}, ${dateDebut}, ${dateFin}, ${commentaire}, 'En attente')
  `;

  // Avertissement non bloquant : déjà 2 autres salariés sur cette période ?
  const allResult = await sql`SELECT * FROM requests WHERE statut != 'Refusé' AND email != ${session.email}`;
  const others = new Set();
  allResult.rows.forEach((r) => {
    if (overlaps(dateDebut, dateFin, r.date_debut.toISOString().slice(0, 10), r.date_fin.toISOString().slice(0, 10))) {
      others.add(r.email);
    }
  });

  return NextResponse.json({
    ok: true,
    warning: others.size >= 2 ? "Attention, déjà deux personnes sont en congé à ce moment-là, la direction tranchera." : null,
  });
}
