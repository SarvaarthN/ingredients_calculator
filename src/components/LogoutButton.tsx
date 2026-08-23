"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton({ className = "btn btn-outline btn-sm" }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <button type="button" className={className} onClick={logout} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
