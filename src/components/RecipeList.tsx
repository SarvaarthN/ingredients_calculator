"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DeleteRecipeButton } from "./DeleteRecipeButton";

export interface RecipeSummary {
  id: string;
  name: string;
  description?: string;
  servings: number;
  servingLabel: string;
  ingredientCount: number;
  /** Already formatted, e.g. "1.2 kg"; null when the recipe cannot be weighed. */
  totalWeight: string | null;
  baseName?: string;
  /** Lower-cased ingredient names, for search. */
  ingredientNames: string[];
  createdAt: number;
  updatedAt: number;
}

type SortKey = "newest" | "oldest" | "az" | "za" | "edited";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Date added: newest first" },
  { value: "oldest", label: "Date added: oldest first" },
  { value: "az", label: "Name: A to Z" },
  { value: "za", label: "Name: Z to A" },
  { value: "edited", label: "Recently edited" },
];

const STORAGE_KEY = "recipes.sort";
const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

function compare(sort: SortKey) {
  return (a: RecipeSummary, b: RecipeSummary) => {
    switch (sort) {
      case "newest":
        return b.createdAt - a.createdAt;
      case "oldest":
        return a.createdAt - b.createdAt;
      case "az":
        return collator.compare(a.name, b.name);
      case "za":
        return collator.compare(b.name, a.name);
      case "edited":
        return b.updatedAt - a.updatedAt;
    }
  };
}

export function RecipeList({ recipes }: { recipes: RecipeSummary[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  // Remember the chosen order for this browser.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SortKey | null;
      if (saved && SORTS.some((s) => s.value === saved)) setSort(saved);
    } catch {
      // Storage unavailable; keep the default.
    }
  }, []);

  function changeSort(value: SortKey) {
    setSort(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore.
    }
  }

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = words.length
      ? recipes.filter((r) => {
          const haystack = [r.name, r.description ?? "", ...r.ingredientNames].join(" ").toLowerCase();
          return words.every((w) => haystack.includes(w));
        })
      : recipes;
    return [...matches].sort(compare(sort));
  }, [recipes, query, sort]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="recipe-search">
            Search
          </label>
          <input
            id="recipe-search"
            type="search"
            className="input"
            placeholder="Recipe name or ingredient, e.g. chocolate, paneer"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="sm:w-[250px]">
          <label className="label" htmlFor="recipe-sort">
            Sort by
          </label>
          <select
            id="recipe-sort"
            className="select w-full"
            value={sort}
            onChange={(e) => changeSort(e.target.value as SortKey)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.trim() && (
        <p className="mb-4 text-[13.5px] text-muted" aria-live="polite">
          {shown.length === 0
            ? `No recipes match “${query.trim()}”.`
            : `${shown.length} of ${recipes.length} recipe${recipes.length === 1 ? "" : "s"} match.`}
          {shown.length === 0 && (
            <>
              {" "}
              <button type="button" className="link" onClick={() => setQuery("")}>
                Clear search
              </button>
            </>
          )}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((recipe) => (
          <li key={recipe.id} className="card card-link flex flex-col">
            <Link href={`/recipes/${recipe.id}`} className="card-pad flex-1">
              <h2 className="font-display text-[24px] leading-tight">{recipe.name}</h2>
              {recipe.description && (
                <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">
                  {recipe.description}
                </p>
              )}

              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
                <div className="flex gap-1.5">
                  <dt className="sr-only">Written for</dt>
                  <dd className="tnum">
                    {recipe.servings} {recipe.servingLabel}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="sr-only">Ingredients</dt>
                  <dd className="tnum">
                    {recipe.ingredientCount} ingredient{recipe.ingredientCount === 1 ? "" : "s"}
                  </dd>
                </div>
                {recipe.totalWeight !== null && (
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Total weight</dt>
                    <dd className="tnum">{recipe.totalWeight} total</dd>
                  </div>
                )}
              </dl>

              {recipe.baseName && (
                <p className="mt-4">
                  <span className="chip chip-accent">Base · {recipe.baseName}</span>
                </p>
              )}
            </Link>

            <div className="flex items-center gap-2 border-t border-line px-5 py-3">
              <Link href={`/recipes/${recipe.id}`} className="btn btn-ghost btn-sm">
                Scale
              </Link>
              <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-ghost btn-sm">
                Edit
              </Link>
              <span className="flex-1" />
              <DeleteRecipeButton id={recipe.id} name={recipe.name} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
