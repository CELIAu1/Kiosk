"use client";

import { useActionState, useState } from "react";
import { createShopAction, type ShopFormState } from "@/lib/actions/shops";
import { Button, Field, Input } from "@/components/ui";

function tagify(value: string) {
  return value
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

/**
 * Step 1 of the shop-creation wizard (232:2760). The tag preview updates as
 * the owner types, because the tag is the thing they will paste into a bio.
 */
export function CreateShopForm() {
  const [state, action, pending] = useActionState<ShopFormState, FormData>(
    createShopAction,
    null,
  );
  const [name, setName] = useState("");
  const tag = tagify(name) || "myshop";

  return (
    <form action={action} className="space-y-5">
      <Field label="Shop name">
        <Input
          name="name"
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Sneakers"
          className="rounded-full border-line bg-surface px-5 py-3.5 shadow-soft"
        />
      </Field>

      <p className="rounded-[10px] bg-sunk px-4 py-3 text-[12px] text-ink-soft">
        Shop tag <span className="font-bold text-ink">@{tag}</span> — customers can use
        this to open your shop.
      </p>
      <input type="hidden" name="tag" value={tag} />

      {state?.error && (
        <p role="alert" className="text-[13px] text-bad">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || name.trim().length === 0}
      >
        {pending ? "Creating…" : "Continue"}
      </Button>
    </form>
  );
}
