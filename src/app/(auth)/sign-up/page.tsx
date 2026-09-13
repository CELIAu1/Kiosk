import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignUpForm } from "./form";

export const metadata = { title: "Set up your kiosk" };

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/home");
  return (
    <div>
      <h1 className="text-[26px] font-semibold">Set up your kiosk</h1>
      <p className="mt-1 text-[14px] text-ink-soft">
        Takes a minute. You can add your products straight after.
      </p>
      <div className="mt-7">
        <SignUpForm />
      </div>
      <p className="mt-6 text-[13px] text-ink-soft">
        Already have one?{" "}
        <Link href="/sign-in" className="font-medium text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
