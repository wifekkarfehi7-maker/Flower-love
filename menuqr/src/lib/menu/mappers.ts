import type { Category, Product, ProductOption, ProductOptionGroup, RestaurantTable } from "@/types/database";
import type {
  CategoryFormValues,
  OptionFormValues,
  OptionGroupFormValues,
  ProductFormValues,
  TableFormValues,
} from "./schemas";

export function nullIfEmpty(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Accepts "12,500" as well as "12.500" — both are typed on Tunisian keyboards. */
export function parseAmount(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function categoryToForm(category: Category | null): CategoryFormValues {
  return {
    name_ar: category?.name_ar ?? "",
    name_fr: category?.name_fr ?? "",
    name_en: category?.name_en ?? "",
    description_ar: category?.description_ar ?? "",
    description_fr: category?.description_fr ?? "",
    description_en: category?.description_en ?? "",
    image_url: category?.image_url ?? null,
    is_active: category?.is_active ?? true,
  };
}

export function formToCategory(values: CategoryFormValues) {
  return {
    name_ar: nullIfEmpty(values.name_ar),
    name_fr: nullIfEmpty(values.name_fr),
    name_en: nullIfEmpty(values.name_en),
    description_ar: nullIfEmpty(values.description_ar),
    description_fr: nullIfEmpty(values.description_fr),
    description_en: nullIfEmpty(values.description_en),
    image_url: values.image_url,
    is_active: values.is_active,
  };
}

export const NO_CATEGORY_VALUE = "none";

export function productToForm(product: Product | null): ProductFormValues {
  return {
    name_ar: product?.name_ar ?? "",
    name_fr: product?.name_fr ?? "",
    name_en: product?.name_en ?? "",
    description_ar: product?.description_ar ?? "",
    description_fr: product?.description_fr ?? "",
    description_en: product?.description_en ?? "",
    category_id: product?.category_id ?? NO_CATEGORY_VALUE,
    price: product ? String(product.price) : "",
    compare_at_price: product?.compare_at_price != null ? String(product.compare_at_price) : "",
    image_url: product?.image_url ?? null,
    is_available: product?.is_available ?? true,
    is_featured: product?.is_featured ?? false,
  };
}

export function formToProduct(values: ProductFormValues) {
  return {
    name_ar: nullIfEmpty(values.name_ar),
    name_fr: nullIfEmpty(values.name_fr),
    name_en: nullIfEmpty(values.name_en),
    description_ar: nullIfEmpty(values.description_ar),
    description_fr: nullIfEmpty(values.description_fr),
    description_en: nullIfEmpty(values.description_en),
    category_id: values.category_id === NO_CATEGORY_VALUE ? null : values.category_id,
    price: parseAmount(values.price),
    compare_at_price: values.compare_at_price.trim() ? parseAmount(values.compare_at_price) : null,
    image_url: values.image_url,
    is_available: values.is_available,
    is_featured: values.is_featured,
  };
}

export function optionGroupToForm(group: ProductOptionGroup | null): OptionGroupFormValues {
  return {
    name_ar: group?.name_ar ?? "",
    name_fr: group?.name_fr ?? "",
    name_en: group?.name_en ?? "",
    is_required: group?.is_required ?? false,
    min_select: group?.min_select ?? 0,
    max_select: group?.max_select ?? 1,
  };
}

export function formToOptionGroup(values: OptionGroupFormValues) {
  return {
    name_ar: nullIfEmpty(values.name_ar),
    name_fr: nullIfEmpty(values.name_fr),
    name_en: nullIfEmpty(values.name_en),
    is_required: values.is_required,
    min_select: values.min_select,
    max_select: values.max_select,
  };
}

export function optionToForm(option: ProductOption | null): OptionFormValues {
  return {
    name_ar: option?.name_ar ?? "",
    name_fr: option?.name_fr ?? "",
    name_en: option?.name_en ?? "",
    price_delta: option ? String(option.price_delta) : "",
    is_available: option?.is_available ?? true,
  };
}

export function formToOption(values: OptionFormValues) {
  return {
    name_ar: nullIfEmpty(values.name_ar),
    name_fr: nullIfEmpty(values.name_fr),
    name_en: nullIfEmpty(values.name_en),
    price_delta: values.price_delta.trim() ? parseAmount(values.price_delta) : 0,
    is_available: values.is_available,
  };
}

export function tableToForm(table: RestaurantTable | null): TableFormValues {
  return {
    name: table?.name ?? "",
    identifier: table?.identifier ?? "",
    zone: table?.zone ?? "",
    seats: table?.seats != null ? String(table.seats) : "",
    is_active: table?.is_active ?? true,
  };
}

export function formToTable(values: TableFormValues) {
  return {
    name: values.name.trim(),
    identifier: values.identifier.trim().toLowerCase(),
    zone: nullIfEmpty(values.zone),
    seats: values.seats.trim() ? Number(values.seats) : null,
    is_active: values.is_active,
  };
}
