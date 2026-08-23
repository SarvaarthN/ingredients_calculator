"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImportStarterButton({
  count,
  className = "btn btn-outline",
  label,
}: {
  count: number;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onImport() {
    setBusy(true);
    setMessage(null);

    const res = await fetch("/api/recipes/import", { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error ?? "Import failed.");
      setBusy(false);
      return;
    }

    const parts = [`${data.added} added`];
    if (data.skipped) parts.push(`${data.skipped} already saved`);
    if (data.failed?.length) parts.push(`${data.failed.length} could not be read`);
    setMessage(parts.join(", ") + ".");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" className={className} onClick={onImport} disabled={busy}>
        {busy ? "Importing…" : (label ?? `Import ${count} recipes from MyRecipes1.xlsx`)}
      </button>
      {message && <p className="text-[13px] text-muted">{message}</p>}
    </div>
  );
}
