"use client";

import { useActionState } from "react";
import { signUpAction, type FormState } from "@/lib/actions/auth";
import { Button, Field, Input } from "@/components/ui";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUpAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="Business name" hint="This is the name customers will see.">
        <Input name="business_name" required placeholder="Ada's Sneaker Corner" />
      </Field>
      <Field label="Your name" optional>
        <Input name="owner_name" placeholder="Ada Okafor" />
      </Field>
      <Field label="WhatsApp number" optional hint="So customers can reach you directly.">
        <Input name="whatsapp" inputMode="tel" placeholder="+234 801 234 5678" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>
      {state?.error && (
        <p role="alert" className="text-[13px] text-ember">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Setting up…" : "Create my kiosk"}
      </Button>
    </form>
  );
}
