"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
  isSoldOut?: boolean;
  category?: string;
}

export function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  image,
  isSoldOut,
}: ProductCardProps) {
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
        </div>
      </div>
    </Link>
  );
}
