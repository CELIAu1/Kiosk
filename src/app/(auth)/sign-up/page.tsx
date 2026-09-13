import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignUpForm } from "./form";

export const metadata = { title: "Create your profile" };

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/home");
  return (
    <div className="flex min-h-dvh flex-col px-6 py-10">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-center text-[22px] font-bold text-ink">
          Create your profile
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-[13px] leading-relaxed text-ink-soft">
          Share your shop on any social platform. Customers can browse your products
          without needing a website.
        </p>
        <div className="mt-8">
          <SignUpForm />
        </div>
      </div>
      <p className="text-center text-[13px] text-ink-soft">
        Already have one?{" "}
        <Link href="/sign-in" className="font-bold text-ink">
          Login
        </Link>
      </p>
    </div>
  );
}
