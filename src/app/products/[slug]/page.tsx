import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    select: { name: true, description: true, images: true },
  });
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug, isPublished: true },
  });

  if (!product) notFound();

  const categoryLabel =
    CATEGORIES.find((c) => c.slug === product.category)?.name ||
    product.category;

  const relatedProducts = await db.product.findMany({
    where: {
      category: product.category,
      isPublished: true,
      id: { not: product.id },
    },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      images: true,
      isSoldOut: true,
      category: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/collections/${product.category}`}
          className="hover:text-foreground"
        >
          {categoryLabel}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl text-muted-foreground/30">🃏</span>
              </div>
            )}
            {product.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-lg font-bold uppercase tracking-[0.15em] text-white">
                  Sold Out
                </span>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="space-y-4">
            <div>
              <Link
                href={`/collections/${product.category}`}
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                {categoryLabel}
              </Link>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice &&
                product.compareAtPrice > product.price && (
                  <span className="text-lg text-muted-foreground line-through tabular-nums">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
            </div>

            {product.sku && (
              <p className="text-xs text-muted-foreground">
                SKU: {product.sku}
              </p>
            )}

            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>{product.description}</p>
            </div>

            {product.quantity > 0 && product.quantity <= 5 && !product.isSoldOut && (
              <p className="text-sm font-medium text-destructive">
                Only {product.quantity} left in stock
              </p>
            )}
          </div>

          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group block">
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
                      <span className="text-3xl text-muted-foreground/30">🃏</span>
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
