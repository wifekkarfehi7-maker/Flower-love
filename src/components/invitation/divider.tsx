import { OrnamentFlourish } from "./ornament";
import type { TemplateTheme } from "@/types/invitation";

export function Divider({ theme }: { theme: TemplateTheme }) {
  if (theme.dividerStyle === "none") return null;

  if (theme.dividerStyle === "dots") {
    return (
      <div className="flex items-center justify-center gap-2 py-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--inv-primary)", opacity: i === 1 ? 1 : 0.5 }}
          />
        ))}
      </div>
    );
  }

  if (theme.dividerStyle === "ornament") {
    return (
      <div className="flex justify-center py-2" aria-hidden="true">
        <OrnamentFlourish className="h-5 w-40" style={{ color: "var(--inv-primary)" }} />
      </div>
    );
  }

  return (
    <div className="flex justify-center py-2" aria-hidden="true">
      <span className="h-px w-16" style={{ backgroundColor: "var(--inv-primary)", opacity: 0.4 }} />
    </div>
  );
}
