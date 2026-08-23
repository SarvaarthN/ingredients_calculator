import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { LogoutButton } from "./LogoutButton";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/recipes", label: "Recipes" },
  { href: "/convert", label: "Converter" },
  { href: "/info", label: "Conversions" },
];

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md no-print">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-display text-[22px] leading-none">Ingredient</span>
          <span className="font-display text-[22px] leading-none italic text-accent">Calculator</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-quiet rounded-[6px] px-3 py-2 text-[14px] hover:bg-surface-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-[13px] text-muted max-w-[160px] truncate" title={user.email}>
                {user.name}
              </span>
              <Link href="/recipes/new" className="btn btn-accent btn-sm">
                New recipe
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Create account
              </Link>
            </>
          )}
        </div>

        <MobileNav items={NAV} user={user} />
      </div>
    </header>
  );
}
