"use client";

import { useActionState, useState } from "react";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/lib/actions/products";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { moneyInputValue } from "@/lib/money";
import type { Product } from "@/lib/types";

export type ProductFormValues = {
  product: Product;
  categoryName: string | null;
  imageIds: string[];
  options: string[];
};

export function ProductForm({
  currency,
  categories,
  shopId,
  existing,
}: {
  currency: string;
  categories: string[];
  /** Products always belong to exactly one shop. */
  shopId: string;
  existing?: ProductFormValues;
}) {
  const action = existing ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    null,
  );
  const [tracksStock, setTracksStock] = useState(
    existing ? existing.product.stock !== null : false,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="shop_id" value={shopId} />
      {existing && (
        <input type="hidden" name="product_id" value={existing.product.id} />
      )}

      <section className="space-y-4">
        <Field label="Photos" hint="The first one is what customers see in your shop.">
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="block w-full text-[13px] text-ink-soft file:mr-3 file:rounded-full file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-ink"
          />
        </Field>

        {existing && existing.imageIds.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {existing.imageIds.map((imageId) => (
              <label key={imageId} className="block w-20 cursor-pointer">
                <img
                  src={`/api/images/${imageId}`}
                  alt=""
                  className="aspect-square w-20 rounded-[8px] border border-line object-cover"
                />
                <span className="mt-1 flex items-center gap-1 text-[11px] text-ink-muted">
                  <input type="checkbox" name="remove_image" value={imageId} />
                  Remove
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <Field label="Name">
        <Input
          name="name"
          required
          defaultValue={existing?.product.name}
          placeholder="Black leather slides"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Price (${currency})`}>
          <Input
            name="price"
            inputMode="decimal"
            required
            defaultValue={
              existing ? moneyInputValue(existing.product.price_minor, currency) : ""
            }
            placeholder="25000"
          />
        </Field>
        <Field label="Was" optional hint="Shows as a crossed-out old price.">
          <Input
            name="compare_at"
            inputMode="decimal"
            defaultValue={
              existing?.product.compare_at_minor
                ? moneyInputValue(existing.product.compare_at_minor, currency)
                : ""
            }
            placeholder="32000"
          />
        </Field>
      </div>

      <Field label="Category" optional hint="Type a new one or reuse an existing one.">
        <Input
          name="category"
          list="kiosk-categories"
          defaultValue={existing?.categoryName ?? ""}
          placeholder="Sneakers"
        />
      </Field>
      <datalist id="kiosk-categories">
        {categories.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <Field
        label="Description"
        optional
        hint="What a customer would otherwise have to ask you in a DM."
      >
        <Textarea
          name="description"
          rows={4}
          defaultValue={existing?.product.description ?? ""}
          placeholder="Genuine leather. True to size. Ships from Lagos in 2 days."
        />
      </Field>

      <Field
        label="Sizes or choices"
        optional
        hint="One per line. Customers pick one when they order."
      >
        <Textarea
          name="options"
          rows={3}
          defaultValue={existing?.options.join("\n") ?? ""}
          placeholder={"Size 41\nSize 42\nSize 43"}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Show in shop">
          <Select name="status" defaultValue={existing?.product.status ?? "active"}>
            <option value="active">Yes — customers can order it</option>
            <option value="sold_out">Show it, but mark it sold out</option>
            <option value="hidden">Hide it for now</option>
          </Select>
        </Field>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium">How many left</span>
          <label className="flex items-center gap-2 text-[13px] text-ink-soft">
            <input
              type="checkbox"
              checked={tracksStock}
              onChange={(event) => setTracksStock(event.target.checked)}
            />
            Count stock for this product
          </label>
          {tracksStock && (
            <Input
              name="stock"
              inputMode="numeric"
              aria-label="How many left"
              className="mt-2"
              defaultValue={existing?.product.stock ?? 1}
              placeholder="1"
            />
          )}
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-[13px] text-bad">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : existing ? "Save changes" : "Add to my shop"}
        </Button>
      </div>
    </form>
  );
}
