import Link from "next/link";
import type { Metadata } from "next";
import { convert } from "@/lib/units";
import { formatAmount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Common conversions",
  description:
    "Teaspoons, tablespoons and cups in millilitres and grams, metric and imperial weights, oven temperatures, and what a cup of common ingredients weighs.",
};

const SPOONS: [string, string, string, string][] = [
  ["1 tsp", "⅓ tbsp", "4.93 ml", "—"],
  ["1 tbsp", "3 tsp", "14.79 ml", "½ fl oz"],
  ["¼ cup", "4 tbsp", "59.1 ml", "2 fl oz"],
  ["⅓ cup", "5 tbsp + 1 tsp", "78.9 ml", "2.7 fl oz"],
  ["½ cup", "8 tbsp", "118.3 ml", "4 fl oz"],
  ["⅔ cup", "10 tbsp + 2 tsp", "157.7 ml", "5.3 fl oz"],
  ["¾ cup", "12 tbsp", "177.4 ml", "6 fl oz"],
  ["1 cup", "16 tbsp", "236.6 ml", "8 fl oz"],
  ["1 pint", "2 cups", "473.2 ml", "16 fl oz"],
  ["1 quart", "4 cups", "946.4 ml", "32 fl oz"],
  ["1 gallon", "16 cups", "3.785 L", "128 fl oz"],
];

const REGIONAL: [string, string, string, string][] = [
  ["Teaspoon", "4.93 ml", "5 ml", "5 ml"],
  ["Tablespoon", "14.79 ml", "15 ml", "20 ml"],
  ["Cup", "236.6 ml", "250 ml", "250 ml"],
];

const WEIGHTS: [string, string][] = [
  ["1 oz", "28.35 g"],
  ["4 oz", "113.4 g"],
  ["8 oz", "226.8 g"],
  ["1 lb (16 oz)", "453.6 g"],
  ["100 g", "3.53 oz"],
  ["250 g", "8.82 oz"],
  ["500 g", "1 lb 1.6 oz"],
  ["1 kg", "2 lb 3.3 oz"],
];

const OVEN: [string, string, string, string][] = [
  ["¼", "110 °C", "225 °F", "Very cool"],
  ["½", "120 °C", "250 °F", "Very cool"],
  ["1", "140 °C", "275 °F", "Cool"],
  ["2", "150 °C", "300 °F", "Cool"],
  ["3", "160 °C", "325 °F", "Warm"],
  ["4", "180 °C", "350 °F", "Moderate"],
  ["5", "190 °C", "375 °F", "Moderately hot"],
  ["6", "200 °C", "400 °F", "Fairly hot"],
  ["7", "220 °C", "425 °F", "Hot"],
  ["8", "230 °C", "450 °F", "Very hot"],
  ["9", "240 °C", "475 °F", "Very hot"],
];

/** Names resolved against the density table in `src/lib/units.ts`. */
const CUP_WEIGHTS = [
  "all-purpose flour",
  "bread flour",
  "whole wheat flour",
  "semolina",
  "cornstarch",
  "granulated sugar",
  "brown sugar",
  "icing sugar",
  "cocoa powder",
  "butter",
  "oil",
  "milk",
  "water",
  "honey",
  "rice",
  "oats",
  "chocolate chips",
  "salt",
];

const SMALL: [string, string][] = [
  ["1 pinch", "≈ 1/16 tsp ≈ 0.3 ml"],
  ["1 dash", "≈ 1/8 tsp ≈ 0.6 ml"],
  ["1 stick of butter (US)", "8 tbsp = 113 g = 4 oz"],
  ["1 large egg (shelled)", "≈ 50 g — white 30 g, yolk 18 g"],
  ["1 garlic clove", "≈ 3–5 g"],
  ["Juice of 1 lemon", "≈ 45 ml (3 tbsp)"],
];

