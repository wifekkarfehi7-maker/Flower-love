"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteMenuImage, uploadMenuImage, type ImageKind } from "@/lib/storage/images";
import { cn } from "@/lib/utils";

export function ImageUpload({
  value,
  onChange,
  restaurantId,
  kind,
  label,
  aspect = "square",
  className,
  disabled = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  restaurantId: string;
  kind: ImageKind;
  label?: string;
  aspect?: "square" | "wide";
  className?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast({ title: t.auth.notConfiguredTitle, variant: "error" });
      return;
    }

    setUploading(true);
    const previous = value;
    try {
      const { url } = await uploadMenuImage(supabase, { restaurantId, kind, file });
      onChange(url);
      // Replacing an image shouldn't leave the old object behind forever.
      if (previous) void deleteMenuImage(supabase, previous);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const message =
        code === "IMAGE_TOO_LARGE"
          ? t.errors.uploadTooLarge
          : code === "IMAGE_WRONG_TYPE"
            ? t.errors.uploadWrongType
            : t.errors.uploadFailed;
      toast({ title: message, variant: "error" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase && value) void deleteMenuImage(supabase, value);
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <span className="block text-sm font-medium">{label}</span> : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-dashed border-input bg-muted/40",
          aspect === "square" ? "aspect-square w-32" : "aspect-[16/7] w-full"
        )}
      >
        {value ? (
          <Image src={value} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            <span className="text-xs">{t.common.image}</span>
          </button>
        )}

        {uploading && value ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/70">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : null}
      </div>

      {value ? (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled || uploading}>
            {t.common.edit}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={disabled || uploading}>
            <Trash2 aria-hidden />
            {t.common.delete}
          </Button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        disabled={disabled || uploading}
      />
    </div>
  );
}
