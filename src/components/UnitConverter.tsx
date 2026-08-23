"use client";

import { useMemo, useState } from "react";
import { UnitSelect } from "./UnitSelect";
import { formatAmount, parseAmount } from "@/lib/format";
import { convert, densityFor, getUnit, unitLabel } from "@/lib/units";

const QUICK: { label: string; from: string; to: string }[] = [
  { label: "tsp → ml", from: "tsp", to: "ml" },
  { label: "tbsp → ml", from: "tbsp", to: "ml" },
  { label: "cup → ml", from: "cup", to: "ml" },
  { label: "oz → g", from: "oz", to: "g" },
  { label: "lb → g", from: "lb", to: "g" },
  { label: "cup → g", from: "cup", to: "g" },
];

export function UnitConverter() {
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("cup");
  const [to, setTo] = useState("g");
  const [ingredient, setIngredient] = useState("");

  const parsed = parseAmount(amount);
  const density = densityFor(ingredient);

  const crossesKinds = useMemo(() => {
    const a = getUnit(from)?.kind;
    const b = getUnit(to)?.kind;
    return a && b && a !== b && a !== "count" && b !== "count";
  }, [from, to]);

  const result = parsed === null ? null : convert(parsed, from, to, { ingredient });

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card card-pad">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_1fr] sm:items-end">
          <div>
            <label className="label" htmlFor="conv-amount">
              Amount
            </label>
            <input
              id="conv-amount"
              className="input tnum"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1 1/2"
            />
          </div>

          <div>
            <label className="label" htmlFor="conv-from">
              From
            </label>
            <UnitSelect id="conv-from" value={from} onChange={setFrom} />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm mb-0.5"
            onClick={swap}
            aria-label="Swap units"
            title="Swap"
          >
            ⇄
          </button>

          <div>
            <label className="label" htmlFor="conv-to">
              To
            </label>
            <UnitSelect id="conv-to" value={to} onChange={setTo} />
          </div>
        </div>

        {crossesKinds && (
          <div className="mt-4">
            <label className="label" htmlFor="conv-ingredient">
              Ingredient{" "}
              <span className="normal-case font-normal tracking-normal">
                (weight ↔ volume needs a density)
              </span>
            </label>
            <input
              id="conv-ingredient"
              className="input"
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              placeholder="flour, sugar, butter, milk…"
              list="density-ingredients"
            />
            <datalist id="density-ingredients">
              {["flour", "sugar", "brown sugar", "icing sugar", "butter", "milk", "water", "oil", "honey", "cocoa", "salt", "rice"].map(
                (name) => (
                  <option key={name} value={name} />
                ),
              )}
            </datalist>
            <p className="mt-2 text-[13px] text-muted">
              {density.matched
                ? `Using ${density.matched} at ${density.value} g/ml.`
                : "No match — assuming water at 1.00 g/ml. Type an ingredient for a better answer."}
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-line pt-6">
          {result === null ? (
            <p className="text-[15px] text-muted">
              {parsed === null
                ? "Enter an amount — decimals and fractions like 1 1/2 both work."
                : `${unitLabel(from) || "counts"} and ${unitLabel(to) || "counts"} cannot be converted into each other.`}
            </p>
          ) : (
            <p className="font-display text-[30px] leading-tight tnum md:text-[38px]">
              {formatAmount(parsed, from)} {unitLabel(from)}{" "}
              <span className="text-muted">=</span>{" "}
              <span className="text-accent">
                {formatAmount(result, to)} {unitLabel(to)}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setFrom(q.from);
              setTo(q.to);
            }}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}
