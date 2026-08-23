import { strict as assert } from "node:assert";
import { test, describe } from "node:test";
import { formatAmount, formatFactor, formatGrams, parseAmount, quantityToInput } from "../src/lib/format";

describe("parseAmount", () => {
  test("plain numbers", () => {
    assert.equal(parseAmount("250"), 250);
    assert.equal(parseAmount(" 1.5 "), 1.5);
    assert.equal(parseAmount("0"), 0);
  });

  test("commas as decimal separators (the spreadsheet uses them)", () => {
    assert.equal(parseAmount("1,5"), 1.5);
  });

  test("fractions", () => {
    assert.equal(parseAmount("1/2"), 0.5);
    assert.equal(parseAmount("3/4"), 0.75);
    assert.equal(parseAmount("1 1/2"), 1.5);
    assert.equal(parseAmount("2 3/4"), 2.75);
  });

  test("vulgar fraction characters", () => {
    assert.equal(parseAmount("½"), 0.5);
    assert.equal(parseAmount("1½"), 1.5);
    assert.equal(parseAmount("¾"), 0.75);
    assert.equal(parseAmount("⅓"), 1 / 3);
  });

  test("blank and rubbish become null — read as 'as per taste'", () => {
    assert.equal(parseAmount(""), null);
    assert.equal(parseAmount("   "), null);
    assert.equal(parseAmount("a pinch"), null);
    assert.equal(parseAmount("1/0"), null);
  });
});

describe("formatAmount", () => {
  test("weights round to something a scale can show", () => {
    assert.equal(formatAmount(1234.56, "g"), "1235");
    assert.equal(formatAmount(48.32, "g"), "48.3");
    assert.equal(formatAmount(3.125, "g"), "3.1");
    assert.equal(formatAmount(0.456, "g"), "0.46");
  });

  test("spoons and cups come back as fractions", () => {
    assert.equal(formatAmount(0.5, "tsp"), "1/2");
    assert.equal(formatAmount(0.25, "cup"), "1/4");
    assert.equal(formatAmount(1.5, "tbsp"), "1 1/2");
    assert.equal(formatAmount(1 / 3, "cup"), "1/3");
    assert.equal(formatAmount(2, "cup"), "2");
  });

  test("an amount with no near fraction stays decimal", () => {
    assert.equal(formatAmount(0.47, "cup"), "0.47");
  });

  test("edge values", () => {
    assert.equal(formatAmount(null, "g"), "—");
    assert.equal(formatAmount(0, "g"), "0");
    assert.equal(formatAmount(Number.NaN, "g"), "—");
  });

  test("trailing zeros are trimmed", () => {
    assert.equal(formatAmount(20.0, "g"), "20");
    assert.equal(formatAmount(3.1, "g"), "3.1");
  });
});

describe("formatGrams", () => {
  test("switches to kilograms past a thousand", () => {
    assert.equal(formatGrams(1234), "1.23 kg");
    assert.equal(formatGrams(999), "999 g");
    assert.equal(formatGrams(4.5), "4.5 g");
    assert.equal(formatGrams(null), "—");
  });
});

describe("formatFactor", () => {
  test("whole numbers stay whole", () => {
    assert.equal(formatFactor(2), "2");
    assert.equal(formatFactor(0.5), "0.5");
    assert.equal(formatFactor(0.6667), "0.67");
    assert.equal(formatFactor(12.34), "12.3");
  });
});

describe("quantityToInput", () => {
  test("round-trips through parseAmount", () => {
    for (const value of [250, 3.125, 0.5, 1710.6667]) {
      assert.equal(parseAmount(quantityToInput(value)), Math.round(value * 10000) / 10000);
    }
  });

  test("null becomes an empty box", () => {
    assert.equal(quantityToInput(null), "");
  });
});
