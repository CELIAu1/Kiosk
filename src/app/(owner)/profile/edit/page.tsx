import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "./form";

export const metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const session = await requireSession();

  return (
    <>
      <PageHeader title="Edit profile" back={{ href: "/profile" }} />
      <div className="pb-6">
        <ProfileForm business={session.business} />
      </div>
    </>
  );
}
