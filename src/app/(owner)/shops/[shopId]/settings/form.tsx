"use client";

import { useActionState } from "react";
import {
  deleteShopAction,
  updateShopAction,
  type ShopFormState,
} from "@/lib/actions/shops";
import { Button, Field, Input, Textarea } from "@/components/ui";
import type { Shop } from "@/lib/types";

export function ShopSettingsForm({ shop }: { shop: Shop }) {
  const [state, action, pending] = useActionState<ShopFormState, FormData>(
    updateShopAction,
    null,
  );

  return (
    <div className="space-y-10">
      <form action={action} className="space-y-5">
        <input type="hidden" name="shop_id" value={shop.id} />

        <Field label="Shop name">
          <Input name="name" required defaultValue={shop.name} />
        </Field>

        <Field
          label="Shop tag"
          hint="Customers use this to open your shop. Changing it breaks links you've already shared."
        >
          <Input name="tag" required defaultValue={shop.tag} />
        </Field>

        <Field label="About this shop" optional>
          <Textarea
            name="about"
            rows={3}
            defaultValue={shop.about ?? ""}
            placeholder="Pre-loved pieces, picked one at a time."
          />
        </Field>

        {state?.error && (
          <p role="alert" className="text-[13px] text-bad">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save shop"}
        </Button>
      </form>

      <div className="border-t border-line-warm pt-6">
        <p className="text-[12px] leading-relaxed text-ink-soft">
          Deleting this shop removes its products and their interest history. Your other
          shops are not affected.
        </p>
        <form action={deleteShopAction} className="mt-3">
          <input type="hidden" name="shop_id" value={shop.id} />
          <Button type="submit" tone="danger" size="sm">
            Delete this shop
          </Button>
        </form>
      </div>
    </div>
  );
}
