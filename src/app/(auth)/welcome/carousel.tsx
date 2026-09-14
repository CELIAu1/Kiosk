"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink, cx } from "@/components/ui";

export type Slide = {
  title: string;
  body: string;
  /** Real product images from a live shop, when there are any. */
  images: string[];
};

export function Onboarding({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const last = index === slides.length - 1;
  const slide = slides[index];

  // Keying the animated subtree on the slide index remounts it, so the
  // entrance transition replays on every slide without an effect.

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* The gradient wash and card fan from the design. */}
      <div key={index} className="relative overflow-hidden rounded-b-[56px]">
        <div
          className="h-[420px]"
          style={{
            background:
              "linear-gradient(165deg, #cfe3ff 0%, #e7d9fb 40%, #ffd6ec 72%, #ffffff 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-end gap-3">
            {[0, 1, 2].map((position) => {
              const image = slide.images[position];
              const middle = position === 1;
              return (
                <div
                  key={position}
                  className={cx(
                    "kiosk-rise overflow-hidden rounded-[14px] bg-white shadow-card",
                    middle ? "h-52 w-36" : "h-44 w-28",
                    position === 0 && "-rotate-6",
                    position === 2 && "rotate-6",
                  )}
                  style={{ animationDelay: `${position * 70}ms` }}
                >
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-b from-white to-brand-tint" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between px-6 pt-8 pb-8">
        <div key={index} className="text-center">
          <h1
            className="kiosk-rise text-[26px] leading-tight font-bold text-ink"
          >
            {slide.title}
          </h1>
          <p
            className="kiosk-rise mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-ink-soft"
            style={{ animationDelay: "80ms" }}
          >
            {slide.body}
          </p>
        </div>

        <div>
          <ol className="mb-7 flex justify-center gap-1.5" aria-label="Progress">
            {slides.map((_, dot) => (
              <li key={dot}>
                <button
                  type="button"
                  onClick={() => setIndex(dot)}
                  aria-label={`Go to slide ${dot + 1}`}
                  aria-current={dot === index ? "step" : undefined}
                  className={cx(
                    "h-1.5 rounded-full transition-all",
                    dot === index ? "w-7 bg-brand" : "w-4 bg-line hover:bg-line-strong",
                  )}
                />
              </li>
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
      </div>
    </div>
  );
}
