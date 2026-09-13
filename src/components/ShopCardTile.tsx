import Link from "next/link";
import { Thumb } from "./Thumb";
import type { ShopCard } from "@/lib/types";

/** The 140x164 shop card from the Home rail (232:1624). */
export function ShopCardTile({ shop }: { shop: ShopCard }) {
  return (
    <Link
      href={`/shops/${shop.id}`}
      className="block w-[140px] shrink-0 overflow-hidden rounded-card bg-surface shadow-card"
    >
      <Thumb
        imageId={shop.cover_ids[0] ?? null}
        alt=""
        className="h-[114px] w-full"
      />
      <span className="block p-2.5">
        <span className="block truncate text-[12px] font-semibold text-ink">
          {shop.name}
        </span>
        <span className="mt-1 block text-[10px] text-ink-soft">
          {shop.product_count} {shop.product_count === 1 ? "item" : "items"}
        </span>
      </span>
    </Link>
  );
}

/**
 * The larger card on the Shops tab (232:2304): a three-image collage, the
 * @tag with its counts, then Share and Customer view.
 */
export function ShopCollage({ shop }: { shop: ShopCard }) {
  const covers = shop.cover_ids;
  return (
    <div className="grid h-[120px] grid-cols-3 gap-0.5 overflow-hidden">
      {[0, 1, 2].map((index) => (
        <Thumb
          key={index}
          imageId={covers[index] ?? null}
          alt=""
          className="h-full w-full"
        />
      ))}
    </div>
  );
}
