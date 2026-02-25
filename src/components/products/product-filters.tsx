"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const INITIAL_VISIBLE_COUNT = 8;

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const currentSort = searchParams.get("sort") || "newest";
  const currentInStock = searchParams.get("inStock") === "true";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when any filter changes
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const updateMultipleParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when any filter changes
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const visibleCategories = showAllCategories
    ? CATEGORIES
    : CATEGORIES.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMoreCategories = CATEGORIES.length > INITIAL_VISIBLE_COUNT;

  function handlePriceApply() {
    const updates: Record<string, string | null> = {};
    updates.minPrice = minPrice && parseFloat(minPrice) > 0 ? minPrice : null;
    updates.maxPrice = maxPrice && parseFloat(maxPrice) > 0 ? maxPrice : null;
    updateMultipleParams(updates);
  }

  function handlePriceClear() {
    setMinPrice("");
    setMaxPrice("");
    updateMultipleParams({ minPrice: null, maxPrice: null });
  }

  function handlePriceKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handlePriceApply();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: Category pills and sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParams("category", null)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              !currentCategory
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-accent"
            )}
          >
            All
          </button>
          {visibleCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => updateParams("category", cat.slug)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                currentCategory === cat.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-accent"
              )}
            >
              {cat.name}
            </button>
          ))}
          {hasMoreCategories && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="rounded-full border border-dashed border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              {showAllCategories
                ? "Show Less"
                : `+ ${CATEGORIES.length - INITIAL_VISIBLE_COUNT} More`}
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>

      {/* Second row: In-stock toggle and price range */}
      <div className="flex flex-wrap items-end gap-4">
        {/* In-stock toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) =>
              updateParams("inStock", e.target.checked ? "true" : null)
            }
            className="h-4 w-4 rounded border-border text-foreground focus:ring-ring"
          />
          <span className="text-sm font-medium">In Stock Only</span>
        </label>

        {/* Price range */}
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="minPrice"
              className="text-xs font-medium text-muted-foreground"
            >
              Min Price
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                id="minPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className="w-24 rounded-md border border-input bg-background py-2 pl-6 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <span className="pb-2 text-sm text-muted-foreground">-</span>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="maxPrice"
              className="text-xs font-medium text-muted-foreground"
            >
              Max Price
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                id="maxPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className="w-24 rounded-md border border-input bg-background py-2 pl-6 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <button
            onClick={handlePriceApply}
            className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
          >
            Apply
          </button>
          {(currentMinPrice || currentMaxPrice) && (
            <button
              onClick={handlePriceClear}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
