"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useToast } from "@/components/ui/use-toast";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
  isSoldOut?: boolean;
  category?: string;
  marketPriceEnabled?: boolean;
  showLiveBadge?: boolean;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  image,
  isSoldOut,
  marketPriceEnabled,
  showLiveBadge,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      name,
      slug,
      price,
      image: image || "",
      quantity: 1,
    });
    toast({ title: "Added to cart", description: name });
    window.dispatchEvent(new CustomEvent("open-cart"));
  }

  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl text-muted-foreground/30">🃏</span>
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-sm font-bold uppercase tracking-[0.15em] text-white">
              Sold Out
            </span>
          </div>
        )}
        {/* Quick add-to-cart button */}
        {!isSoldOut && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background opacity-0 shadow-lg transition-all duration-200 hover:scale-110 group-hover:opacity-100"
            aria-label={`Add ${name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium leading-tight text-foreground line-clamp-2">
          {name}
        </h3>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold tabular-nums">
            {formatPrice(price)}
          </p>
          {compareAtPrice && compareAtPrice > price && (
            <p className="text-xs text-muted-foreground line-through tabular-nums">
              {formatPrice(compareAtPrice)}
            </p>
          )}
          {marketPriceEnabled && showLiveBadge && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
              Live
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
