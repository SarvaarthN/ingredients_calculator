import Link from "next/link";
import type { Metadata } from "next";
import { UnitConverter } from "@/components/UnitConverter";

export const metadata: Metadata = {
  title: "Unit converter",
  description: "Convert between grams, ounces, millilitres, teaspoons, tablespoons and cups.",
};

export default function ConvertPage() {
  return (
    <div className="shell max-w-[820px] py-12 md:py-16">
      <p className="eyebrow mb-3">
        <span className="numeral">№</span> Converter
      </p>
      <h1 className="font-display text-[36px] leading-tight md:text-[46px]">Unit converter</h1>
      <p className="mt-3 mb-10 max-w-[560px] text-[15.5px] leading-relaxed text-ink-2">
        Weights, volumes and spoon measures. Going between weight and volume needs a density, so name
        the ingredient and a sensible one gets used.
      </p>

      <UnitConverter />

      <p className="mt-8 text-[14px] text-muted">
        Looking for the standing tables instead?{" "}
        <Link href="/info" className="link">
          Common conversions
        </Link>
        .
      </p>
    </div>
  );
}
