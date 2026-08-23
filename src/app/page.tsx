import Link from "next/link";
import { getSessionUser } from "@/lib/session";

const MODES = [
  {
    n: "01",
    title: "By how many people",
    body: "Cooked for four, feeding eleven? Type the new headcount and every quantity moves with it.",
  },
  {
    n: "02",
    title: "By your base ingredient",
    body: "You have 380 g of flour and nothing else. Anchor the recipe to it and the rest falls into place.",
  },
  {
    n: "03",
    title: "By finished output",
    body: "Need exactly 1.2 kg of batter, or a 900 g loaf? Work backwards from the amount you want out.",
  },
];

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <>
      {/* Hero */}
      <section className="shell pt-16 pb-14 md:pt-28 md:pb-20">
        <div className="max-w-[760px]">
          <p className="eyebrow mb-5">
            <span className="numeral">№</span> Recipe scaling, done properly
          </p>
          <h1 className="font-display text-[42px] leading-[1.06] sm:text-[58px] md:text-[68px]">
            The cooking math
            <br />
            no one teaches you,{" "}
            <span className="italic text-accent">handled</span>.
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.65] text-ink-2">
            Save a recipe once — ingredients, quantities and method. Then scale it three different
            ways, convert between grams, cups and spoons, and cook without doing arithmetic over the
            hob.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <Link href="/recipes" className="btn btn-accent">
                  Open your recipes
                </Link>
                <Link href="/recipes/new" className="btn btn-outline">
                  Add a recipe
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="btn btn-accent">
                  Start free
                </Link>
                <Link href="/login" className="btn btn-outline">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* Three scaling modes */}
      <section className="shell py-14 md:py-20">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">
              <span className="numeral">№</span> Three ways to scale
            </p>
            <h2 className="font-display text-[30px] leading-tight md:text-[38px]">
              Pick the number you actually know
            </h2>
          </div>
          <p className="max-w-[340px] text-[14.5px] leading-relaxed text-muted">
            Every recipe page carries all three. Switch between them without losing your place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {MODES.map((m) => (
            <article key={m.n} className="card card-pad">
              <span className="numeral">№{m.n}</span>
              <h3 className="font-display mt-3 text-[24px] leading-tight">{m.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{m.body}</p>
            </article>
          ))}
        </div>
      </section>

      <hr className="rule" />

      {/* Two halves of a recipe */}
      <section className="shell py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p className="eyebrow mb-3">
              <span className="numeral">№04</span> Ingredients
            </p>
            <h2 className="font-display text-[28px] leading-tight md:text-[34px]">
              A quantity list that does the work
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              Name, amount, unit and a note per line. Mark one line as the base ingredient and the
              whole recipe can be re-anchored to it. &ldquo;As per taste&rdquo; entries stay put
              instead of being scaled into nonsense.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              Any row can be flipped to another unit on the spot — grams to cups, millilitres to
              tablespoons — using sensible densities for flour, sugar, butter and the rest.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-3">
              <span className="numeral">№05</span> Method
            </p>
            <h2 className="font-display text-[28px] leading-tight md:text-[34px]">
              The adding procedure, step by step
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              The order things go in matters as much as how much of them. Write the method as
              numbered steps alongside the ingredients, and read them side by side while you cook.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              Everything is editable later — add a recipe, modify it, or delete it, all from your own
              private book.
            </p>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* Conversions */}
      <section className="shell py-14 md:py-20">
        <div className="card card-pad flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[520px]">
            <p className="eyebrow mb-3">
              <span className="numeral">№06</span> Reference
            </p>
            <h2 className="font-display text-[28px] leading-tight md:text-[34px]">
              Teaspoons, tablespoons, cups and grams
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              A standing conversion table for spoon and cup measures, metric and imperial weights,
              oven temperatures, and what a cup of common ingredients actually weighs.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/info" className="btn btn-primary">
              Conversion tables
            </Link>
            <Link href="/convert" className="btn btn-outline">
              Unit converter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
