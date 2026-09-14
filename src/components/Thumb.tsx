import { cx } from "./ui";

/**
 * Product imagery. Uses a plain <img> rather than next/image because every
 * image is served from our own /api/images route with immutable caching, and
 * the optimizer would add a sharp dependency for no benefit here.
 *
 * The caller's classes land on the wrapper, never on the <img>. Sizing one
 * element and filling it from the inside keeps a caller's `w-12` from having
 * to win a specificity argument with a `w-full` on the image itself.
 */
export function Thumb({
  imageId,
  alt,
  className,
  ratio = "square",
  sizes,
}: {
  imageId: string | null | undefined;
  alt: string;
  className?: string;
  ratio?: "square" | "portrait" | "wide";
  sizes?: string;
}) {
  const shape =
    ratio === "portrait"
      ? "aspect-[3/4]"
      : ratio === "wide"
        ? "aspect-[16/9]"
        : "aspect-square";

  return (
    <div className={cx(shape, "overflow-hidden bg-sunk", className)}>
      {imageId ? (
        <img
          src={`/api/images/${imageId}`}
          alt={alt}
          loading="lazy"
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-ink-muted"
          aria-hidden
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="4" width="18" height="16" rx="1" />
            <path d="m3 16 5-4 4 3 3-2 6 5" />
          </svg>
        </div>
      )}
    </div>
  );
}
