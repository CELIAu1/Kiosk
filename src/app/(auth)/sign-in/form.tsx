"use client";

import { useActionState } from "react";
import { signInAction, type FormState } from "@/lib/actions/auth";
import { Button, Input } from "@/components/ui";

export function SignInForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signInAction,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <Input
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="Enter email address"
        aria-label="Email"
      />
      <Input
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Password"
        aria-label="Password"
      />
      {state?.error && (
        <p role="alert" className="text-[13px] text-bad">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        tone="dark"
        size="lg"
        className="w-full rounded-[10px]"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Login"}
      </Button>
    </form>
  );
}
