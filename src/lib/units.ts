export type UnitKind = "mass" | "volume" | "count";

export interface UnitDef {
  id: string;
  /** Short form shown next to a number. */
  label: string;
  /** Long form used in the picker. */
  name: string;
  kind: UnitKind;
  /** Grams for mass, millilitres for volume, 1 for count. */
  factor: number;
  aliases: string[];
}

/**
 * Spoon and cup sizes are US customary (tsp 4.929 ml, tbsp 14.787 ml, cup 236.6 ml),
 * which is what recipe conversion tools assume. The metric variants (5 / 15 / 250 ml)
 * are listed on the Info page and available as their own units below.
 */
export const UNITS: UnitDef[] = [
  // ── mass ──────────────────────────────────────────────────────────────────
  { id: "g", label: "g", name: "gram", kind: "mass", factor: 1, aliases: ["gm", "gms", "gram", "grams", "gr"] },
  { id: "kg", label: "kg", name: "kilogram", kind: "mass", factor: 1000, aliases: ["kilo", "kilos", "kilogram", "kilograms"] },
  { id: "mg", label: "mg", name: "milligram", kind: "mass", factor: 0.001, aliases: ["milligram", "milligrams"] },
  { id: "oz", label: "oz", name: "ounce", kind: "mass", factor: 28.349523125, aliases: ["ounce", "ounces"] },
  { id: "lb", label: "lb", name: "pound", kind: "mass", factor: 453.59237, aliases: ["lbs", "pound", "pounds", "#"] },

  // ── volume ────────────────────────────────────────────────────────────────
  { id: "ml", label: "ml", name: "millilitre", kind: "volume", factor: 1, aliases: ["milliliter", "millilitre", "milliliters", "cc"] },
  { id: "l", label: "L", name: "litre", kind: "volume", factor: 1000, aliases: ["lt", "ltr", "liter", "litre", "liters", "litres"] },
  { id: "tsp", label: "tsp", name: "teaspoon (US)", kind: "volume", factor: 4.92892159375, aliases: ["t", "teaspoon", "teaspoons", "tsps"] },
  { id: "tbsp", label: "tbsp", name: "tablespoon (US)", kind: "volume", factor: 14.78676478125, aliases: ["tbs", "tbl", "tablespoon", "tablespoons"] },
  { id: "cup", label: "cup", name: "cup (US)", kind: "volume", factor: 236.5882365, aliases: ["cups", "c"] },
  { id: "floz", label: "fl oz", name: "fluid ounce (US)", kind: "volume", factor: 29.5735295625, aliases: ["fluid ounce", "fluid ounces", "fl. oz."] },
  { id: "pt", label: "pt", name: "pint (US)", kind: "volume", factor: 473.176473, aliases: ["pint", "pints"] },
  { id: "qt", label: "qt", name: "quart (US)", kind: "volume", factor: 946.352946, aliases: ["quart", "quarts"] },
  { id: "gal", label: "gal", name: "gallon (US)", kind: "volume", factor: 3785.411784, aliases: ["gallon", "gallons"] },
  { id: "tsp_m", label: "tsp (m)", name: "teaspoon (metric, 5 ml)", kind: "volume", factor: 5, aliases: [] },
  { id: "tbsp_m", label: "tbsp (m)", name: "tablespoon (metric, 15 ml)", kind: "volume", factor: 15, aliases: [] },
  { id: "cup_m", label: "cup (m)", name: "cup (metric, 250 ml)", kind: "volume", factor: 250, aliases: [] },

  // ── count ─────────────────────────────────────────────────────────────────
  { id: "", label: "", name: "(no unit / count)", kind: "count", factor: 1, aliases: ["count", "nos", "no", "qty"] },
  { id: "piece", label: "pc", name: "piece", kind: "count", factor: 1, aliases: ["pieces", "pc", "pcs", "each"] },
  { id: "pinch", label: "pinch", name: "pinch", kind: "count", factor: 1, aliases: ["pinches"] },
  { id: "dash", label: "dash", name: "dash", kind: "count", factor: 1, aliases: ["dashes"] },
  { id: "clove", label: "clove", name: "clove", kind: "count", factor: 1, aliases: ["cloves"] },
  { id: "sprig", label: "sprig", name: "sprig", kind: "count", factor: 1, aliases: ["sprigs"] },
  { id: "leaf", label: "leaf", name: "leaf", kind: "count", factor: 1, aliases: ["leaves"] },
  { id: "stalk", label: "stalk", name: "stalk", kind: "count", factor: 1, aliases: ["stalks"] },
];

const UNIT_BY_ID = new Map(UNITS.map((u) => [u.id, u]));

const UNIT_BY_ALIAS = (() => {
  const m = new Map<string, UnitDef>();
  for (const u of UNITS) {
    m.set(u.id.toLowerCase(), u);
    m.set(u.label.toLowerCase(), u);
    m.set(u.name.toLowerCase(), u);
    for (const a of u.aliases) m.set(a.toLowerCase(), u);
  }
  return m;
})();

