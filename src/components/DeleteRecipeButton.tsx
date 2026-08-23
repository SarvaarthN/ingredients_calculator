"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteRecipeButton({
  id,
  name,
  className = "btn btn-danger btn-sm",
  label = "Delete",
  redirectTo,
}: {
  id: string;
  name: string;
  className?: string;
  label?: string;
  /** Where to go after a successful delete. Defaults to refreshing in place. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;

    setBusy(true);
    setError(null);
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete the recipe.");
      setBusy(false);
      return;
    }

    if (redirectTo) router.replace(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button type="button" className={className} onClick={onDelete} disabled={busy}>
        {busy ? "Deleting…" : label}
      </button>
      {error && <span className="text-[13px] text-accent">{error}</span>}
    </>
  );
}
