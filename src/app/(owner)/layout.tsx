import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { OwnerTabs } from "@/components/OwnerNav";

/**
 * The designs are a phone app, so the owner side is a single mobile column.
 * On a wide screen it stays centred at phone width rather than stretching
 * into a layout the design never specified.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getSessionUser())) redirect("/sign-in");

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-surface">
      <main className="px-5 pb-28">{children}</main>
      <OwnerTabs />
    </div>
  );
}
