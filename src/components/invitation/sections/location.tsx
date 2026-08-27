import { MapPin } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { Divider } from "../divider";
import { buttonClass } from "../theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import { resolveLocationUrl } from "@/lib/maps";
import type { InvitationData, TemplateTheme } from "@/types/invitation";
import { cn } from "@/lib/utils";

const TITLES = { ar: "موقع الحفل", fr: "Lieu de la fête", en: "Venue" };
const CTA = { ar: "فتح الموقع 📍", fr: "Ouvrir la carte 📍", en: "Open Location 📍" };

export function LocationSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const event = invitation.events.find((e) => e.locationUrl || e.locationName) ?? invitation.events[0];
  const mapsUrl = event ? resolveLocationUrl(event) : null;
  if (!event || !mapsUrl) return null;

  return (
    <section className="px-6 py-16 text-center">
      <Reveal className="flex flex-col items-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--inv-surface)", color: "var(--inv-primary)" }}
        >
          <MapPin className="h-6 w-6" />
        </span>
        <p
          className="mt-4 text-2xl font-bold sm:text-3xl"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
        >
          {TITLES[locale]}
        </p>
        {event.locationName && (
          <p className="mt-2 text-sm" style={{ color: "var(--inv-text-muted)" }}>
            {event.locationName}
          </p>
        )}
        <Divider theme={theme} />
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonClass(theme.buttonStyle), "mt-4 inline-block")}
          style={{
            backgroundColor: theme.buttonStyle === "outline-ornate" ? "transparent" : "var(--inv-primary)",
            borderColor: "var(--inv-primary)",
            color: theme.buttonStyle === "outline-ornate" ? "var(--inv-primary)" : theme.background,
          }}
        >
          {CTA[locale]}
        </a>
      </Reveal>
    </section>
  );
}
