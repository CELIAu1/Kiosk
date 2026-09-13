"use client";

import { useActionState } from "react";
import { placeOrderAction, type StorefrontState } from "@/lib/actions/storefront";
import { Button, Field, Input, Textarea } from "@/components/ui";

/**
 * Checkout collects the minimum a small business actually needs to fulfil an
 * order: who you are and how to reach you. Payment happens the way it already
 * does between them and their customer — transfer, cash, or on delivery.
 */
export function CheckoutForm({
  handle,
  total,
  businessName,
}: {
  handle: string;
  total: string;
  businessName: string;
}) {
  const [state, action, pending] = useActionState<StorefrontState, FormData>(
    placeOrderAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="handle" value={handle} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label="Phone number" hint={`So ${businessName} can confirm.`}>
          <Input name="phone" inputMode="tel" required autoComplete="tel" />
        </Field>
      </div>

      <Field label="Instagram" optional>
        <Input name="instagram" placeholder="yourhandle" />
      </Field>

      <Field label="Anything they should know" optional>
        <Textarea
          name="note"
          rows={3}
          placeholder="Deliver to Yaba on Saturday. I'll pay on transfer."
        />
      </Field>

      {state?.error && (
        <p role="alert" className="text-[13px] text-ember">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : `Place order · ${total}`}
      </Button>
      <p className="text-center text-[12px] leading-relaxed text-ink-muted">
        {businessName} will get in touch to confirm your order and arrange payment.
      </p>
    </form>
  );
}
