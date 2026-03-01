"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Star,
  X,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Search,
  ChevronsUpDown,
} from "lucide-react";
import { updateFeaturedProducts } from "@/actions/featured";
import { formatPrice } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  isFeatured: boolean;
  featuredOrder: number | null;
  category: string;
}

/** Map category slug → display name from constants */
const CATEGORY_NAME_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

function getCategoryName(slug: string) {
  return CATEGORY_NAME_MAP[slug] || slug;
}

export default function AdminFeaturedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Available products state
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        const featuredIds = data
          .filter((p) => p.isFeatured)
          .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99))
          .map((p) => p.id);
        setFeatured(featuredIds);
        setLoading(false);
      });
  }, []);

  function toggleFeatured(productId: string) {
    setFeatured((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setFeatured((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === featured.length - 1) return;
    setFeatured((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await updateFeaturedProducts(featured);
    setSaving(false);
    alert("Featured products updated!");
  }

  // ─── Available products: filter, group, sort ───
  const availableProducts = useMemo(
    () => products.filter((p) => !featured.includes(p.id)),
    [products, featured]
  );

  const query = search.trim().toLowerCase();

  const filteredProducts = useMemo(
    () =>
      query
        ? availableProducts.filter((p) =>
            p.name.toLowerCase().includes(query)
          )
        : availableProducts,
    [availableProducts, query]
  );

  /** Grouped by category, sorted alphabetically by display name */
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of filteredProducts) {
      const cat = p.category || "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }

    // Sort products within each category alphabetically
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Return entries sorted by display name
    return [...map.entries()].sort((a, b) =>
      getCategoryName(a[0]).localeCompare(getCategoryName(b[0]))
    );
  }, [filteredProducts]);

  // When searching, auto-expand categories with matches
  const prevQueryRef = useRef("");
  useEffect(() => {
    if (query && query !== prevQueryRef.current) {
      setExpandedCategories(new Set(groupedByCategory.map(([cat]) => cat)));
    } else if (!query && prevQueryRef.current) {
      // Search cleared → collapse all
      setExpandedCategories(new Set());
    }
    prevQueryRef.current = query;
  }, [query, groupedByCategory]);

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleAllCategories() {
    if (expandedCategories.size === groupedByCategory.length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(groupedByCategory.map(([cat]) => cat)));
    }
  }

  const allExpanded = expandedCategories.size === groupedByCategory.length && groupedByCategory.length > 0;

  // ─── Render ───
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  const featuredProducts = featured
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Featured Products</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Selected Featured */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Featured ({featured.length} selected)
          </h2>
          {featuredProducts.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Click products on the right to feature them
            </div>
          ) : (
            <div className="space-y-2">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <GripVertical className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs">
                        🃏
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-30"
                    >
                      Up
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === featured.length - 1}
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-30"
                    >
                      Down
                    </button>
                    <button
                      onClick={() => toggleFeatured(product.id)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Products */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Available Products ({availableProducts.length})
          </h2>

          {/* Search + Expand/Collapse controls */}
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search available products..."
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={toggleAllCategories}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={allExpanded ? "Collapse All" : "Expand All"}
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          </div>

          {/* Category accordion list */}
          <div className="max-h-[600px] space-y-1 overflow-y-auto">
            {groupedByCategory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {query
                  ? "No products match your search"
                  : "No available products"}
              </div>
            ) : (
              groupedByCategory.map(([category, categoryProducts]) => {
                const isExpanded = expandedCategories.has(category);
                return (
                  <div key={category} className="rounded-lg border border-border overflow-hidden">
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center gap-2 bg-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1 text-sm font-medium">
                        {getCategoryName(category)}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {categoryProducts.length}
                      </span>
                    </button>

                    {/* Collapsible product list */}
                    <div
                      className="transition-[grid-template-rows] duration-200 ease-in-out"
                      style={{
                        display: "grid",
                        gridTemplateRows: isExpanded ? "1fr" : "0fr",
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="divide-y divide-border border-t border-border">
                          {categoryProducts.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => toggleFeatured(product.id)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                            >
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                                {product.images[0] ? (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xs">
                                    🃏
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                  {formatPrice(product.price)}
                                </p>
                              </div>
                              <Star className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
