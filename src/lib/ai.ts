import Anthropic from "@anthropic-ai/sdk";

/**
 * Drafting a shop from a sentence the owner writes.
 *
 * This is the "Create for me with AI" path. It is optional: when no API key is
 * configured the app falls back to a plain local draft so the flow still works
 * and nothing pretends to be smarter than it is. `usedAI` says which ran, and
 * the UI tells the owner.
 */
export type DraftProduct = {
  name: string;
  category: string;
  description: string;
  priceMinor: number;
};

export type ShopDraft = {
  categories: string[];
  products: DraftProduct[];
  usedAI: boolean;
  note?: string;
};

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    categories: {
      type: "array",
      items: { type: "string" },
      description: "3-6 short category names for this shop.",
    },
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          description: {
            type: "string",
            description:
              "One or two plain sentences a small business owner would actually write.",
          },
          price: {
            type: "number",
            description: "A realistic price in whole major units of the currency.",
          },
        },
        required: ["name", "category", "description", "price"],
        additionalProperties: false,
      },
    },
  },
  required: ["categories", "products"],
  additionalProperties: false,
} as const;

export async function draftShop(input: {
  shopName: string;
  sells: string;
  currency: string;
  categories?: string[];
  count?: number;
}): Promise<ShopDraft> {
  const count = input.count ?? 6;

  if (!aiAvailable()) {
    return { ...localDraft(input, count), usedAI: false };
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      // A short, well-specified extraction task: low effort is the right
      // trade here, and keeps the wizard fast.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: DRAFT_SCHEMA },
      },
      system:
        "You help a small business set up an online shop. Write the way the owner " +
        "would: plain, concrete, no marketing language. Prices must be realistic " +
        "for the stated currency and market.",
      messages: [
        {
          role: "user",
          content:
            `Shop name: ${input.shopName}\n` +
            `They sell: ${input.sells}\n` +
            (input.categories?.length
              ? `Categories they picked: ${input.categories.join(", ")}\n`
              : "") +
            `Currency: ${input.currency}\n\n` +
            `Draft ${count} starter products for this shop.`,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const parsed = JSON.parse(text) as {
      categories: string[];
      products: { name: string; category: string; description: string; price: number }[];
    };

    return {
      categories: dedupe([...(input.categories ?? []), ...(parsed.categories ?? [])]),
      products: (parsed.products ?? []).slice(0, 12).map((product) => ({
        name: String(product.name).slice(0, 80),
        category: String(product.category).slice(0, 40),
        description: String(product.description).slice(0, 400),
        priceMinor: Math.max(0, Math.round(Number(product.price) || 0) * 100),
      })),
      usedAI: true,
    };
  } catch (error) {
    // A failed draft must never block shop creation — fall back and say so.
    const reason =
      error instanceof Anthropic.APIError
        ? `The AI draft failed (${error.status}).`
        : "The AI draft failed.";
    return {
      ...localDraft(input, count),
      usedAI: false,
      note: `${reason} These are plain starter rows you can edit.`,
    };
  }
}

/** No key, or the call failed: a simple, honest draft from what they typed. */
function localDraft(
  input: { sells: string; categories?: string[] },
  count: number,
): Omit<ShopDraft, "usedAI"> {
  const fromText = input.sells
    .split(/[,\n/]| and /i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 40);

  const categories = dedupe([...(input.categories ?? []), ...fromText]).slice(0, 6);
  const base = categories.length > 0 ? categories : ["Everything"];

  return {
    categories: base,
    products: Array.from({ length: Math.min(count, base.length * 2) }, (_, index) => {
      const category = base[index % base.length];
      return {
        name: `${titleCase(category)} ${index < base.length ? "" : "2"}`.trim(),
        category: titleCase(category),
        description: "",
        priceMinor: 0,
      };
    }),
  };
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const clean = titleCase(value.trim());
    const key = clean.toLowerCase();
    if (clean && !seen.has(key)) {
      seen.add(key);
      out.push(clean);
    }
  }
  return out;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
