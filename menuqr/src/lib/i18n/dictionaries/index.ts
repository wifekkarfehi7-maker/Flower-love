import type { Locale } from "../config";
import type { Dictionary } from "../types";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export const dictionaries: Record<Locale, Dictionary> = { ar, fr, en };
