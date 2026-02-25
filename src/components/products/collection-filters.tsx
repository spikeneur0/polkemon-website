"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

export function CollectionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "newest";
  const inStockOnly = searchParams.get("inStock") === "true";
  const currentMin = searchParams.get("minPrice") || "";
  const currentMax = searchParams.get("maxPrice") || "";

  const [minPrice, setMinPrice] = useState(currentMin);
  const [maxPrice, setMaxPrice] = useState(currentMax);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function handleSortChange(value: string) {
    updateParams({ sort: value === "newest" ? null : value });
  }

  function handleInStockToggle() {
    updateParams({ inStock: inStockOnly ? null : "true" });
  }

  function handlePriceApply() {
    updateParams({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
  }

  function handlePriceClear() {
    setMinPrice("");
    setMaxPrice("");
    updateParams({ minPrice: null, maxPrice: null });
  }

  const hasPriceFilter = currentMin || currentMax;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* In-stock toggle */}
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm transition-colors hover:bg-accent">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={handleInStockToggle}
          className="h-4 w-4 rounded border-gray-300 accent-foreground"
        />
        In Stock Only
      </label>

      {/* Price range */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          placeholder="Min $"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
          className="w-20 rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          min="0"
        />
        <span className="text-sm text-muted-foreground">-</span>
        <input
          type="number"
          placeholder="Max $"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
          className="w-20 rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          min="0"
        />
        <button
          onClick={handlePriceApply}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          Go
        </button>
        {hasPriceFilter && (
          <button
            onClick={handlePriceClear}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="ml-auto shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name">Name: A-Z</option>
      </select>
    </div>
  );
}
