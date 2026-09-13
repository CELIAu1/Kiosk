"use client";

import { useActionState } from "react";
import { signInAction, type FormState } from "@/lib/actions/auth";
import { Button, Field, Input } from "@/components/ui";

export function SignInForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signInAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      {state?.error && (
        <p role="alert" className="text-[13px] text-ember">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
