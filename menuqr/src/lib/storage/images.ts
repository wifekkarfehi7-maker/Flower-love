import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { randomToken } from "@/lib/utils";

export const MENU_IMAGES_BUCKET = "menu-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type ImageKind = "logo" | "cover" | "product" | "category";

export type ImageValidationError = "type" | "size";

export function validateImageFile(file: File): ImageValidationError | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "type";
  if (file.size > MAX_IMAGE_BYTES) return "size";
  return null;
}

const MAX_DIMENSIONS: Record<ImageKind, number> = {
  logo: 512,
  cover: 1600,
  product: 1200,
  category: 900,
};

/**
 * Downscales and re-encodes in the browser before upload. Menus are opened on
 * phones over mobile data, and owners routinely pick 4 MB camera photos — this
 * turns those into ~100 KB WebP without a server round trip. Any failure falls
 * back to uploading the original file untouched.
 */
async function compressImage(file: File, kind: ImageKind): Promise<Blob> {
  if (typeof document === "undefined" || file.type === "image/avif") return file;

  const maxDimension = MAX_DIMENSIONS[kind];
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.82);
  });

  if (!blob || blob.size >= file.size) return file;
  return blob;
}

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadMenuImage(
  supabase: SupabaseClient<Database>,
  options: { restaurantId: string; kind: ImageKind; file: File }
): Promise<UploadResult> {
  const { restaurantId, kind, file } = options;

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError === "size" ? "IMAGE_TOO_LARGE" : "IMAGE_WRONG_TYPE");
  }

  const body = await compressImage(file, kind);
  const extension = body.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${restaurantId}/${kind}/${randomToken(16)}.${extension}`;

  const { error } = await supabase.storage.from(MENU_IMAGES_BUCKET).upload(path, body, {
    cacheControl: "31536000",
    contentType: body.type || file.type,
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(path);

  return { url: publicUrl, path };
}

/** Best-effort cleanup — a stale object is harmless, a broken menu is not. */
export async function deleteMenuImage(supabase: SupabaseClient<Database>, publicUrl: string | null | undefined) {
  if (!publicUrl) return;
  const marker = `/${MENU_IMAGES_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = publicUrl.slice(index + marker.length);
  if (!path) return;
  await supabase.storage.from(MENU_IMAGES_BUCKET).remove([path]);
}
