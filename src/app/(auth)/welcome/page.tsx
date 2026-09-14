import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { Onboarding, type Slide } from "./carousel";

export const metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

const COPY = [
  {
    title: "Your shop, anywhere.",
    body: "Share your shop on any social platform. Customers browse your products without needing a website.",
  },
  {
    title: "Browse before they buy.",
    body: "Customers explore your catalogue, and you see exactly what caught their eye.",
  },
  {
    title: "One tag opens your shop.",
    body: "Put your tag in a bio or a status. Anyone who taps it lands straight in your shop.",
  },
  {
    title: "Keep pricing on your side.",
    body: "Your price book stays private. Share a price when you're ready, not before.",
  },
];

export default async function WelcomePage() {
  if (await getSessionUser()) redirect("/home");

  // Real product photography when the instance has any, so the onboarding
  // shows the actual product rather than an empty placeholder.
  const images = await all<{ image_id: string }>(
    `SELECT pi.image_id
       FROM product_images pi
       JOIN products p ON p.id = pi.product_id AND p.status IN ('active', 'sold_out')
      WHERE pi.position = 0
      ORDER BY p.created_at DESC
      LIMIT 12`,
  );
  const urls = images.map((row) => `/api/images/${row.image_id}`);

  const slides: Slide[] = COPY.map((slide, index) => ({
    ...slide,
    images: urls.length
      ? [0, 1, 2].map((offset) => urls[(index * 3 + offset) % urls.length])
      : [],
  }));

  return <Onboarding slides={slides} />;
}
