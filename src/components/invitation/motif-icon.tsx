import { Flower2, Gem, Moon, Sparkle, Sparkles, Square, Sun, Waves, type LucideProps } from "lucide-react";

import type { TemplateTheme } from "@/types/invitation";

const MOTIF_ICONS: Record<TemplateTheme["motif"], typeof Gem> = {
  gem: Gem,
  flower: Flower2,
  moon: Moon,
  square: Square,
  sparkle: Sparkle,
  sparkles: Sparkles,
  wave: Waves,
  sun: Sun,
};

export function MotifIcon({ motif, ...props }: { motif: TemplateTheme["motif"] } & LucideProps) {
  const Icon = MOTIF_ICONS[motif];
  return <Icon {...props} />;
}
