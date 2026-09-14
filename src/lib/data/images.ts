import { one, run } from "../db";
import { newId } from "../ids";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_BYTES = 2 * 1024 * 1024;

export class ImageError extends Error {}

/**
 * Images are stored in SQLite. For a catalogue of a few hundred products this
 * is fast, keeps the whole shop in one file, and means no object storage to
 * configure before a business can put a photo online.
 */
export async function saveImage(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new ImageError("That file type isn't supported. Use a JPG, PNG or WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new ImageError(
      "That photo is too large even after shrinking. Try a smaller one.",
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const id = newId("img");
  await run(
    `INSERT INTO images (id, mime, bytes, created_at) VALUES (?, ?, ?, ?)`,
    id,
    file.type,
    bytes,
    new Date().toISOString(),
  );
  return id;
}

export async function getImage(id: string) {
  return one<{ mime: string; bytes: Uint8Array }>(
    `SELECT mime, bytes FROM images WHERE id = ?`,
    id,
  );
}

/** Saves every non-empty file in a multi-file form field, in order. */
export async function saveImages(files: File[]): Promise<string[]> {
  const ids: string[] = [];
  for (const file of files) {
    if (file && file.size > 0) ids.push(await saveImage(file));
  }
  return ids;
}

export function imageUrl(id: string | null | undefined): string | null {
  return id ? `/api/images/${id}` : null;
}
