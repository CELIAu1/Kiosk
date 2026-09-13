"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink, cx } from "@/components/ui";

export function Onboarding({
  slides,
}: {
  slides: { title: string; body: string }[];
}) {
  const [index, setIndex] = useState(0);
  const last = index === slides.length - 1;
  const slide = slides[index];

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      {/* A calm tinted field stands in for the product photography the real
          app will show here. */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex h-64 w-full max-w-xs items-end justify-center rounded-[28px] bg-brand-tint pb-8">
          <div className="flex gap-2">
            {[0, 1, 2].map((card) => (
              <span
                key={card}
                className={cx(
                  "block rounded-[10px] bg-white shadow-card",
                  card === 1 ? "h-28 w-20" : "h-24 w-16",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="pb-2 text-center">
        <h1 className="text-[24px] font-bold text-ink">{slide.title}</h1>
        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-soft">
          {slide.body}
        </p>
      </div>

      <ol className="my-7 flex justify-center gap-1.5" aria-label="Progress">
        {slides.map((_, dot) => (
          <li
            key={dot}
            aria-current={dot === index ? "step" : undefined}
            className={cx(
              "h-1 rounded-full transition-all",
              dot === index ? "w-6 bg-brand" : "w-4 bg-line",
            )}
          />
        ))}
      </ol>

      {last ? (
        <div className="space-y-3">
          <ButtonLink href="/sign-up" size="lg" className="w-full">
            Create account
          </ButtonLink>
          <ButtonLink href="/sign-in" tone="soft" size="lg" className="w-full">
            I already have one
          </ButtonLink>
        </div>
      ) : (
        <div className="space-y-3">
          <Button size="lg" className="w-full" onClick={() => setIndex(index + 1)}>
            {index === 0 ? "Next" : "Continue"}
          </Button>
          <Link
            href="/sign-up"
            className="block py-1 text-center text-[13px] font-semibold text-ink-soft hover:text-ink"
          >
            Skip
          </Link>
        </div>
      )}
    </div>
  );
}
