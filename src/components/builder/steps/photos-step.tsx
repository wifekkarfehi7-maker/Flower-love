"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
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
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { deleteGalleryImage, reorderGalleryImages, uploadGalleryImage } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { GalleryImageRow } from "@/types/database";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: {
    title: "الصور",
    description: "أضيفوا صور دعوتكم، رتّبوها بالسحب، واختاروا صورة الغلاف.",
    add: "إضافة صور",
    uploading: "جاري الرفع...",
    setCover: "تعيين كصورة الغلاف",
    cover: "صورة الغلاف",
    remove: "حذف",
    error: "تعذر رفع الصورة، تحقق من نوع وحجم الملف.",
  },
  fr: {
    title: "Photos",
    description: "Ajoutez vos photos, réordonnez-les par glisser-déposer, et choisissez la photo de couverture.",
    add: "Ajouter des photos",
    uploading: "Envoi...",
    setCover: "Définir comme couverture",
    cover: "Photo de couverture",
    remove: "Supprimer",
    error: "Échec de l'envoi, vérifiez le type et la taille du fichier.",
  },
  en: {
    title: "Photos",
    description: "Add your photos, drag to reorder, and pick a cover photo.",
    add: "Add photos",
    uploading: "Uploading...",
    setCover: "Set as cover photo",
    cover: "Cover photo",
    remove: "Remove",
    error: "Upload failed — check the file type and size.",
  },
};

function SortableThumb({
  image,
  isCover,
  onSetCover,
  onDelete,
  label,
}: {
  image: GalleryImageRow;
  isCover: boolean;
  onSetCover: () => void;
  onDelete: () => void;
  label: typeof STRINGS.ar;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 active:cursor-grabbing",
        isCover ? "border-gold-500" : "border-transparent",
        isDragging && "opacity-60 shadow-lg"
      )}
    >
      <Image src={image.url ?? ""} alt="" fill className="object-cover" sizes="150px" />
      {isCover && (
        <span className="absolute start-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-semibold text-white">
          <Star className="h-2.5 w-2.5" fill="currentColor" />
          {label.cover}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        {!isCover && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onSetCover}
            title={label.setCover}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink-700 hover:bg-white"
          >
            <Star className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          title={label.remove}
          className="ms-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-destructive hover:bg-white"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function PhotosStep({
  invitationId,
  userId,
  gallery,
  onGalleryChange,
  coverImageUrl,
  onSetCover,
}: {
  invitationId: string;
  userId: string;
  gallery: GalleryImageRow[];
  onGalleryChange: (gallery: GalleryImageRow[]) => void;
  coverImageUrl?: string;
  onSetCover: (url: string) => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sorted = [...gallery].sort((a, b) => a.sort_order - b.sort_order);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(false);

    let nextSortOrder = gallery.length;
    const uploaded: GalleryImageRow[] = [];
    for (const file of Array.from(files)) {
      const result = await uploadGalleryImage(invitationId, userId, file, nextSortOrder++);
      if (result.data) uploaded.push(result.data);
      else setError(true);
    }

    if (uploaded.length > 0) onGalleryChange([...gallery, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(image: GalleryImageRow) {
    onGalleryChange(gallery.filter((g) => g.id !== image.id));
    await deleteGalleryImage(image.id, image.storage_path);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((g) => g.id === active.id);
    const newIndex = sorted.findIndex((g) => g.id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((g, i) => ({ ...g, sort_order: i }));
    onGalleryChange(reordered);
    reorderGalleryImages(reordered.map((g) => ({ id: g.id, sortOrder: g.sort_order })));
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>
      {error && <p className="mt-2 text-sm text-destructive">{t.error}</p>}

      <div className="mt-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((g) => g.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {sorted.map((image) => (
                <SortableThumb
                  key={image.id}
                  image={image}
                  isCover={coverImageUrl === image.url}
                  onSetCover={() => onSetCover(image.url ?? "")}
                  onDelete={() => handleDelete(image)}
                  label={t}
                />
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 hover:border-gold-400 hover:text-gold-600"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-[11px] font-medium">{uploading ? t.uploading : t.add}</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
