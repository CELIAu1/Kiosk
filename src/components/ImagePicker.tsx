"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "./ui";

/**
 * Photo input that shrinks pictures in the browser before they are uploaded.
 *
 * This is not an optimisation, it is what makes uploading work at all: a
 * Server Action request body is capped at 1MB, and a photo straight off a
 * phone is several times that, so the upload used to fail with a 500. It also
 * keeps what we store small — every image lives in the database and is served
 * back to customers.
 */
const MAX_EDGE = 1600;
const QUALITY = 0.82;

/**
 * Above this, staying small matters more than staying byte-optimal: a file
 * this big risks the request limit, so the re-encoded version is used even if
 * it did not come out smaller.
 */
const MUST_SHRINK_ABOVE = 900 * 1024;

type Preview = { url: string; kb: number };

async function shrink(file: File): Promise<File> {
  // Leave non-photos (and animations, which a canvas would flatten) alone.
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  // WebP usually wins, but not on every image, so try both and take the best.
  const encoded = (
    await Promise.all(
      (["image/webp", "image/jpeg"] as const).map(
        (type) =>
          new Promise<{ blob: Blob; type: string } | null>((resolve) =>
            canvas.toBlob(
              (blob) => resolve(blob ? { blob, type } : null),
              type,
              QUALITY,
            ),
          ),
      ),
    )
  ).filter((candidate) => candidate !== null);

  const best = encoded.sort((a, b) => a.blob.size - b.blob.size)[0];
  if (!best) return file;

  const worthIt = best.blob.size < file.size || file.size > MUST_SHRINK_ABOVE;
  if (!worthIt) return file;

  const extension = best.type === "image/webp" ? ".webp" : ".jpg";
  return new File([best.blob], file.name.replace(/\.\w+$/, "") + extension, {
    type: best.type,
    lastModified: Date.now(),
  });
}

export function ImagePicker({
  name,
  multiple = false,
  label = "Add photos",
  hint,
}: {
  name: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [busy, setBusy] = useState(false);

  // Shrinking is async, so hold the form back until it finishes. Otherwise a
  // quick tap on Save submits the original file and hits the size limit.
  const busyRef = useRef(false);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const hold = (event: Event) => {
      if (busyRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    form.addEventListener("submit", hold, true);
    return () => form.removeEventListener("submit", hold, true);
  }, []);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    if (chosen.length === 0) return;

    setBusy(true);
    const shrunk = await Promise.all(chosen.map(shrink));

    // Put the smaller files back on the input so the form submits those.
    const bag = new DataTransfer();
    for (const file of shrunk) bag.items.add(file);
    if (inputRef.current) inputRef.current.files = bag.files;

    setPreviews((old) => {
      for (const p of old) URL.revokeObjectURL(p.url);
      return shrunk.map((file) => ({
        url: URL.createObjectURL(file),
        kb: Math.round(file.size / 1024),
      }));
    });
    setBusy(false);
  }

  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-medium text-ink-muted">
        {label}
      </span>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cx(
          "flex w-full items-center justify-center gap-2 rounded-card border border-dashed",
          "border-brand-edge bg-brand-tint px-4 py-5 text-[13px] font-semibold text-ink",
          "hover:bg-brand-tint-soft",
        )}
      >
        {busy ? (
          "Preparing photos…"
        ) : (
          <>
            <CameraIcon />
            {previews.length > 0 ? "Choose different photos" : "Choose from your phone"}
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
      />

      {previews.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {previews.map((preview) => (
            <li key={preview.url}>
              <img
                src={preview.url}
                alt=""
                className="h-20 w-20 rounded-[8px] border border-line object-cover"
              />
              <span className="mt-1 block text-center text-[10px] text-ink-faint">
                {preview.kb} KB
              </span>
            </li>
          ))}
        </ul>
      )}

      {hint && <p className="mt-2 text-[12px] text-ink-soft">{hint}</p>}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
