import type { ar } from "./dictionaries/ar";

/** Widens the Arabic dictionary's literal types so fr/en only need the same *shape*. */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : { -readonly [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof ar>;
