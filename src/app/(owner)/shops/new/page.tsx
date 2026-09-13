import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { countShops } from "@/lib/data/shops";
import { ArrowLeftIcon } from "@/components/icons";
import { CreateShopForm } from "./form";

export const metadata = { title: "Create a shop" };
export const dynamic = "force-dynamic";

export default async function NewShopPage() {
  const session = await requireSession();
  const existing = await countShops(session.business.id);

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between">
        <Link
          href={existing > 0 ? "/shops" : "/home"}
          aria-label="Back"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sunk text-ink"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <span className="text-[14px] font-semibold text-ink">Step 1 of 4</span>
        <span className="h-9 w-9" aria-hidden />
      </div>

      <h1 className="mt-8 text-[24px] font-bold text-ink">Name this shop</h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        One shop per thing you sell. You can add more later.
      </p>

      <div className="mt-7">
        <CreateShopForm />
      </div>

      {/* The remaining steps are the product, category and share steps the
          owner walks through straight after — reachable from the shop itself. */}
      <ol className="mt-8 flex gap-1.5" aria-label="Progress">
        {[0, 1, 2, 3].map((step) => (
          <li
            key={step}
            className={
              step === 0
                ? "h-1 flex-1 rounded-full bg-brand"
                : "h-1 flex-1 rounded-full bg-line"
            }
          />
        ))}
      </ol>
    </div>
  );
}
