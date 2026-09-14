"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PeopleIcon, SparkleIcon, StoreIcon } from "./icons";
import { cx } from "./ui";

/**
 * The four destinations from the Figma bottom bar: Home, Shops, Interest,
 * Profile. Black bar, white inactive labels, blue active — 232:1719.
 *
 * Orders and Customers deliberately sit off this bar and are reached from
 * Home and from Profile -> Account.
 */
const ITEMS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/shops", label: "Shops", Icon: StoreIcon },
  { href: "/interest", label: "Interest", Icon: SparkleIcon },
  { href: "/profile", label: "Profile", Icon: PeopleIcon },
];

/** Setup runs full-screen, so the tab bar steps aside for it. */
function isFullScreen(pathname: string) {
  return pathname === "/shops/new" || /^\/shops\/[^/]+\/setup(\/|$)/.test(pathname);
}

export function OwnerTabs() {
  const pathname = usePathname();
  if (isFullScreen(pathname)) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[480px] items-center justify-between bg-black px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex flex-col items-center justify-center gap-0.5 px-2",
              active ? "text-brand-nav" : "text-white",
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-[12px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
