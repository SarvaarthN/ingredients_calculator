import { strict as assert } from "node:assert";
import { test, describe } from "node:test";
import { convert, densityFor, normalizeUnit, toGrams, unitKind } from "../src/lib/units";

const close = (actual: number | null, expected: number, tolerance = 0.01) => {
  assert.notEqual(actual, null, "expected a number, got null");
  assert.ok(
    Math.abs((actual as number) - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

describe("convert — within a kind", () => {
  test("weights", () => {
    close(convert(1, "kg", "g"), 1000);
    close(convert(1, "oz", "g"), 28.35);
    close(convert(1, "lb", "g"), 453.59);
    close(convert(500, "g", "lb"), 1.1023, 0.001);
  });

  test("volumes", () => {
    close(convert(1, "tbsp", "tsp"), 3, 0.0001);
    close(convert(1, "cup", "tbsp"), 16, 0.0001);
    close(convert(1, "cup", "ml"), 236.588);
    close(convert(1, "l", "cup"), 4.2268, 0.001);
    close(convert(1, "tsp", "ml"), 4.9289);
  });

  test("metric spoon variants are distinct from US ones", () => {
    close(convert(1, "tsp_m", "ml"), 5, 0);
    close(convert(1, "tbsp_m", "ml"), 15, 0);
    close(convert(1, "cup_m", "ml"), 250, 0);
  });

  test("identity", () => {
    close(convert(7.5, "g", "g"), 7.5, 0);
  });
});

describe("convert — across weight and volume", () => {
  test("water is 1 g per ml", () => {
    close(convert(1, "cup", "g", { ingredient: "water" }), 236.59, 0.1);
  });

  test("flour is lighter than water", () => {
    close(convert(1, "cup", "g", { ingredient: "all-purpose flour" }), 125.4, 0.5);
    close(convert(1, "cup", "g", { ingredient: "maida" }), 125.4, 0.5);
  });

  test("granulated sugar", () => {
    close(convert(1, "cup", "g", { ingredient: "granulated sugar" }), 199.9, 0.5);
  });

  test("round-trips", () => {
    const grams = convert(2, "cup", "g", { ingredient: "flour" });
    close(convert(grams as number, "g", "cup", { ingredient: "flour" }), 2, 0.0001);
  });

  test("an explicit density overrides the table", () => {
    close(convert(100, "ml", "g", { ingredient: "flour", density: 2 }), 200, 0);
  });

  test("longest density key wins over a shorter substring", () => {
    assert.equal(densityFor("dark brown sugar").matched, "brown sugar");
    assert.equal(densityFor("caster sugar").matched, "caster sugar");
    assert.equal(densityFor("cocoa powder").matched, "cocoa powder");
  });

  test("an unknown ingredient falls back to water", () => {
    const { value, matched } = densityFor("dragon fruit");
    assert.equal(matched, null);
    assert.equal(value, 1);
  });
});

describe("convert — impossible pairs", () => {
  test("counts cannot become weights", () => {
    assert.equal(convert(3, "clove", "g"), null);
    assert.equal(convert(3, "g", "clove"), null);
    assert.equal(convert(3, "piece", "pinch"), null);
  });

  test("unknown units give null", () => {
    assert.equal(convert(1, "furlong", "g"), null);
  });

  test("non-finite input gives null", () => {
    assert.equal(convert(Number.NaN, "g", "kg"), null);
  });
});

describe("normalizeUnit", () => {
  test("resolves the spellings the spreadsheet uses", () => {
    assert.equal(normalizeUnit("gms"), "g");
    assert.equal(normalizeUnit("Grams"), "g");
    assert.equal(normalizeUnit("ML"), "ml");
    assert.equal(normalizeUnit("Tablespoons"), "tbsp");
    assert.equal(normalizeUnit("tbs"), "tbsp");
    assert.equal(normalizeUnit("cups"), "cup");
    assert.equal(normalizeUnit("lbs"), "lb");
  });

  test("blank and unknown collapse to the count unit", () => {
    assert.equal(normalizeUnit(""), "");
    assert.equal(normalizeUnit(undefined), "");
    assert.equal(normalizeUnit("bananas"), "");
  });

  test("unitKind", () => {
    assert.equal(unitKind("g"), "mass");
    assert.equal(unitKind("cup"), "volume");
    assert.equal(unitKind(""), "count");
  });
});

describe("toGrams", () => {
  test("weighs volumes using the ingredient", () => {
    close(toGrams(2, "cup", "flour"), 250.8, 1);
    close(toGrams(1, "tbsp", "olive oil"), 13.57, 0.1);
  });

  test("returns null for counted things", () => {
    assert.equal(toGrams(2, "clove", "garlic clove"), null);
  });
});
