"use client";

import { useActionState, useState } from "react";
import { askQuestionAction, type StorefrontState } from "@/lib/actions/storefront";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { ChatIcon } from "@/components/icons";

/**
 * The question a customer would otherwise send as a DM. Asking it here means
 * the business sees it attached to the product, with a way to reply.
 */
export function AskForm({
  slug,
  productId,
  businessName,
  asked,
}: {
  slug: string;
  productId: string | null;
  businessName: string;
  asked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<StorefrontState, FormData>(
    askQuestionAction,
    null,
  );

  if (asked && !open) {
    return (
      <div className="border border-line bg-surface p-4">
        <p className="text-[14px] font-medium">Sent.</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          {businessName} has your question and your number. They&rsquo;ll get back to you.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-[13px] font-medium underline underline-offset-4"
        >
          Ask something else
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button tone="secondary" onClick={() => setOpen(true)} className="w-full">
        <ChatIcon className="h-4 w-4" />
        Ask a question
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-3 border border-line bg-surface p-4">
      <input type="hidden" name="slug" value={slug} />
      {productId && <input type="hidden" name="product_id" value={productId} />}

      <Field label={`Ask ${businessName}`}>
        <Textarea
          name="body"
          rows={3}
          required
          placeholder="Do you have this in size 43?"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your name">
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label="Your number" hint="So they can reply to you.">
          <Input name="phone" inputMode="tel" required autoComplete="tel" />
        </Field>
      </div>

      {state?.error && (
        <p role="alert" className="text-[13px] text-ember">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send question"}
        </Button>
        <Button type="button" tone="quiet" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
