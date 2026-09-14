"use client";

import { useActionState } from "react";
import { saveShopAction, type ShopFormState } from "@/lib/actions/shop";
import { Button, Field, Input, SectionHeading, Textarea } from "@/components/ui";
import { ImagePicker } from "@/components/ImagePicker";
import type { Business } from "@/lib/types";

export function ProfileForm({ business }: { business: Business }) {
  const [state, action, pending] = useActionState<ShopFormState, FormData>(
    saveShopAction,
    null,
  );

  return (
    <form action={action} className="space-y-10">
      <section className="space-y-4">
        <SectionHeading title="Your business" />
        <div className="flex items-start gap-4">
          {business.logo_image_id ? (
            <img
              src={`/api/images/${business.logo_image_id}`}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[20px] font-bold text-brand">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <ImagePicker name="logo" label="Profile photo" />
          </div>
        </div>

        <Field label="Business name">
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
          label="Your account tag"
          hint="Shown under your name on Home. Each shop also gets its own tag."
        >
          <Input name="slug" required defaultValue={business.slug} />
        </Field>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="How customers reach you"
          note="Shown on your shops so people can carry on the conversation where they already are."
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
        <p role="alert" className="text-[13px] text-bad">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="text-[13px] text-good">Saved.</p>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
