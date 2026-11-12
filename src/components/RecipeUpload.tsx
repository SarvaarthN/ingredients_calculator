"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type Saved = { id: string; name: string; ingredients: number };

export function RecipeUpload() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved[] | null>(null);

  function choose(f: File | undefined | null) {
    setError(null);
    setSaved(null);
    if (!f) return;
    if (!/\.(pdf|docx?)$/i.test(f.name)) {
      setError("Choose a PDF or a Word document (.pdf, .docx or .doc).");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("That file is larger than 4 MB. Try a smaller copy.");
      return;
    }
    setFile(f);
  }

  async function onUpload() {
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/recipes/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong reading that file.");
        setBusy(false);
        return;
      }

      const recipes: Saved[] = data.recipes ?? [];
      if (recipes.length === 1) {
        router.push(`/recipes/${recipes[0].id}`);
        router.refresh();
        return;
      }
      setSaved(recipes);
      setFile(null);
      if (input.current) input.current.value = "";
      setBusy(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <label
        htmlFor="recipe-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files?.[0]);
        }}
        className={`card card-pad flex cursor-pointer flex-col items-center gap-2 border-dashed py-12 text-center transition-colors ${
          dragging ? "border-[var(--accent)] bg-[var(--accent-soft)]" : ""
        }`}
      >
        <span className="font-display text-[22px]">
          {file ? file.name : "Drop a recipe file here"}
        </span>
        <span className="text-[14px] text-muted">
          {file
            ? `${(file.size / 1024).toFixed(0)} KB · click to choose a different file`
            : "or click to choose one · PDF, DOCX or DOC, up to 4 MB"}
        </span>
        <input
          ref={input}
          id="recipe-file"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={busy}
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </label>

      {error && <p className="notice notice-error">{error}</p>}

      {saved && (
        <div className="notice">
          <strong>
            {saved.length} recipes added from that file:
          </strong>
          <ul className="mt-1 list-disc pl-5">
            {saved.map((r) => (
              <li key={r.id}>
                <Link href={`/recipes/${r.id}`} className="link">
                  {r.name}
                </Link>{" "}
                ({r.ingredients} ingredients)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-accent" onClick={onUpload} disabled={!file || busy}>
          {busy ? "Reading the recipe…" : "Read and add recipe"}
        </button>
        {busy && <span className="text-[13.5px] text-muted">This usually takes 10–30 seconds.</span>}
      </div>
    </div>
  );
}
