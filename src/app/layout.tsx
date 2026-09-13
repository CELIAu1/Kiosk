import type { Metadata, Viewport } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import "./globals.css";

// DM Sans carries the interface; Montserrat is used for stat numerals,
// matching the Figma file.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "KIOSK", template: "%s · KIOSK" },
  description:
    "One simple place to showcase what you sell, see who is interested, and turn that interest into orders.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${montserrat.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
