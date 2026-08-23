import { getUnit, unitLabel } from "./units";

const DENOMINATORS = [2, 3, 4, 8, 16];

/** Nearest cook-friendly fraction, e.g. 0.333 → "1/3". `null` if nothing is close. */
function asFraction(value: number): string | null {
  if (value <= 0) return null;
  const whole = Math.floor(value);
  const rest = value - whole;

  if (rest < 0.02) return whole > 0 ? String(whole) : null;

  for (const d of DENOMINATORS) {
    const n = Math.round(rest * d);
    if (n === 0 || n === d) continue;
    if (Math.abs(rest - n / d) < 0.021) {
      const g = gcd(n, d);
      const frac = `${n / g}/${d / g}`;
      return whole > 0 ? `${whole} ${frac}` : frac;
    }
  }
  return null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Trim trailing zeros: 3.10 → "3.1", 20.00 → "20". */
function trim(value: number, decimals: number): string {
  return String(roundTo(value, decimals));
}

/**
 * Format a scaled amount the way a cook wants to read it: decimals for weights,
 * fractions for spoons and cups.
 */
export function formatAmount(value: number | null, unitId: string): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value === 0) return "0";

  const unit = getUnit(unitId);
  const kind = unit?.kind ?? "count";
  const spoonish = ["tsp", "tbsp", "cup", "tsp_m", "tbsp_m", "cup_m"].includes(unitId);

  if (spoonish || kind === "count") {
    const frac = asFraction(value);
    if (frac) return frac;
    return trim(value, value < 1 ? 2 : 1);
  }

  const abs = Math.abs(value);
  if (abs >= 100) return trim(value, 0);
  if (abs >= 10) return trim(value, 1);
  if (abs >= 1) return trim(value, 1);
  if (abs >= 0.1) return trim(value, 2);
  return trim(value, 3);
}

export function formatWithUnit(value: number | null, unitId: string): string {
  const amount = formatAmount(value, unitId);
  const label = unitLabel(unitId);
  return label ? `${amount} ${label}` : amount;
}

/** 2 → "2", 2.5 → "2.5", 0.6667 → "0.67". Used for the scale-factor badge. */
export function formatFactor(factor: number): string {
  if (!Number.isFinite(factor)) return "—";
  if (Math.abs(factor - Math.round(factor)) < 0.001) return String(Math.round(factor));
  if (Math.abs(factor) >= 10) return trim(factor, 1);
  return trim(factor, 2);
}

/**
 * Parse what a cook types into a number: "250", "1.5", "1/2", "1 1/2", "2½".
 * Returns `null` for blank or unparseable input — which the app reads as "as per taste".
 */
export function parseAmount(raw: string): number | null {
  const text = raw
    .trim()
    .replace(/½/g, " 1/2")
    .replace(/⅓/g, " 1/3")
    .replace(/⅔/g, " 2/3")
    .replace(/¼/g, " 1/4")
    .replace(/¾/g, " 3/4")
    .replace(/⅛/g, " 1/8")
    .replace(/,/g, ".")
    .trim();
  if (!text) return null;

  const mixed = text.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (mixed) {
    const denom = Number(mixed[3]);
    if (denom === 0) return null;
    return Number(mixed[1]) + Number(mixed[2]) / denom;
  }

  const fraction = text.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denom = Number(fraction[2]);
    if (denom === 0) return null;
    return Number(fraction[1]) / denom;
  }

  const plain = Number(text);
  return Number.isFinite(plain) ? plain : null;
}

/** Turn a stored quantity back into something editable in a text input. */
export function quantityToInput(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return String(roundTo(value, 4));
}

/** 1234 g → "1.23 kg", 850 g → "850 g". Used for total-weight readouts. */
export function formatGrams(grams: number | null): string {
  if (grams === null || !Number.isFinite(grams)) return "—";
  if (grams >= 1000) return `${trim(grams / 1000, 2)} kg`;
  if (grams >= 10) return `${trim(grams, 0)} g`;
  return `${trim(grams, 1)} g`;
}
