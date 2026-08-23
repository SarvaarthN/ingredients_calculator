"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";

export function MobileNav({
  items,
  user,
}: {
  items: { href: string; label: string }[];
  user: SessionUser | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        aria-expanded={open}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-line bg-paper shadow-sm">
          <div className="shell flex flex-col gap-1 py-4">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="link-quiet rounded-[6px] px-2 py-2.5">
                {item.label}
              </Link>
            ))}
            <hr className="rule my-2" />
            {user ? (
              <div className="flex flex-col gap-2">
                <span className="px-2 text-[13px] text-muted">{user.email}</span>
                <Link href="/recipes/new" className="btn btn-accent">
                  New recipe
                </Link>
                <LogoutButton className="btn btn-outline" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" className="btn btn-outline">
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-primary">
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
