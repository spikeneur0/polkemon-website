"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, X, GripVertical } from "lucide-react";
import { updateFeaturedProducts } from "@/actions/featured";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  isFeatured: boolean;
  featuredOrder: number | null;
  category: string;
}

export default function AdminFeaturedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const availableProducts = products.filter(
    (p) => !featured.includes(p.id)
  );

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
                    <p className="text-sm font-medium truncate">{product.name}</p>
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
            Available Products
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {availableProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => toggleFeatured(product.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
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
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <Star className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
