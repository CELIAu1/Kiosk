"use client";

import { useState } from "react";
import { saveShopCategoriesAction } from "@/lib/actions/shops";
import { Button, Input, cx } from "@/components/ui";
import { PlusIcon } from "@/components/icons";

/**
 * Step 3 of the design: tappable category chips with a "+" affordance. The
 * suggestions come from what the owner said they sell, and they can add their
 * own — a small business rarely fits a fixed list.
 */
export function CategoryPicker({
  shopId,
  suggestions,
  alreadyChosen,
}: {
  shopId: string;
  suggestions: string[];
  alreadyChosen: string[];
}) {
  const [chosen, setChosen] = useState<string[]>(alreadyChosen);
  const [options, setOptions] = useState<string[]>(() =>
    Array.from(new Set([...alreadyChosen, ...suggestions])),
  );
  const [custom, setCustom] = useState("");

  function toggle(name: string) {
    setChosen((old) =>
      old.includes(name) ? old.filter((item) => item !== name) : [...old, name],
    );
  }

  function addCustom() {
    const name = custom.trim();
    if (!name) return;
    setOptions((old) => (old.includes(name) ? old : [...old, name]));
    setChosen((old) => (old.includes(name) ? old : [...old, name]));
    setCustom("");
  }

  return (
    <form action={saveShopCategoriesAction} className="space-y-5">
      <input type="hidden" name="shop_id" value={shopId} />
      {chosen.map((name) => (
        <input key={name} type="hidden" name="category" value={name} />
      ))}

      <div className="flex flex-wrap justify-center gap-2">
        {options.map((name) => {
          const on = chosen.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              aria-pressed={on}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium",
                on ? "bg-brand text-white" : "bg-sunk text-ink hover:bg-line-soft",
              )}
            >
              {!on && <PlusIcon className="h-3.5 w-3.5" />}
              {name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add your own"
          aria-label="Add your own category"
        />
        <Button type="button" tone="soft" onClick={addCustom}>
          Add
        </Button>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={chosen.length === 0}
      >
        Continue
      </Button>
    </form>
  );
}
