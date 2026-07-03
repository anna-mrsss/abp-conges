import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/session";
import { uid } from "@/lib/dates";

function rowToClosure(c) {
  return {
    id: c.id,
    libelle: c.libelle || "",
    dateDebut: c.date_debut.toISOString().slice(0, 10),
    dateFin: c.date_fin.toISOString().slice(0, 10),
  };
}

// Public (visible sur l'écran de connexion, avant authentification).
export async function GET() {
  await ensureSchema();
  const result = await sql`SELECT * FROM closures ORDER BY date_debut ASC`;
  return NextResponse.json({ closures: result.rows.map(rowToClosure) });
}

export async function POST(request) {
  await ensureSchema();
  const session = await getSession();
  if (!session || session.role !== "direction") {
    return NextResponse.json({ error: "Accès réservé à la direction." }, { status: 403 });
  }

  const body = await request.json();
  const dateDebut = body.dateDebut;
  const dateFin = body.dateFin;
  const libelle = (body.libelle || "").trim();

  if (!dateDebut || !dateFin) {
    return NextResponse.json({ error: "Merci de renseigner une date de début et une date de fin." }, { status: 400 });
  }
  if (new Date(dateFin) < new Date(dateDebut)) {
    return NextResponse.json({ error: "La date de fin doit être postérieure ou égale à la date de début." }, { status: 400 });
  }

  const id = uid();
  await sql`
    INSERT INTO closures (id, libelle, date_debut, date_fin)
    VALUES (${id}, ${libelle}, ${dateDebut}, ${dateFin})
  `;
  return NextResponse.json({ ok: true });
}
