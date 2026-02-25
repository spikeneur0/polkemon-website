"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const currentSort = searchParams.get("sort") || "newest";

  function updateParams(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        {CATEGORIES.map((cat) => (
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
      </div>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => updateParams("sort", e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name">Name: A-Z</option>
      </select>
    </div>
  );
}
