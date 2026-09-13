import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
// Explicit extension so `scripts/` can run this module directly under Node,
// which does not do extensionless resolution the way the bundler does.
import { SCHEMA } from "./schema.ts";

/**
 * One SQLite handle per process. Next.js hot-reloads modules in development,
 * so the handle is parked on globalThis to avoid opening a new connection
 * (and re-running migrations) on every edit.
 */
const globalForDb = globalThis as unknown as { __kioskDb?: DatabaseSync };

function open(): DatabaseSync {
  // The default is statically scoped to data/ so the bundler can see where the
  // database lives; an explicit override is the operator's business, not the
  // bundler's, hence the ignore comment.
  const override = process.env.KIOSK_DB_PATH;
  const file = override
    ? resolve(/* turbopackIgnore: true */ override)
    : join(process.cwd(), "data", "kiosk.db");
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

export function db(): DatabaseSync {
  if (!globalForDb.__kioskDb) globalForDb.__kioskDb = open();
  return globalForDb.__kioskDb;
}

type Param = string | number | bigint | null | Uint8Array;

/** Rows come back as null-prototype objects; spread them into plain ones. */
export function all<T>(sql: string, ...params: Param[]): T[] {
  return db()
    .prepare(sql)
    .all(...params)
    .map((row) => ({ ...row })) as T[];
}

export function one<T>(sql: string, ...params: Param[]): T | null {
  const row = db()
    .prepare(sql)
    .get(...params);
  return row ? ({ ...row } as T) : null;
}

export function run(sql: string, ...params: Param[]) {
  return db()
    .prepare(sql)
    .run(...params);
}

/** Runs `fn` inside a transaction, rolling back if it throws. */
export function tx<T>(fn: () => T): T {
  const handle = db();
  handle.exec("BEGIN");
  try {
    const result = fn();
    handle.exec("COMMIT");
    return result;
  } catch (error) {
    handle.exec("ROLLBACK");
    throw error;
  }
}