function Section({
  n,
  title,
  blurb,
  children,
}: {
  n: string;
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 md:py-14">
      <p className="eyebrow mb-3">
        <span className="numeral">№{n}</span>
      </p>
      <h2 className="font-display text-[28px] leading-tight md:text-[34px]">{title}</h2>
      {blurb && <p className="mt-2 max-w-[620px] text-[14.5px] leading-relaxed text-muted">{blurb}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function InfoPage() {
  return (
    <div className="shell max-w-[900px] py-12 md:py-16">
      <p className="eyebrow mb-3">
        <span className="numeral">№</span> Reference
      </p>
      <h1 className="font-display text-[36px] leading-tight md:text-[50px]">Common conversions</h1>
      <p className="mt-3 max-w-[580px] text-[15.5px] leading-relaxed text-ink-2">
        The tables worth keeping on the wall. Spoon and cup measures here are US customary unless
        stated — that is what most recipes written in cups mean.
      </p>

      <hr className="rule mt-10" />

      <Section
        n="01"
        title="Teaspoons, tablespoons, cups"
        blurb="Volume measures, in the order you will need them."
      >
        <div className="card scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingTop: 14 }}>Measure</th>
                <th style={{ paddingTop: 14 }}>Equals</th>
                <th style={{ paddingTop: 14 }}>Metric</th>
                <th style={{ paddingTop: 14 }}>Fluid ounces</th>
              </tr>
            </thead>
            <tbody>
              {SPOONS.map((row) => (
                <tr key={row[0]}>
                  <td className="font-medium whitespace-nowrap">{row[0]}</td>
                  <td className="tnum text-ink-2 whitespace-nowrap">{row[1]}</td>
                  <td className="tnum text-ink-2 whitespace-nowrap">{row[2]}</td>
                  <td className="tnum text-muted whitespace-nowrap">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <hr className="rule" />

      <Section
        n="02"
        title="A cup is not a cup everywhere"
        blurb="If a recipe is Australian, its tablespoon is a third bigger than an American one. Worth checking before you triple a marinade."
      >
        <div className="card scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingTop: 14 }}>Measure</th>
                <th style={{ paddingTop: 14 }}>US customary</th>
                <th style={{ paddingTop: 14 }}>Metric / UK</th>
                <th style={{ paddingTop: 14 }}>Australia</th>
              </tr>
            </thead>
            <tbody>
              {REGIONAL.map((row) => (
                <tr key={row[0]}>
                  <td className="font-medium">{row[0]}</td>
                  <td className="tnum text-ink-2">{row[1]}</td>
                  <td className="tnum text-ink-2">{row[2]}</td>
                  <td className="tnum text-ink-2">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-muted">
          The unit picker throughout the site carries the metric variants separately — look for
          “teaspoon (metric, 5 ml)” and friends.
        </p>
      </Section>

      <hr className="rule" />

      <Section n="03" title="Weights" blurb="Metric and imperial, both directions.">
        <div className="card scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingTop: 14 }}>From</th>
                <th style={{ paddingTop: 14 }}>To</th>
              </tr>
            </thead>
            <tbody>
              {WEIGHTS.map((row) => (
                <tr key={row[0]}>
                  <td className="font-medium tnum">{row[0]}</td>
                  <td className="tnum text-ink-2">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <hr className="rule" />

      <Section
        n="04"
        title="What a cup actually weighs"
        blurb="Volume measures are only as good as how you pack them. These are the densities this site uses when converting between cups and grams — spooned and levelled, not packed, except brown sugar."
      >
        <div className="card scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingTop: 14 }}>Ingredient</th>
                <th style={{ paddingTop: 14 }} className="text-right">
                  1 cup
                </th>
                <th style={{ paddingTop: 14 }} className="text-right">
                  1 tbsp
                </th>
                <th style={{ paddingTop: 14 }} className="text-right">
                  1 tsp
                </th>
              </tr>
            </thead>
            <tbody>
              {CUP_WEIGHTS.map((name) => {
                const cup = convert(1, "cup", "g", { ingredient: name });
                const tbsp = convert(1, "tbsp", "g", { ingredient: name });
                const tsp = convert(1, "tsp", "g", { ingredient: name });
                return (
                  <tr key={name}>
                    <td className="font-medium capitalize">{name}</td>
                    <td className="text-right tnum text-ink-2">{formatAmount(cup, "g")} g</td>
                    <td className="text-right tnum text-ink-2">{formatAmount(tbsp, "g")} g</td>
                    <td className="text-right tnum text-muted">{formatAmount(tsp, "g")} g</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          US butter sticks are wrapped to a weight, not a volume: a stick is labelled “½ cup” but is
          exactly 113 g, so a labelled cup of butter is 227 g rather than the 216 g its density gives.
          Use the wrapper.
        </p>
      </Section>

      <hr className="rule" />

      <Section
        n="05"
        title="Oven temperatures"
        blurb="Gas marks, Celsius and Fahrenheit. Fan ovens run hot — drop 20 °C from any conventional temperature."
      >
        <div className="card scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingTop: 14 }}>Gas mark</th>
                <th style={{ paddingTop: 14 }}>Conventional</th>
                <th style={{ paddingTop: 14 }}>Fahrenheit</th>
                <th style={{ paddingTop: 14 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {OVEN.map((row) => (
                <tr key={row[2]}>
                  <td className="font-medium tnum">{row[0]}</td>
                  <td className="tnum text-ink-2">{row[1]}</td>
                  <td className="tnum text-ink-2">{row[2]}</td>
                  <td className="text-muted">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-muted">
          °C = (°F − 32) × 5⁄9 &nbsp;·&nbsp; °F = °C × 9⁄5 + 32
        </p>
      </Section>

      <hr className="rule" />

      <Section n="06" title="Odds and ends" blurb="The measures recipes use without defining.">
        <div className="card scroll-x">
          <table className="table">
            <tbody>
              {SMALL.map((row) => (
                <tr key={row[0]}>
                  <td className="font-medium">{row[0]}</td>
                  <td className="text-ink-2">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <hr className="rule" />

      <Section
        n="07"
        title="Baker's percentages"
        blurb="Why the base ingredient matters."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card card-pad">
            <p className="text-[14.5px] leading-[1.7] text-ink-2">
              In bread and pastry, every ingredient is written as a percentage of the flour, and flour
              is always 100%. A dough at 65% hydration, 2% salt and 1% yeast means that for 1000 g of
              flour you use 650 g water, 20 g salt and 10 g yeast.
            </p>
            <p className="mt-3 text-[14.5px] leading-[1.7] text-ink-2">
              It makes recipes portable between batch sizes — which is exactly what marking a{" "}
              <strong className="text-ink">base ingredient</strong> does here.
            </p>
          </div>
          <div className="card card-pad">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
              Typical bread dough
            </p>
            <table className="table mt-3">
              <tbody>
                {[
                  ["Flour", "100%"],
                  ["Water", "60–70%"],
                  ["Salt", "1.5–2%"],
                  ["Fresh yeast", "1–1.5%"],
                  ["Sugar", "0–8%"],
                  ["Butter", "0–10%"],
                ].map(([a, b]) => (
                  <tr key={a}>
                    <td className="font-medium">{a}</td>
                    <td className="text-right tnum text-ink-2">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <div className="card card-pad mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-ink-2">Need a one-off number rather than a table?</p>
        <Link href="/convert" className="btn btn-accent">
          Open the converter
        </Link>
      </div>
    </div>
  );
}
