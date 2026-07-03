import { sql } from "@vercel/postgres";

let initialized = false;

/**
 * Crée les tables si elles n'existent pas encore. Appelé au début de chaque
 * route API pour garantir que la base est prête, sans étape manuelle de
 * migration à faire soi-même.
 */
export async function ensureSchema() {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expiry TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS closures (
      id TEXT PRIMARY KEY,
      libelle TEXT,
      date_debut DATE NOT NULL,
      date_fin DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      horodateur_ts BIGINT NOT NULL,
      horodateur TEXT NOT NULL,
      email TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      date_debut DATE NOT NULL,
      date_fin DATE NOT NULL,
      commentaire TEXT,
      statut TEXT NOT NULL DEFAULT 'En attente'
    );
  `;

  initialized = true;
}

export { sql };
