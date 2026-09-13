import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      <Link href="/" className="text-[15px] font-semibold tracking-tight">
        KIOSK
      </Link>
      <div className="flex flex-1 flex-col justify-center py-10">{children}</div>
    </div>
  );
}
