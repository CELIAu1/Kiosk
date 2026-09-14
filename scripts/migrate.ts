/**
 * Applies the schema to whatever TURSO_DATABASE_URL points at.
 *
 * Every statement is CREATE ... IF NOT EXISTS, so this is safe to re-run and
 * is the thing to run once against a new hosted database before first deploy.
 */
import { ensureSchema } from "../src/lib/db.ts";

await ensureSchema();
console.log(
  `Schema applied to ${process.env.TURSO_DATABASE_URL ?? "file:data/kiosk.db"}`,
);
