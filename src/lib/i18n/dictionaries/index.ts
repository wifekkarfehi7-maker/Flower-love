import type { Locale } from "../config";
import type { Dictionary } from "../types";
import ar from "./ar";
import fr from "./fr";
import en from "./en";

export const dictionaries: Record<Locale, Dictionary> = { ar, fr, en };
