import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-2 text-[22px] font-semibold tracking-tight">
        There&rsquo;s nothing at this link
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
        The shop or product may have been removed, or the link may be wrong.
      </p>
      <Link
        href="/"
        className="mt-5 text-[14px] font-medium underline underline-offset-4"
      >
        Go to KIOSK
      </Link>
    </div>
  );
}
