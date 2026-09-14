import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { ButtonLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  if (await getSessionUser()) redirect("/home");

  // If a shop exists, offer it as something real to look at.
  const [example] = await all<{ tag: string; name: string }>(
    `SELECT tag, name FROM shops ORDER BY created_at LIMIT 1`,
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-8">
      <header className="flex items-center justify-between">
        <span className="text-[15px] font-semibold tracking-tight">KIOSK</span>
        <Link
          href="/sign-in"
          className="text-[14px] text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-14">
        <h1 className="text-[32px] leading-[1.12] font-semibold tracking-tight sm:text-[40px]">
          Your customers already found you.
          <br />
          <span className="text-ink-muted">This is where you keep them.</span>
        </h1>

        <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-soft">
          One simple place to show what you sell, see who is interested, and turn that
          interest into orders — without building a website.
        </p>

        {/* The product in one line: social finds them, KIOSK keeps them. */}
        <ol className="mt-9 space-y-3 border-l border-line pl-5">
          <Step n="1" text="Instagram, TikTok and WhatsApp bring people to you." />
          <Step n="2" text="They open your link and browse everything you sell." />
          <Step n="3" text="You see who looked, who asked, and who ordered." />
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/welcome" size="lg">
            Get started
          </ButtonLink>
          {example && (
            <ButtonLink href={`/s/${example.tag}`} tone="soft" size="lg">
              Look at an example shop
            </ButtonLink>
          )}
        </div>
      </main>

      <footer className="text-[12px] text-ink-muted">
        Built for small businesses that sell through their DMs.
      </footer>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <li className="relative">
      <span className="absolute top-1.5 -left-[25px] flex h-2 w-2 rounded-full bg-line-strong" />
      <span className="tabular text-[12px] text-ink-muted">{n}</span>
      <p className="text-[15px] leading-snug text-ink">{text}</p>
    </li>
  );
}
