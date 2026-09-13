import {
  createClient,
  type Client,
  type InValue,
  type Transaction,
} from "@libsql/client";
import { SCHEMA_STATEMENTS } from "./schema.ts";

/**
 * KIOSK runs on libSQL, which is SQLite — the same engine, reachable over the
 * network. Local development points at a plain file and production points at
 * a hosted database, so both exercise the identical code path and the schema
 * and queries are the same in either place.
 *
 * The client is async, unlike node:sqlite, which is why every data function in
 * this app returns a promise.
 */
const globalForDb = globalThis as unknown as {
  __kioskClient?: Client;
  __kioskSchema?: Promise<void>;
  __kioskWrites?: Promise<unknown>;
};

function connect(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? "file:data/kiosk.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url.startsWith("file:") && !authToken) {
    throw new Error(
      "TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is not a file: URL.",
    );
  }
  return createClient(authToken ? { url, authToken } : { url });
}

export function client(): Client {
  if (!globalForDb.__kioskClient) globalForDb.__kioskClient = connect();
  return globalForDb.__kioskClient;
}

/**
 * Applies the schema once per process, in a single round trip. Every statement
 * is CREATE ... IF NOT EXISTS, so this is safe to repeat; `npm run db:migrate`
 * calls the same code for a deliberate, one-off run.
 */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.__kioskSchema) {
    globalForDb.__kioskSchema = prepare().catch((error) => {
      // Don't cache a failure: the next request should try again.
      globalForDb.__kioskSchema = undefined;
      throw error;
    });
  }
  return globalForDb.__kioskSchema;
}

async function prepare(): Promise<void> {
  const c = client();

  // A local file is a single SQLite database being written by concurrent
  // requests, so it needs WAL and a busy timeout or parallel writes fail with
  // SQLITE_BUSY. A hosted database handles its own concurrency, so these are
  // pointless there and are skipped.
  if (isLocalFile()) {
    await c.execute("PRAGMA journal_mode = WAL");
    await c.execute("PRAGMA busy_timeout = 5000");
  }

  await c.batch(SCHEMA_STATEMENTS, "write");
}

function isLocalFile(): boolean {
  return (process.env.TURSO_DATABASE_URL ?? "file:data/kiosk.db").startsWith("file:");
}

/**
 * libSQL hands blobs back as ArrayBuffer and integers as number | bigint.
 * Normalise both so callers see the shapes the rest of the app expects.
 */
function normalise<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof ArrayBuffer) out[key] = new Uint8Array(value);
    else if (typeof value === "bigint") out[key] = Number(value);
    else out[key] = value;
  }
  return out as T;
}

export async function all<T>(sql: string, ...args: InValue[]): Promise<T[]> {
  await ensureSchema();
  const result = await client().execute({ sql, args });
  return result.rows.map((row) => normalise<T>(row as Record<string, unknown>));
}

export async function one<T>(
  sql: string,
  ...args: InValue[]
): Promise<T | null> {
  const rows = await all<T>(sql, ...args);
  return rows[0] ?? null;
}

export async function run(sql: string, ...args: InValue[]) {
  await ensureSchema();
  return serializeWrites(() => client().execute({ sql, args }));
}

/**
 * One local SQLite file cannot take concurrent writers: a transaction holds
 * the lock and everything else fails with SQLITE_BUSY. Requests here write on
 * nearly every page view, so writes are queued in-process rather than left to
 * collide. A hosted database serialises this itself, so remote writes are
 * passed straight through and stay parallel.
 *
 * Reads are not queued — WAL allows them alongside a writer.
 */
function serializeWrites<T>(fn: () => Promise<T>): Promise<T> {
  if (!isLocalFile()) return fn();
  const previous = globalForDb.__kioskWrites ?? Promise.resolve();
  const next = previous.then(fn, fn);
  globalForDb.__kioskWrites = next.catch(() => undefined);
  return next;
}

/** The same helpers, bound to an open transaction. */
export type Tx = {
  all<T>(sql: string, ...args: InValue[]): Promise<T[]>;
  one<T>(sql: string, ...args: InValue[]): Promise<T | null>;
  run(sql: string, ...args: InValue[]): Promise<unknown>;
};

function bind(transaction: Transaction): Tx {
  const runIn = async <T>(sql: string, args: InValue[]) => {
    const result = await transaction.execute({ sql, args });
    return result.rows.map((row) => normalise<T>(row as Record<string, unknown>));
  };
  return {
    all: <T>(sql: string, ...args: InValue[]) => runIn<T>(sql, args),
    one: async <T>(sql: string, ...args: InValue[]) =>
      (await runIn<T>(sql, args))[0] ?? null,
    run: (sql: string, ...args: InValue[]) => runIn<unknown>(sql, args),
  };
}

/**
 * Runs `fn` inside a write transaction, rolling back if it throws. The handle
 * is passed in rather than taken from module scope so statements cannot
 * accidentally escape the transaction.
 */
export async function tx<T>(fn: (t: Tx) => Promise<T>): Promise<T> {
  await ensureSchema();
  return serializeWrites(async () => {
    const transaction = await client().transaction("write");
    try {
      const result = await fn(bind(transaction));
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });
}
