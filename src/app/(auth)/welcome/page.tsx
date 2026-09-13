import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Onboarding } from "./carousel";

export const metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

/**
 * The four onboarding slides (232:2070–232:2175). They say what KIOSK does
 * in the product's own plain language, not in feature-marketing language.
 */
const SLIDES = [
  {
    title: "Your shop, anywhere.",
    body: "Share your shop on any social platform. Customers can browse your products without needing a website.",
  },
  {
    title: "Browse before they buy.",
    body: "Customers can explore your catalogue and you see what catches their eye.",
  },
  {
    title: "One tag opens your shop.",
    body: "Put your tag in a bio or a status. Anyone who taps it lands in your shop.",
  },
  {
    title: "Keep pricing on your side.",
    body: "Save your prices in one place and share them when you're ready.",
  },
];

export default async function WelcomePage() {
  if (await getSessionUser()) redirect("/home");
  return <Onboarding slides={SLIDES} />;
}
