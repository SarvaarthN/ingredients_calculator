"use client";

import { useMemo, useState } from "react";
import { UnitSelect } from "./UnitSelect";
import { formatAmount, formatFactor, formatGrams, parseAmount, quantityToInput } from "@/lib/format";
import {
  applyFactor,
  baseIngredient,
  bulkDisplayUnits,
  factorByBaseIngredient,
  factorByServings,
  factorByYield,
  recipeTotalGrams,
} from "@/lib/scale";
import { BULK_UNIT_GROUPS, convert, unitLabel } from "@/lib/units";
import type { Recipe, ScaleMode } from "@/lib/types";

const TABS: { mode: ScaleMode; n: string; title: string; sub: string }[] = [
  { mode: "servings", n: "01", title: "By servings", sub: "How many people are you cooking for?" },
  { mode: "base", n: "02", title: "By base ingredient", sub: "How much of it have you actually got?" },
  { mode: "yield", n: "03", title: "By output", sub: "How much finished food do you need?" },
];

export function RecipeScaler({ recipe }: { recipe: Recipe }) {
  const base = baseIngredient(recipe);
  const originalTotal = useMemo(() => recipeTotalGrams(recipe), [recipe]);

  const [mode, setMode] = useState<ScaleMode>("servings");

  // §01
  const [targetServings, setTargetServings] = useState(String(recipe.servings));

  // §02
  const [baseId, setBaseId] = useState(base?.id ?? recipe.ingredients[0]?.id ?? "");
  const selectedBase = recipe.ingredients.find((i) => i.id === baseId) ?? base;
  const [baseQty, setBaseQty] = useState(quantityToInput(selectedBase?.quantity ?? null));
  const [baseUnit, setBaseUnit] = useState(selectedBase?.unit ?? "g");

  // §03
  const [yieldQty, setYieldQty] = useState(
    originalTotal.grams === null ? "" : quantityToInput(Math.round(originalTotal.grams)),
  );
  const [yieldUnit, setYieldUnit] = useState("g");

  // Per-row unit overrides in the results table, and the whole-column control
  // above it. "custom" means individual rows have been changed since the last
  // bulk choice, so no single unit describes the column any more.
  const [displayUnits, setDisplayUnits] = useState<Record<string, string>>({});
  const [bulkUnit, setBulkUnit] = useState("");

  /** Re-display every ingredient in `target` at once. */
  function applyBulkUnit(target: string) {
    setBulkUnit(target);
    setDisplayUnits(bulkDisplayUnits(recipe, target).units);
  }

  /** A single row overridden by hand — no one unit describes the column now. */
  function setRowUnit(id: string, unit: string) {
    setDisplayUnits((prev) => ({ ...prev, [id]: unit }));
    setBulkUnit("custom");
  }

  const bulkKeptOriginal = useMemo(
    () => (bulkUnit === "custom" ? [] : bulkDisplayUnits(recipe, bulkUnit).keptOriginal),
    [bulkUnit, recipe],
  );

  const { factor, error } = useMemo((): { factor: number | null; error?: string } => {
    if (mode === "servings") {
      const target = parseAmount(targetServings);
      if (target === null || target <= 0) return { factor: null };
      const f = factorByServings(recipe, target);
      return f === null ? { factor: null, error: "This recipe has no serving count to scale from." } : { factor: f };
    }

    if (mode === "base") {
      const qty = parseAmount(baseQty);
      if (qty === null) return { factor: null };
      return factorByBaseIngredient(recipe, baseId, qty, baseUnit);
    }

    const qty = parseAmount(yieldQty);
    if (qty === null) return { factor: null };
    const res = factorByYield(recipe, qty, yieldUnit);
    return { factor: res.factor, error: res.error };
  }, [mode, targetServings, baseQty, baseUnit, baseId, yieldQty, yieldUnit, recipe]);

  const result = useMemo(
    () => applyFactor(recipe, factor ?? 1, displayUnits),
    [recipe, factor, displayUnits],
  );

  const showing = factor !== null;
  const scaledServings = factor === null ? null : recipe.servings * factor;

  function switchBaseIngredient(id: string) {
    setBaseId(id);
    const ing = recipe.ingredients.find((i) => i.id === id);
    setBaseUnit(ing?.unit ?? "g");
    setBaseQty(quantityToInput(ing?.quantity ?? null));
  }

  function reset() {
    setTargetServings(String(recipe.servings));
    switchBaseIngredient(base?.id ?? recipe.ingredients[0]?.id ?? "");
    setYieldQty(originalTotal.grams === null ? "" : quantityToInput(Math.round(originalTotal.grams)));
    setYieldUnit("g");
    setDisplayUnits({});
    setBulkUnit("");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Mode picker ───────────────────────────────────────────────────── */}
      <section className="no-print">
        <p className="eyebrow mb-4">
          <span className="numeral">№</span> Scale it
        </p>
        <div className="tabs" role="tablist" aria-label="Scaling mode">
          {TABS.map((tab) => (
            <button
              key={tab.mode}
              type="button"
              role="tab"
              aria-selected={mode === tab.mode}
              className="tab"
              onClick={() => setMode(tab.mode)}
            >
              <span className="numeral">№{tab.n}</span>
              <span className="tab-title">{tab.title}</span>
              <span className="tab-sub">{tab.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Controls for the active mode ──────────────────────────────────── */}
      <section className="card card-pad no-print">
        {mode === "servings" && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label className="label" htmlFor="target-servings">
                  Cooking for how many {recipe.servingLabel}?
                </label>
                <input
                  id="target-servings"
                  className="input tnum max-w-[220px]"
                  inputMode="decimal"
                  value={targetServings}
                  onChange={(e) => setTargetServings(e.target.value)}
                  placeholder={String(recipe.servings)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[0.5, 2, 3].map((mult) => (
                  <button
                    key={mult}
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setTargetServings(quantityToInput(recipe.servings * mult))}
                  >
                    ×{mult}
                  </button>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
                  Reset
                </button>
              </div>
            </div>
            <p className="text-[13.5px] text-muted">
              Written for{" "}
              <strong className="text-ink-2 tnum">
                {recipe.servings} {recipe.servingLabel}
              </strong>
              . Everything below moves in proportion.
            </p>
          </div>
        )}

        {mode === "base" && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1.4fr_100px_1fr]">
              <div>
                <label className="label" htmlFor="base-ingredient">
                  Base ingredient
                </label>
                <select
                  id="base-ingredient"
                  className="select"
                  value={baseId}
                  onChange={(e) => switchBaseIngredient(e.target.value)}
                >
                  {recipe.ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id} disabled={ing.quantity === null}>
                      {ing.name}
                      {ing.isBase ? " (marked base)" : ""}
                      {ing.quantity === null ? " — no fixed quantity" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="base-qty">
                  You have
                </label>
                <input
                  id="base-qty"
                  className="input tnum"
                  inputMode="decimal"
                  value={baseQty}
                  onChange={(e) => setBaseQty(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div>
                <label className="label" htmlFor="base-unit">
                  Unit
                </label>
                <UnitSelect id="base-unit" value={baseUnit} onChange={setBaseUnit} />
              </div>
            </div>
            <p className="text-[13.5px] text-muted">
              {selectedBase && selectedBase.quantity !== null ? (
                <>
                  The recipe asks for{" "}
                  <strong className="text-ink-2 tnum">
                    {formatAmount(selectedBase.quantity, selectedBase.unit)}{" "}
                    {unitLabel(selectedBase.unit)}
                  </strong>{" "}
                  of {selectedBase.name}. Enter what you actually have and everything else follows.
                </>
              ) : (
                "Pick an ingredient with a fixed quantity."
              )}
            </p>
          </div>
        )}

        {mode === "yield" && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[140px_1fr_auto] sm:items-end">
              <div>
                <label className="label" htmlFor="yield-qty">
                  Output needed
                </label>
                <input
                  id="yield-qty"
                  className="input tnum"
                  inputMode="decimal"
                  value={yieldQty}
                  onChange={(e) => setYieldQty(e.target.value)}
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="label" htmlFor="yield-unit">
                  Unit
                </label>
                <UnitSelect id="yield-unit" value={yieldUnit} onChange={setYieldUnit} />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
                Reset
              </button>
            </div>
            <p className="text-[13.5px] leading-relaxed text-muted">
              {originalTotal.grams !== null ? (
                <>
                  As written, the ingredients add up to{" "}
                  <strong className="text-ink-2 tnum">{formatGrams(originalTotal.grams)}</strong>{" "}
                  before cooking.{" "}
                  {originalTotal.unweighable.length > 0 && (
                    <>
                      {originalTotal.unweighable.join(", ")} could not be weighed and{" "}
                      {originalTotal.unweighable.length === 1 ? "is" : "are"} left out of the total.{" "}
                    </>
                  )}
                  Losses during cooking — evaporation, trimming — are not accounted for.
                </>
              ) : (
                "This recipe has no weighable ingredients, so it cannot be scaled by output."
              )}
            </p>
          </div>
        )}

        {error && <p className="notice notice-error mt-4">{error}</p>}
      </section>

      {/* ── Result ────────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">
            <span className="numeral">№</span> Your quantities
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {showing && (
              <span className="chip chip-accent tnum">Scale ×{formatFactor(result.factor)}</span>
            )}
            {showing && scaledServings !== null && (
              <span className="chip tnum">
                {formatAmount(scaledServings, "")} {recipe.servingLabel}
              </span>
            )}
            {showing && result.totalGrams !== null && (
              <span className="chip tnum">{formatGrams(result.totalGrams)} total</span>
            )}
            <label className="flex items-center gap-2 no-print">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted whitespace-nowrap">
                Show all in
              </span>
              <select
                className="select text-[13px] py-1.5 w-[150px]"
                value={bulkUnit}
                onChange={(e) => applyBulkUnit(e.target.value)}
              >
                <option value="">Original units</option>
                {bulkUnit === "custom" && (
                  <option value="custom" disabled>
                    Mixed
                  </option>
                )}
                {BULK_UNIT_GROUPS.map((group) => (
                  <optgroup key={group.kind} label={group.title}>
                    {group.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
        </div>

        {bulkKeptOriginal.length > 0 && (
          <p className="mb-3 text-[13px] text-muted no-print">
            {bulkKeptOriginal.join(", ")} {bulkKeptOriginal.length === 1 ? "is" : "are"} counted
            rather than measured, so {bulkKeptOriginal.length === 1 ? "it keeps" : "they keep"} the
            original unit.
          </p>
        )}

        <div className="card scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingTop: 14 }}>Ingredient</th>
                <th style={{ paddingTop: 14 }} className="text-right whitespace-nowrap">
                  As written
                </th>
                <th style={{ paddingTop: 14 }} className="text-right whitespace-nowrap">
                  Scaled
                </th>
                <th style={{ paddingTop: 14 }} className="no-print w-[150px]">
                  Show in
                </th>
              </tr>
            </thead>
            <tbody>
              {result.ingredients.map((ing) => {
                const toTaste = ing.quantity === null;
                const unconvertible = !toTaste && ing.displayValue === null;

                return (
                  <tr key={ing.id}>
                    <td>
                      <span className="font-medium">{ing.name}</span>
                      {ing.isBase && <span className="chip chip-accent ml-2 align-middle">Base</span>}
                      {ing.note && (
                        <span className="block text-[13px] leading-snug text-muted">{ing.note}</span>
                      )}
                    </td>

                    <td className="text-right tnum whitespace-nowrap text-muted">
                      {toTaste ? "—" : `${formatAmount(ing.quantity, ing.unit)} ${unitLabel(ing.unit)}`}
                    </td>

                    <td className="text-right tnum whitespace-nowrap">
                      {toTaste ? (
                        <span className="text-muted italic">as per taste</span>
                      ) : !showing ? (
                        <span className="text-muted">—</span>
                      ) : unconvertible ? (
                        <span className="text-muted" title="These units cannot be related">
                          n/a
                        </span>
                      ) : (
                        <strong className="text-[15.5px]">
                          {formatAmount(ing.displayValue, ing.displayUnit)}{" "}
                          <span className="font-normal text-ink-2">{unitLabel(ing.displayUnit)}</span>
                        </strong>
                      )}
                    </td>

                    <td className="no-print">
                      {!toTaste && (
                        <UnitSelect
                          value={ing.displayUnit}
                          ariaLabel={`Display unit for ${ing.name}`}
                          className="select text-[13px] py-1.5"
                          onChange={(unit) => setRowUnit(ing.id, unit)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showing && result.unweighable.length > 0 && (
          <p className="mt-3 text-[13px] text-muted">
            Total excludes {result.unweighable.join(", ")} — counted items have no weight.
          </p>
        )}

        {mode === "yield" && showing && originalTotal.grams !== null && (
          <p className="mt-3 text-[13px] text-muted">
            {formatGrams(originalTotal.grams)} as written →{" "}
            {(() => {
              const target = parseAmount(yieldQty);
              const grams = target === null ? null : convert(target, yieldUnit, "g", { ingredient: recipe.name });
              return formatGrams(grams);
            })()}{" "}
            requested.
          </p>
        )}
      </section>
    </div>
  );
}
