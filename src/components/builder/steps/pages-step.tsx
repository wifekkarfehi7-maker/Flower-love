"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { SaveIndicator } from "../save-indicator";
import { upsertPages } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { SaveStatus } from "@/hooks/use-invitation-autosave";
import type { PageConfig, PageType } from "@/types/invitation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: {
    title: "الصفحات",
    description: "فعّل أو عطّل الصفحات، ورتّبها بالسحب حسب الترتيب الذي تريده في دعوتكم.",
    labels: {
      cover: "الغلاف",
      invitation: "نص الدعوة",
      families: "العائلتان",
      countdown: "العد التنازلي",
      event_details: "تفاصيل المناسبة",
      location: "الموقع",
      calendar: "التقويم",
      gallery: "معرض الصور",
      rules: "قواعد الحفلة",
      rsvp: "تأكيد الحضور",
      final_message: "رسالة ختامية",
    } as Record<PageType, string>,
  },
  fr: {
    title: "Pages",
    description: "Activez ou désactivez les pages, et réordonnez-les par glisser-déposer.",
    labels: {
      cover: "Couverture",
      invitation: "Texte d'invitation",
      families: "Les familles",
      countdown: "Compte à rebours",
      event_details: "Détails de la fête",
      location: "Lieu",
      calendar: "Calendrier",
      gallery: "Galerie photo",
      rules: "Règles de la fête",
      rsvp: "RSVP",
      final_message: "Message final",
    } as Record<PageType, string>,
  },
  en: {
    title: "Pages",
    description: "Enable or disable pages, and drag to reorder them in your invitation.",
    labels: {
      cover: "Cover",
      invitation: "Invitation text",
      families: "Families",
      countdown: "Countdown",
      event_details: "Event details",
      location: "Location",
      calendar: "Calendar",
      gallery: "Gallery",
      rules: "Party rules",
      rsvp: "RSVP",
      final_message: "Final message",
    } as Record<PageType, string>,
  },
};

function SortableRow({
  page,
  label,
  onToggle,
}: {
  page: PageConfig;
  label: string;
  onToggle: (pageType: PageType, enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.pageType });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3",
        isDragging && "opacity-60 shadow-lg"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center text-ink-300 active:cursor-grabbing"
        aria-label="drag"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className={cn("flex-1 text-sm font-medium", page.isEnabled ? "text-ink-900" : "text-ink-400")}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={page.isEnabled}
        onClick={() => onToggle(page.pageType, !page.isEnabled)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          page.isEnabled ? "bg-gold-500" : "bg-ink-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            page.isEnabled ? "translate-x-0.5 rtl:-translate-x-0.5" : "translate-x-5 rtl:-translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

export function PagesStep({
  invitationId,
  pages,
  onPagesChange,
}: {
  invitationId: string;
  pages: PageConfig[];
  onPagesChange: (pages: PageConfig[]) => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sorted = [...pages].sort((a, b) => a.sortOrder - b.sortOrder);

  async function persist(next: PageConfig[]) {
    onPagesChange(next);
    setSaveStatus("saving");
    const result = await upsertPages(invitationId, next);
    setSaveStatus(result.error ? "error" : "saved");
  }

  function handleToggle(pageType: PageType, enabled: boolean) {
    persist(pages.map((p) => (p.pageType === pageType ? { ...p, isEnabled: enabled } : p)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((p) => p.pageType === active.id);
    const newIndex = sorted.findIndex((p) => p.pageType === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((p, i) => ({ ...p, sortOrder: i }));
    persist(reordered);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
        <SaveIndicator status={saveStatus} />
      </div>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>

      <div className="mt-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((p) => p.pageType)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {sorted.map((page) => (
                <SortableRow key={page.pageType} page={page} label={t.labels[page.pageType]} onToggle={handleToggle} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
