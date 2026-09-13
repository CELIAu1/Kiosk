"use client";

import { useActionState } from "react";
import { signUpAction, type FormState } from "@/lib/actions/auth";
import { Button, Input } from "@/components/ui";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUpAction,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <Input
        name="business_name"
        required
        placeholder="Business name"
        aria-label="Business name"
      />
      <Input name="owner_name" placeholder="Your name" aria-label="Your name" />
      <Input
        name="whatsapp"
        inputMode="tel"
        placeholder="WhatsApp number"
        aria-label="WhatsApp number"
      />
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
        autoComplete="new-password"
        required
        placeholder="Password (8+ characters)"
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
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
