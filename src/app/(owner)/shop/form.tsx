"use client";

import { useActionState } from "react";
import { saveShopAction, type ShopFormState } from "@/lib/actions/shop";
import { Button, Field, Input, SectionHeading, Textarea } from "@/components/ui";
import type { Business } from "@/lib/types";

export function ShopForm({
  business,
  origin,
}: {
  business: Business;
  origin: string;
}) {
  const [state, action, pending] = useActionState<ShopFormState, FormData>(
    saveShopAction,
    null,
  );

  return (
    <form action={action} className="space-y-10">
      <section className="space-y-4">
        <SectionHeading title="Your shop" />
        <div className="flex items-start gap-4">
          {business.logo_image_id ? (
            <img
              src={`/api/images/${business.logo_image_id}`}
              alt=""
              className="h-16 w-16 shrink-0 border border-line object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-sunk text-[20px] font-medium text-ink-soft">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <Field label="Shop photo" optional>
              <input
                type="file"
                name="logo"
                accept="image/*"
                className="block w-full text-[13px] text-ink-soft file:mr-3 file:rounded-sm file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-ink"
              />
            </Field>
          </div>
        </div>

        <Field label="Shop name">
          <Input name="name" required defaultValue={business.name} />
        </Field>

        <Field label="One line about what you sell" optional>
          <Textarea
            name="tagline"
            rows={2}
            defaultValue={business.tagline ?? ""}
            placeholder="Curated sneakers for men and women. Lagos."
          />
        </Field>

        <Field
          label="Your shop link"
          hint={`${origin.replace(/^https?:\/\//, "")}/s/your-link`}
        >
          <Input name="slug" required defaultValue={business.slug} />
        </Field>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="How customers reach you"
          note="Shown on your shop so people can carry on the conversation where they already are."
        />
        <Field label="WhatsApp number" optional>
          <Input
            name="whatsapp"
            inputMode="tel"
            defaultValue={business.whatsapp ?? ""}
            placeholder="+234 801 234 5678"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" optional>
            <Input
              name="instagram"
              defaultValue={business.instagram ?? ""}
              placeholder="adassneakercorner"
            />
          </Field>
          <Field label="TikTok" optional>
            <Input
              name="tiktok"
              defaultValue={business.tiktok ?? ""}
              placeholder="adassneakercorner"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Details" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" optional>
            <Input name="owner_name" defaultValue={business.owner_name ?? ""} />
          </Field>
          <Field label="Where you are" optional>
            <Input
              name="location"
              defaultValue={business.location ?? ""}
              placeholder="Lagos, Nigeria"
            />
          </Field>
        </div>
        <Field label="Currency" hint="Three-letter code, for example NGN, GHS, KES or USD.">
          <Input name="currency" defaultValue={business.currency} maxLength={3} />
        </Field>
      </section>

      {state?.error && (
        <p role="alert" className="text-[13px] text-ember">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="text-[13px] text-grow">Saved.</p>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save shop"}
      </Button>
    </form>
  );
}
