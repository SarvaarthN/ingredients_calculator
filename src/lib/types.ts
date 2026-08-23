export interface Ingredient {
  /** Stable id, used to point at the base ingredient. */
  id: string;
  name: string;
  /** `null` means "as per taste" / "as needed" — never scaled. */
  quantity: number | null;
  /** Unit id from `src/lib/units.ts`. Empty string means a bare count. */
  unit: string;
  note?: string;
  /** Marks the ingredient that section 2 scales everything against. */
  isBase?: boolean;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description?: string;
  /** How many people / pieces the quantities below are written for. */
  servings: number;
  /** "people", "servings", "pieces", "buns"… — free text, shown next to the number. */
  servingLabel: string;
  ingredients: Ingredient[];
  /** The adding procedure, one entry per step. */
  steps: string[];
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
}

export type SessionUser = Pick<User, "id" | "email" | "name">;

export type ScaleMode = "servings" | "base" | "yield";
