import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line mt-24 no-print">
      <div className="shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-muted">
          <span className="font-display text-[15px] text-ink">Ingredient Calculator</span> — the cooking
          math, done for you.
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          <Link href="/recipes" className="link-quiet">
            Recipes
          </Link>
          <Link href="/convert" className="link-quiet">
            Unit converter
          </Link>
          <Link href="/info" className="link-quiet">
            Conversion tables
          </Link>
        </nav>
      </div>
    </footer>
  );
}
