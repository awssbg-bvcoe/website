import Link from "next/link";
import { Lockup } from "@/components/brand/Lockup";

export function AdminHeader({ login }: { login: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-grey-700 bg-grey-850/95 px-4 py-4 sm:px-8">
      <Link href="/admin" className="text-paper">
        <Lockup compact />
      </Link>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-grey-300">
          Signed in as <span className="font-mono text-paper">@{login}</span>
        </span>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="pressable inline-flex h-11 items-center border border-grey-500 px-4 font-bold uppercase hover:border-paper">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
