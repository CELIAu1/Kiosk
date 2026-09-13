type IconProps = { className?: string };

/**
 * Icons are almost always flex children, so they carry `shrink-0`: without it
 * a tight flex container squeezes the svg to zero width and the icon silently
 * disappears while still being in the DOM.
 */
function icon(className?: string) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ? `shrink-0 ${className}` : "shrink-0",
  };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M4 4h7.2L20 12.8 12.8 20 4 11.2z" />
      <circle cx="8.4" cy="8.4" r="1.2" />
    </svg>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M5 7h14l-1 13H6z" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
    </svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c.7-3.2 3-5 5.5-5s4.8 1.8 5.5 5" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 14.8c1.8.6 3 2.2 3.5 4.7" />
    </svg>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M3.5 9 5 4.5h14L20.5 9" />
      <path d="M9 20v-5h6v5" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5a9.6 9.6 0 0 1-2.6-.35L5 20.5l1-3.2A6.4 6.4 0 0 1 4 12.5C4 8.9 7.6 6 12 6s8 2.9 8 6.5Z" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <rect x="3.5" y="6" width="17" height="13" rx="2.5" />
      <path d="M3.5 10.5h17" />
      <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M12 3.5 13.6 8 18 9.6 13.6 11.2 12 15.7 10.4 11.2 6 9.6 10.4 8Z" />
      <path d="M18 15.2 18.7 17l1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 3.2.8 4.7 1.5 5.5H5c.7-.8 1.5-2.3 1.5-5.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <circle cx="5.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.9" cy="7.1" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...icon(props.className)}>
      <path d="M14.5 4v9.8a3.4 3.4 0 1 1-2.8-3.35" />
      <path d="M14.5 4c.4 2 1.9 3.4 4 3.5" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={props.className ? `shrink-0 ${props.className}` : "shrink-0"}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.41 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.06s.89 2.39 1.01 2.56c.12.16 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
