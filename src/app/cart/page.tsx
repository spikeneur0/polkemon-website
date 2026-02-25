"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { useState, useEffect } from "react";

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  isSoldOut: boolean;
  category: string;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } =
    useCartStore();
  const [loading, setLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      fetch("/api/featured")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFeaturedProducts(data);
        })
        .catch(() => {});
    }
  }, [items.length]);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Browse our products and add something you love.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Popular Products */}
        {featuredProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-center text-xl font-bold">
              Popular Products
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {featuredProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
                    {p.images[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-3xl text-muted-foreground/30">
                          &#x1F0CF;
                        </span>
                      </div>
                    )}
                    {p.isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-white">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-medium line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">
                    {formatPrice(p.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 rounded-lg border border-border p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-muted-foreground/30">
                      🃏
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between">
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="rounded border border-border p-1.5 transition-colors hover:bg-accent"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="rounded border border-border p-1.5 transition-colors hover:bg-accent"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={clearCart}
            className="mt-4 text-sm text-muted-foreground transition-colors hover:text-destructive"
          >
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {formatPrice(subtotal())}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">Calculated at checkout</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(subtotal())}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Proceed to Checkout"}
            </button>
            <Link
              href="/products"
              className="mt-3 block text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Promo Code */}
          <div className="rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold">Promo Code</h3>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Enter code"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
                Apply
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Promo codes are applied at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
