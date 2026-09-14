import { requireSession } from "@/lib/auth";
import { countShops } from "@/lib/data/shops";
import { WizardShell } from "@/components/WizardShell";
import { CreateShopForm } from "./form";

export const metadata = { title: "Create a shop" };
export const dynamic = "force-dynamic";

export default async function NewShopPage() {
  const session = await requireSession();
  const existing = await countShops(session.business.id);

  return (
    <WizardShell
      step={1}
      title="Name this shop"
      subtitle="One shop per thing you sell. You can add more later."
      back={existing > 0 ? "/shops" : "/home"}
    >
      <CreateShopForm />
    </WizardShell>
  );
}