export function getUnit(id: string | undefined | null): UnitDef | undefined {
  return UNIT_BY_ID.get(id ?? "");
}

/** Resolve free text ("gms", "Tablespoons", "ML") to a unit id. Returns "" if unknown. */
export function normalizeUnit(raw: string | undefined | null): string {
  if (!raw) return "";
  const key = String(raw).trim().toLowerCase().replace(/\.$/, "");
  if (!key) return "";
  return UNIT_BY_ALIAS.get(key)?.id ?? "";
}

export function unitLabel(id: string | undefined | null): string {
  return getUnit(id)?.label ?? (id ?? "");
}

export function unitKind(id: string | undefined | null): UnitKind {
  return getUnit(id)?.kind ?? "count";
}

/**
 * Approximate densities in g/ml, used only when a conversion has to cross
 * between volume and mass. Matched on the longest substring of the name.
 */
export const DENSITIES: Record<string, number> = {
  water: 1.0,
  milk: 1.03,
  "whole milk": 1.03,
  buttermilk: 1.03,
  cream: 0.994,
  "heavy cream": 0.994,
  "cream cheese": 0.98,
  yogurt: 1.03,
  curd: 1.03,
  egg: 1.03,
  eggs: 1.03,
  "egg white": 1.03,
  "egg yolk": 1.03,
  honey: 1.42,
  "maple syrup": 1.32,
  molasses: 1.4,
  oil: 0.918,
  "olive oil": 0.918,
  ghee: 0.91,
  butter: 0.911,
  flour: 0.53,
  maida: 0.53,
  "all-purpose flour": 0.53,
  "bread flour": 0.55,
  "whole wheat flour": 0.56,
  atta: 0.56,
  semolina: 0.68,
  rava: 0.68,
  cornstarch: 0.54,
  cornflour: 0.54,
  cocoa: 0.42,
  "cocoa powder": 0.42,
  "baking powder": 0.9,
  "baking soda": 0.92,
  sugar: 0.845,
  "granulated sugar": 0.845,
  "caster sugar": 0.85,
  "castor sugar": 0.85,
  "fine sugar": 0.85,
  "brown sugar": 0.93,
  "icing sugar": 0.53,
  "powdered sugar": 0.53,
  salt: 1.217,
  yeast: 0.65,
  rice: 0.85,
  oats: 0.4,
  chocolate: 0.7,
  "chocolate chips": 0.68,
  nuts: 0.55,
  walnuts: 0.5,
  almonds: 0.6,
  cashews: 0.6,
};

const DENSITY_KEYS = Object.keys(DENSITIES).sort((a, b) => b.length - a.length);

/** Best-effort density for an ingredient name, in g/ml. Falls back to water. */
export function densityFor(name: string | undefined): { value: number; matched: string | null } {
  const n = (name ?? "").toLowerCase();
  for (const key of DENSITY_KEYS) {
    if (n.includes(key)) return { value: DENSITIES[key], matched: key };
  }
  return { value: 1, matched: null };
}

export interface ConvertOptions {
  /** Ingredient name, used to pick a density when crossing volume ↔ mass. */
  ingredient?: string;
  /** Explicit density in g/ml, overrides the lookup table. */
  density?: number;
}

/**
 * Convert `qty` from one unit to another.
 * Returns `null` when the two units cannot be related (e.g. grams → cloves).
 */
export function convert(
  qty: number,
  fromId: string,
  toId: string,
  opts: ConvertOptions = {},
): number | null {
  if (!Number.isFinite(qty)) return null;
  const from = getUnit(fromId);
  const to = getUnit(toId);
  if (!from || !to) return null;
  if (from.id === to.id) return qty;

  if (from.kind === to.kind) {
    if (from.kind === "count") return from.id === to.id ? qty : null;
    return (qty * from.factor) / to.factor;
  }

  // Crossing volume ↔ mass needs a density.
  const density = opts.density ?? densityFor(opts.ingredient).value;
  if (from.kind === "volume" && to.kind === "mass") {
    return (qty * from.factor * density) / to.factor;
  }
  if (from.kind === "mass" && to.kind === "volume") {
    return (qty * from.factor) / density / to.factor;
  }
  // Counts cannot be related to anything else.
  return null;
}

/** Convert to grams, using density if the unit is a volume. `null` if not possible. */
export function toGrams(qty: number, unitId: string, ingredient?: string): number | null {
  return convert(qty, unitId, "g", { ingredient });
}

export const UNIT_GROUPS: { kind: UnitKind; title: string; units: UnitDef[] }[] = [
  { kind: "mass", title: "Weight", units: UNITS.filter((u) => u.kind === "mass") },
  { kind: "volume", title: "Volume", units: UNITS.filter((u) => u.kind === "volume") },
  { kind: "count", title: "Count", units: UNITS.filter((u) => u.kind === "count") },
];
