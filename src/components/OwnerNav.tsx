"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon, HomeIcon, PeopleIcon, StoreIcon, TagIcon } from "./icons";
import { cx } from "./ui";

/**
 * Five destinations, no more. "Interest" is deliberately not one of them:
 * interest is information about products and people, so it lives on those
 * screens rather than becoming a page the owner has to remember to visit.
 */
const ITEMS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/products", label: "Products", Icon: TagIcon },
  { href: "/orders", label: "Orders", Icon: BagIcon },
  { href: "/customers", label: "Customers", Icon: PeopleIcon },
  { href: "/shop", label: "Shop", Icon: StoreIcon },
];

function useActive(href: string) {
  const pathname = usePathname();
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  Icon,
  badge,
  variant,
}: {
  href: string;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  badge?: number;
  variant: "rail" | "tab";
}) {
  const active = useActive(href);

  if (variant === "tab") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
          active ? "text-ink" : "text-ink-muted",
        )}
      >
        <span className="relative">
          <Icon className={cx("h-5 w-5", active && "stroke-[2]")} />
          {!!badge && badge > 0 && (
            <span className="absolute -top-1 -right-1.5 h-1.5 w-1.5 rounded-full bg-ember" />
          )}
        </span>
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[14px]",
        active ? "bg-sunk font-medium text-ink" : "text-ink-soft hover:text-ink",
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && (
        <span className="tabular rounded-xs bg-ember px-1.5 text-[11px] font-medium text-paper">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function OwnerTabs({ badges }: { badges: Record<string, number> }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ITEMS.map((item) => (
        <NavLink key={item.href} {...item} variant="tab" badge={badges[item.href]} />
      ))}
    </nav>
  );
}

export function OwnerRail({ badges }: { badges: Record<string, number> }) {
  return (
    <nav aria-label="Main" className="space-y-0.5">
      {ITEMS.map((item) => (
        <NavLink key={item.href} {...item} variant="rail" badge={badges[item.href]} />
      ))}
    </nav>
  );
}
