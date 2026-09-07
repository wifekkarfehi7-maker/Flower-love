"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface DragHandleProps {
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: Record<string, unknown> | undefined;
  isDragging: boolean;
}

function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: (handle: DragHandleProps) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 opacity-90 shadow-pop")}
    >
      {children({ attributes, listeners, isDragging })}
    </div>
  );
}

/**
 * Touch sensors need a short press delay so a drag never hijacks a tap or a
 * scroll on a phone — owners reorder their menu from the counter, on mobile.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  disabled = false,
  className,
  children,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  disabled?: boolean;
  className?: string;
  children: (item: T, handle: DragHandleProps) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id} disabled={disabled}>
              {(handle) => children(item, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function DragHandle({ handle, label }: { handle: DragHandleProps; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="cursor-grab touch-none rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      {...handle.attributes}
      {...handle.listeners}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
}
