"use client";

import { Clock, MapPin, Phone, Search, ShoppingBag, Store, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { LogoMark } from "@/components/brand/logo";
import { SITE_NAME } from "@/lib/config";
import { useMenuTracking } from "@/lib/analytics/use-menu-tracking";
import { isLocale, localeLabel, locales, STORAGE_KEY, type Locale } from "@/lib/i18n/config";
import { formatPrice, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import type { PublicMenu } from "@/lib/menu/get-public-menu";
import { isOpenNow, parseOpeningHours, parseSocialLinks } from "@/lib/menu/opening-hours";
import { menuDisplayClass, menuThemeStyle } from "@/lib/menu/theme";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";
import { MenuCart, type CartItem } from "./menu-cart";
import { ProductCard } from "./product-card";
import { ProductSheet, type CartSelection } from "./product-sheet";

const UNCATEGORIZED = "__uncategorized__";

export function MenuExperience({ menu }: { menu: PublicMenu }) {
  const { restaurant, settings, categories, products, optionGroupsByProduct } = menu;
  const { t, locale, setLocale } = useTranslation();

  const fallbackLocale = restaurant.default_language;
  const availableLocales = React.useMemo(() => {
    const list = (restaurant.available_languages ?? []).filter((value): value is Locale => isLocale(value));
    return list.length > 0 ? list : [...locales];
  }, [restaurant.available_languages]);

  // First-time visitors get the venue's own language; a guest who has already
  // chosen one keeps it.
  React.useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (!isLocale(stored) && availableLocales.includes(fallbackLocale)) {
      setLocale(fallbackLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { tableName, tableId, trackInteraction } = useMenuTracking(restaurant.id, locale);

  const showImages = settings?.show_product_images ?? true;
  const showPrices = settings?.show_prices ?? true;
  const searchEnabled = settings?.enable_search ?? true;
  const cartEnabled = settings?.enable_cart ?? false;
  // Ordering rides on the basket: a venue cannot take orders through a list
  // the guest was never shown.
  const orderingEnabled = cartEnabled && (settings?.enable_ordering ?? false);
  const showUnavailable = settings?.show_unavailable_products ?? true;

  const visibleProducts = React.useMemo(
    () => products.filter((product) => showUnavailable || product.is_available),
    [products, showUnavailable]
  );

  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [openNow, setOpenNow] = React.useState<boolean | null>(null);

  // Radix renders dialogs through a portal, which mounts them on document.body
  // — outside the element these variables are declared on. Without handing the
  // palette to them too, every var(--menu-*) inside a dialog resolves to
  // nothing: the panel loses its background and the menu shows through it.
  const themeStyle = React.useMemo(
    () => menuThemeStyle(restaurant.theme, restaurant.primary_color, restaurant.secondary_color),
    [restaurant.theme, restaurant.primary_color, restaurant.secondary_color]
  );

  const sectionRefs = React.useRef(new Map<string, HTMLElement>());

  const openingHours = React.useMemo(() => parseOpeningHours(settings?.opening_hours), [settings?.opening_hours]);
  const social = React.useMemo(() => parseSocialLinks(settings?.social_links), [settings?.social_links]);

  // Computed after mount: the visitor's clock, not the server's.
  React.useEffect(() => {
    setOpenNow(isOpenNow(openingHours));
  }, [openingHours]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of visibleProducts) {
      const key = product.category_id ?? UNCATEGORIZED;
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
    }
    return map;
  }, [visibleProducts]);

  const sections = React.useMemo(() => {
    const result = categories
      .map((category) => ({ id: category.id, title: localized(category, "name", locale, fallbackLocale), items: grouped.get(category.id) ?? [] }))
      .filter((section) => section.items.length > 0);

    const loose = grouped.get(UNCATEGORIZED) ?? [];
    if (loose.length > 0) {
      result.push({ id: UNCATEGORIZED, title: t.products.noCategory, items: loose });
    }
    return result;
  }, [categories, grouped, locale, fallbackLocale, t]);

  const featured = React.useMemo(
    () => visibleProducts.filter((product) => product.is_featured).slice(0, 8),
    [visibleProducts]
  );

  const searchResults = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return null;
    return visibleProducts.filter((product) =>
      [product.name_ar, product.name_fr, product.name_en, product.description_ar, product.description_fr, product.description_en]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [search, visibleProducts]);

  React.useEffect(() => {
    if (searchResults || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target instanceof HTMLElement && visible.target.dataset.sectionId) {
          setActiveCategory(visible.target.dataset.sectionId);
        }
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 }
    );

    for (const element of sectionRefs.current.values()) {
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sections, searchResults]);

  const scrollToCategory = (categoryId: string) => {
    const element = sectionRefs.current.get(categoryId);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 128;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveCategory(categoryId);
    if (categoryId !== UNCATEGORIZED) trackInteraction("category", categoryId);
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    trackInteraction("product", product.id);
  };

  const addToCart = (selection: CartSelection) => {
    const optionIds = [...selection.optionIds].sort();
    const key = `${selection.product.id}:${optionIds.join(",")}`;
    const groups = optionGroupsByProduct[selection.product.id] ?? [];
    const optionLabels = optionIds
      .map((id) => {
        const option = groups.flatMap((group) => group.options).find((candidate) => candidate.id === id);
        return option ? localized(option, "name", locale, fallbackLocale) : null;
      })
      .filter((value): value is string => Boolean(value));

    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) =>
          item.key === key ? { ...item, quantity: Math.min(99, item.quantity + selection.quantity) } : item
        );
      }
      return [
        ...current,
        {
          key,
          product: selection.product,
          quantity: selection.quantity,
          optionLabels,
          optionIds: selection.optionIds,
          unitPrice: selection.unitPrice,
        },
      ];
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const description = localized(restaurant, "description", locale, fallbackLocale);
  const displayName = localized(restaurant, "name", locale, fallbackLocale) || restaurant.name;
  const announcement = localized(
    {
      announcement_ar: settings?.announcement_ar ?? null,
      announcement_fr: settings?.announcement_fr ?? null,
      announcement_en: settings?.announcement_en ?? null,
    },
    "announcement",
    locale,
    fallbackLocale
  );

  return (
    <div
      style={themeStyle}
      className="min-h-dvh bg-[var(--menu-bg)] text-[var(--menu-text)]"
    >
      <header className="relative">
        {restaurant.cover_url ? (
          <div className="relative h-40 w-full sm:h-56">
            <Image
              src={restaurant.cover_url}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--menu-bg)] to-transparent" />
          </div>
        ) : (
          <div className="h-6" />
        )}

        <div className={cn("mx-auto w-full max-w-2xl px-4", restaurant.cover_url && "-mt-12")}>
          <div className="flex items-end gap-3">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--menu-surface)] bg-[var(--menu-surface-alt)] shadow-pop">
              {restaurant.logo_url ? (
                <Image src={restaurant.logo_url} alt="" fill sizes="80px" className="object-cover" priority />
              ) : (
                <span className="flex size-full items-center justify-center text-[var(--menu-muted)]">
                  <Store className="size-8" aria-hidden />
                </span>
              )}
            </div>

            <div className="flex flex-1 items-center justify-end gap-1 pb-1">
              {availableLocales.length > 1 ? (
                <div
                  className="flex items-center gap-0.5 rounded-full border border-[var(--menu-border)] bg-[var(--menu-surface)] p-0.5"
                  role="group"
                  aria-label={t.common.language}
                >
                  {availableLocales.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLocale(option)}
                      aria-pressed={option === locale}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        option === locale
                          ? "bg-[var(--menu-accent)] text-[var(--menu-accent-text)]"
                          : "text-[var(--menu-muted)]"
                      )}
                    >
                      {localeLabel[option]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3">
            <h1 className={cn("text-2xl font-bold leading-tight", menuDisplayClass(restaurant.theme))}>
              {displayName}
            </h1>

            {description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--menu-muted)]">{description}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {openNow !== null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                    openNow ? "bg-emerald-500/15 text-emerald-700" : "bg-[var(--menu-surface-alt)] text-[var(--menu-muted)]"
                  )}
                >
                  <Clock className="size-3.5" aria-hidden />
                  {openNow ? t.menu.open : t.menu.closed}
                </span>
              ) : null}

              {tableName ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--menu-accent)] px-2.5 py-1 font-medium text-[var(--menu-accent-text)]">
                  {t.menu.tableLabel} · {tableName}
                </span>
              ) : null}
            </div>
          </div>

          {announcement ? (
            <p className="mt-4 rounded-[var(--menu-radius)] border border-[var(--menu-accent)]/30 bg-[var(--menu-accent)]/[0.08] px-3 py-2 text-sm">
              {announcement}
            </p>
          ) : null}
        </div>
      </header>

      <div className="sticky top-0 z-20 mt-4 border-b border-[var(--menu-border)] bg-[var(--menu-header-bg)] backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 py-2.5">
          {searchEnabled ? (
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-[var(--menu-muted)] ltr:left-3 rtl:right-3"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.menu.searchPlaceholder}
                aria-label={t.common.search}
                className="h-10 w-full rounded-full border border-[var(--menu-border)] bg-[var(--menu-surface)] ps-9 pe-9 text-sm text-[var(--menu-text)] outline-none placeholder:text-[var(--menu-muted)] focus:border-[var(--menu-accent)]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t.common.close}
                  className="absolute top-1/2 -translate-y-1/2 p-1.5 text-[var(--menu-muted)] ltr:right-2 rtl:left-2"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          ) : null}

          {!searchResults && sections.length > 1 ? (
            <div className="scrollbar-none -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-0.5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToCategory(section.id)}
                  aria-current={activeCategory === section.id ? "true" : undefined}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    activeCategory === section.id
                      ? "border-[var(--menu-accent)] bg-[var(--menu-accent)] text-[var(--menu-accent-text)]"
                      : "border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-muted)]"
                  )}
                >
                  {section.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5">
        {searchResults ? (
          searchResults.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-base font-semibold">{t.menu.noResultsTitle}</p>
              <p className="mt-1 text-sm text-[var(--menu-muted)]">{t.menu.noResultsText}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  fallbackLocale={fallbackLocale}
                  currency={restaurant.currency}
                  showImage={showImages}
                  showPrice={showPrices}
                  t={t}
                  onSelect={() => openProduct(product)}
                />
              ))}
            </div>
          )
        ) : sections.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base font-semibold">{t.menu.emptyMenuTitle}</p>
            <p className="mt-1 text-sm text-[var(--menu-muted)]">{t.menu.emptyMenuText}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {featured.length > 0 ? (
              <section>
                <h2 className={cn("mb-3 text-lg font-bold", menuDisplayClass(restaurant.theme))}>{t.menu.featured}</h2>
                <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
                  {featured.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openProduct(product)}
                      className="w-40 shrink-0 snap-start overflow-hidden rounded-[var(--menu-radius)] border border-[var(--menu-border)] bg-[var(--menu-surface)] text-start"
                    >
                      {showImages ? (
                        <span className="relative block aspect-square w-full bg-[var(--menu-surface-alt)]">
                          {product.image_url ? (
                            <Image src={product.image_url} alt="" fill sizes="160px" className="object-cover" />
                          ) : null}
                        </span>
                      ) : null}
                      <span className="block p-2.5">
                        <span className="block truncate text-sm font-semibold">
                          {localized(product, "name", locale, fallbackLocale)}
                        </span>
                        {showPrices ? (
                          <span className="mt-0.5 block text-sm font-semibold tabular-nums text-[var(--menu-accent)]">
                            {formatPrice(product.price, restaurant.currency, locale)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {sections.map((section) => (
              <section
                key={section.id}
                data-section-id={section.id}
                ref={(element) => {
                  if (element) sectionRefs.current.set(section.id, element);
                  else sectionRefs.current.delete(section.id);
                }}
                className="scroll-mt-32"
              >
                <h2 className={cn("mb-3 text-lg font-bold", menuDisplayClass(restaurant.theme))}>{section.title}</h2>
                <div className="space-y-2">
                  {section.items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      fallbackLocale={fallbackLocale}
                      currency={restaurant.currency}
                      showImage={showImages}
                      showPrice={showPrices}
                      t={t}
                      onSelect={() => openProduct(product)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-12 space-y-3 border-t border-[var(--menu-border)] pt-6 text-sm text-[var(--menu-muted)]">
          {restaurant.address ? (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {restaurant.google_maps_url ? (
                <a href={restaurant.google_maps_url} target="_blank" rel="noreferrer noopener" className="underline">
                  {restaurant.address}
                </a>
              ) : (
                <span>{restaurant.address}</span>
              )}
            </p>
          ) : null}

          {restaurant.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" aria-hidden />
              <a href={`tel:${restaurant.phone.replace(/\s/g, "")}`} dir="ltr" className="underline">
                {restaurant.phone}
              </a>
            </p>
          ) : null}

          {openingHours.length > 0 ? (
            <ul className="space-y-0.5">
              {openingHours.map((entry) => {
                const dayNames = [
                  t.days.sunday,
                  t.days.monday,
                  t.days.tuesday,
                  t.days.wednesday,
                  t.days.thursday,
                  t.days.friday,
                  t.days.saturday,
                ];
                return (
                  <li key={entry.day} className="flex justify-between gap-4 text-xs">
                    <span>{dayNames[entry.day]}</span>
                    <span dir="ltr" className="tabular-nums">
                      {entry.closed ? t.restaurant.closed : `${entry.open} – ${entry.close}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {Object.values(social).some(Boolean) ? (
            <p className="flex flex-wrap gap-3">
              {social.facebook ? (
                <a href={social.facebook} target="_blank" rel="noreferrer noopener" className="underline">
                  Facebook
                </a>
              ) : null}
              {social.instagram ? (
                <a href={social.instagram} target="_blank" rel="noreferrer noopener" className="underline">
                  Instagram
                </a>
              ) : null}
              {social.tiktok ? (
                <a href={social.tiktok} target="_blank" rel="noreferrer noopener" className="underline">
                  TikTok
                </a>
              ) : null}
              {social.website ? (
                <a href={social.website} target="_blank" rel="noreferrer noopener" className="underline">
                  {t.restaurant.website}
                </a>
              ) : null}
            </p>
          ) : null}

          <p className="flex items-center gap-1.5 pt-2 text-xs">
            {t.menu.poweredBy}
            <Link href="/" className="inline-flex items-center gap-1 font-medium underline">
              <LogoMark className="size-4" />
              {SITE_NAME}
            </Link>
          </p>
        </footer>
      </main>

      {cartEnabled && cartCount > 0 ? (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 z-30 flex items-center gap-2 rounded-full bg-[var(--menu-accent)] px-5 py-3 text-sm font-semibold text-[var(--menu-accent-text)] shadow-pop ltr:right-5 rtl:left-5"
        >
          <ShoppingBag className="size-4" aria-hidden />
          {t.menu.cart}
          <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs tabular-nums">{cartCount}</span>
        </button>
      ) : null}

      <ProductSheet
        themeStyle={themeStyle}
        product={selectedProduct}
        optionGroups={selectedProduct ? (optionGroupsByProduct[selectedProduct.id] ?? []) : []}
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        locale={locale}
        fallbackLocale={fallbackLocale}
        currency={restaurant.currency}
        showPrice={showPrices}
        showImage={showImages}
        cartEnabled={cartEnabled}
        t={t}
        onAddToCart={addToCart}
      />

      <MenuCart
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart}
        onChangeQuantity={(key, quantity) =>
          setCart((current) =>
            quantity <= 0
              ? current.filter((item) => item.key !== key)
              : current.map((item) => (item.key === key ? { ...item, quantity: Math.min(99, quantity) } : item))
          )
        }
        onRemove={(key) => setCart((current) => current.filter((item) => item.key !== key))}
        onClear={() => {
          setCart([]);
          setCartOpen(false);
        }}
        locale={locale}
        fallbackLocale={fallbackLocale}
        currency={restaurant.currency}
        t={t}
        onOrderPlaced={() => setCart([])}
        themeStyle={themeStyle}
        orderingEnabled={orderingEnabled}
        restaurantId={restaurant.id}
        tableId={tableId}
      />
    </div>
  );
}
