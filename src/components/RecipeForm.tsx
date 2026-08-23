"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { UnitSelect } from "./UnitSelect";
import { parseAmount, quantityToInput } from "@/lib/format";
import type { Recipe } from "@/lib/types";

interface Row {
  key: string;
  id?: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
}

let counter = 0;
const nextKey = () => `row-${counter++}`;

function emptyRow(): Row {
  return { key: nextKey(), name: "", quantity: "", unit: "g", note: "" };
}

function rowsFrom(recipe: Recipe): Row[] {
  return recipe.ingredients.map((ing) => ({
    key: nextKey(),
    id: ing.id,
    name: ing.name,
    quantity: quantityToInput(ing.quantity),
    unit: ing.unit,
    note: ing.note ?? "",
  }));
}

export function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const router = useRouter();
  const editing = Boolean(recipe);

  const [name, setName] = useState(recipe?.name ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [servings, setServings] = useState(recipe ? String(recipe.servings) : "4");
  const [servingLabel, setServingLabel] = useState(recipe?.servingLabel ?? "people");
  const [rows, setRows] = useState<Row[]>(() =>
    recipe ? rowsFrom(recipe) : [emptyRow(), emptyRow(), emptyRow()],
  );
  const [baseKey, setBaseKey] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>(() =>
    recipe && recipe.steps.length > 0 ? [...recipe.steps] : [""],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Resolve the base row once, from the recipe if we have not been told otherwise.
  const resolvedBaseKey = useMemo(() => {
    if (baseKey && rows.some((r) => r.key === baseKey)) return baseKey;
    if (recipe) {
      const baseId = recipe.ingredients.find((i) => i.isBase)?.id;
      const match = rows.find((r) => r.id && r.id === baseId);
      if (match) return match.key;
    }
    return rows.find((r) => r.name.trim() && parseAmount(r.quantity) !== null)?.key ?? null;
  }, [baseKey, rows, recipe]);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.key !== key)));
  }

  function moveRow(index: number, delta: number) {
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function moveStep(index: number, delta: number) {
    setSteps((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const filled = rows.filter((r) => r.name.trim());
    if (filled.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }

    const servingsValue = parseAmount(servings);
    if (servingsValue === null || servingsValue <= 0) {
      setError("Say how many this recipe is written for — a number greater than zero.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      servings: servingsValue,
      servingLabel: servingLabel.trim() || "people",
      ingredients: filled.map((r) => ({
        id: r.id,
        name: r.name.trim(),
        quantity: parseAmount(r.quantity),
        unit: r.unit,
        note: r.note.trim(),
        isBase: r.key === resolvedBaseKey,
      })),
      steps: steps.map((s) => s.trim()).filter(Boolean),
    };

    if (!payload.name) {
      setError("Give the recipe a name.");
      return;
    }

    setBusy(true);
    const res = await fetch(editing ? `/api/recipes/${recipe!.id}` : "/api/recipes", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Could not save the recipe.");
      setBusy(false);
      return;
    }

    router.push(`/recipes/${data.recipe.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {/* ── The recipe itself ─────────────────────────────────────────────── */}
      <section className="card card-pad">
        <p className="eyebrow mb-4">
          <span className="numeral">№01</span> The recipe
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="recipe-name">
              Name
            </label>
            <input
              id="recipe-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Laadi Paav"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="recipe-description">
              Note <span className="normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <input
              id="recipe-description"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Soft dinner rolls, baker's percentages against flour"
            />
          </div>

          <div>
            <label className="label" htmlFor="recipe-servings">
              These quantities feed
            </label>
            <input
              id="recipe-servings"
              className="input tnum"
              inputMode="decimal"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="4"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="recipe-serving-label">
              Counted in
            </label>
            <input
              id="recipe-serving-label"
              className="input"
              value={servingLabel}
              onChange={(e) => setServingLabel(e.target.value)}
              placeholder="people"
              list="serving-labels"
            />
            <datalist id="serving-labels">
              <option value="people" />
              <option value="servings" />
              <option value="portions" />
              <option value="pieces" />
              <option value="buns" />
              <option value="slices" />
            </datalist>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          This is the anchor for scaling by headcount — “written for {servings || "…"}{" "}
          {servingLabel || "people"}”.
        </p>
      </section>

      {/* ── Ingredients ───────────────────────────────────────────────────── */}
      <section className="card card-pad">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <p className="eyebrow">
            <span className="numeral">№02</span> Ingredients &amp; quantities
          </p>
          <button type="button" className="btn btn-outline btn-sm" onClick={addRow}>
            Add ingredient
          </button>
        </div>

        <p className="mb-5 text-[13.5px] leading-relaxed text-muted">
          Leave a quantity blank for “as per taste” — those lines are never scaled. Mark one line as
          the <strong className="text-ink-2">base ingredient</strong>: it is what the recipe gets
          re-anchored to when you scale by what you have on hand.
        </p>

        <div className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="panel-quiet grid gap-3 p-3 sm:grid-cols-[auto_1fr_92px_150px_auto] sm:items-center"
            >
              <label
                className="flex items-center gap-2 text-[12px] text-muted sm:flex-col sm:gap-1 sm:text-[10px]"
                title="Use this ingredient as the base for scaling"
              >
                <input
                  type="radio"
                  name="base-ingredient"
                  className="accent-[var(--accent)]"
                  checked={resolvedBaseKey === row.key}
                  onChange={() => setBaseKey(row.key)}
                />
                <span className="uppercase tracking-[0.08em] font-semibold">Base</span>
              </label>

              <div>
                <input
                  className="input"
                  value={row.name}
                  onChange={(e) => updateRow(row.key, { name: e.target.value })}
                  placeholder={index === 0 ? "Flour" : "Ingredient"}
                  aria-label="Ingredient name"
                />
              </div>

              <input
                className="input tnum"
                inputMode="decimal"
                value={row.quantity}
                onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                placeholder="250"
                aria-label="Quantity"
              />

              <UnitSelect
                value={row.unit}
                onChange={(unit) => updateRow(row.key, { unit })}
                ariaLabel="Unit"
              />

              <div className="flex items-center gap-1 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label="Move down"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length === 1}
                  aria-label="Remove ingredient"
                  title="Remove"
                >
                  ✕
                </button>
              </div>

              <input
                className="input sm:col-start-2 sm:col-span-4"
                value={row.note}
                onChange={(e) => updateRow(row.key, { note: e.target.value })}
                placeholder="Note — softened, room temperature, 1–1.5%…"
                aria-label="Note"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Method ────────────────────────────────────────────────────────── */}
      <section className="card card-pad">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <p className="eyebrow">
            <span className="numeral">№03</span> Adding procedure
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setSteps((prev) => [...prev, ""])}
          >
            Add step
          </button>
        </div>

        <p className="mb-5 text-[13.5px] leading-relaxed text-muted">
          One step per box, in the order things go in. Optional, but it is what turns a quantity list
          into a recipe.
        </p>

        <ol className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="numeral mt-3 w-7 shrink-0 tnum">
                {String(index + 1).padStart(2, "0")}
              </span>
              <textarea
                className="textarea"
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                placeholder={
                  index === 0 ? "Mix the flour, yeast and sugar with the warm milk." : "Next step…"
                }
                aria-label={`Step ${index + 1}`}
              />
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => moveStep(index, -1)}
                  disabled={index === 0}
                  aria-label="Move step up"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => moveStep(index, 1)}
                  disabled={index === steps.length - 1}
                  aria-label="Move step down"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setSteps((prev) => (prev.length === 1 ? [""] : prev.filter((_, i) => i !== index)))}
                  aria-label="Remove step"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {error && <p className="notice notice-error">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-accent" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save changes" : "Save recipe"}
        </button>
        <Link href={editing ? `/recipes/${recipe!.id}` : "/recipes"} className="btn btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
