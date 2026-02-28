"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, X, Tag } from "lucide-react";
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

interface AppliedPromo {
  code: string;
  discountType: string;
  discountValue: number;
  discountCents: number;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } =
    useCartStore();
  const [loading, setLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

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

  // Re-validate promo when subtotal changes (items added/removed/quantity changed)
  useEffect(() => {
    if (!appliedPromo) return;
    const currentSubtotal = subtotal();
    if (currentSubtotal === 0) {
      setAppliedPromo(null);
      return;
    }
    // Re-calculate discount for new subtotal
    let newDiscountCents: number;
    if (appliedPromo.discountType === "percentage") {
      newDiscountCents = Math.round(
        (currentSubtotal * appliedPromo.discountValue) / 100
      );
    } else {
      newDiscountCents = appliedPromo.discountValue;
    }
    newDiscountCents = Math.min(newDiscountCents, currentSubtotal);
    if (newDiscountCents !== appliedPromo.discountCents) {
      setAppliedPromo({ ...appliedPromo, discountCents: newDiscountCents });
    }
  }, [subtotal, items, appliedPromo]);

  async function handleApplyPromo() {
    const code = promoInput.trim();
    if (!code) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotalCents: subtotal(),
        }),
      });
      const data = await res.json();

      if (data.valid) {
        setAppliedPromo({
          code: code.toUpperCase(),
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountCents: data.discountCents,
        });
        setPromoError(null);
        setPromoInput("");
      } else {
        setPromoError(data.error || "Invalid promo code");
        setAppliedPromo(null);
      }
    } catch {
      setPromoError("Failed to validate promo code. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoError(null);
    setPromoInput("");
  }

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
          promoCode: appliedPromo?.code || null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
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

  const currentSubtotal = subtotal();
  const discountCents = appliedPromo?.discountCents ?? 0;
  const totalAfterDiscount = currentSubtotal - discountCents;

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
                      &#x1F0CF;
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
                  {formatPrice(currentSubtotal)}
                </span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <Tag className="h-3.5 w-3.5" />
                    Discount ({appliedPromo.code})
                  </span>
                  <span className="font-medium tabular-nums text-green-600">
                    -{formatPrice(discountCents)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">Calculated at checkout</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(totalAfterDiscount)}</span>
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
            {appliedPromo ? (
              <div className="mt-3">
                <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {appliedPromo.code}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-500">
                      {appliedPromo.discountType === "percentage"
                        ? `${appliedPromo.discountValue}% off`
                        : `${formatPrice(appliedPromo.discountValue)} off`}
                    </span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="rounded p-0.5 text-green-600 transition-colors hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900"
                    aria-label="Remove promo code"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-green-600 dark:text-green-500">
                  You save {formatPrice(discountCents)} on this order!
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      if (promoError) setPromoError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyPromo();
                    }}
                    placeholder="Enter code"
                    disabled={promoLoading}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {promoLoading ? "..." : "Apply"}
                  </button>
                </div>
                {promoError && (
                  <p className="mt-2 text-xs text-red-500">{promoError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
