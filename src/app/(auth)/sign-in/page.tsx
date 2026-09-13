import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignInForm } from "./form";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getSessionUser()) redirect("/home");
  return (
    <div>
      <h1 className="text-[26px] font-semibold">Sign in</h1>
      <p className="mt-1 text-[14px] text-ink-soft">
        Pick up where your customers left off.
      </p>
      <div className="mt-7">
        <SignInForm />
      </div>
      <p className="mt-6 text-[13px] text-ink-soft">
        New here?{" "}
        <Link href="/sign-up" className="font-medium text-ink underline underline-offset-4">
          Set up your kiosk
        </Link>
      </p>
    </div>
  );
}
