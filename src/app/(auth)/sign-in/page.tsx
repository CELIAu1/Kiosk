import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignInForm } from "./form";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getSessionUser()) redirect("/home");
  return (
    <div className="flex min-h-dvh flex-col px-6 py-10">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-center text-[22px] font-bold text-ink">Welcome back</h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-[13px] leading-relaxed text-ink-soft">
          Pick up where your customers left off.
        </p>
        <div className="mt-8">
          <SignInForm />
        </div>
      </div>
      <p className="text-center text-[13px] text-ink-soft">
        New here?{" "}
        <Link href="/sign-up" className="font-bold text-ink">
          Create account
        </Link>
      </p>
    </div>
  );
}
