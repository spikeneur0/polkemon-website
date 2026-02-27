import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { CATEGORIES, SITE_URL } from "@/lib/constants";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { ProductTabs } from "@/components/products/product-tabs";
import type { Metadata } from "next";

export const revalidate = 60;

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images[0] || undefined,
    sku: product.sku || undefined,
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "USD",
      availability: product.isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${SITE_URL}/products/${product.slug}`,
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data — placed at top level per best practice */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
        <ProductImageGallery
          images={product.images}
          productName={product.name}
          isSoldOut={product.isSoldOut}
        />

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

            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>{product.description}</p>
            </div>

            {/* Details section */}
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Details</h3>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Category:</span>
                <Link
                  href={`/collections/${product.category}`}
                  className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium transition-colors hover:bg-accent/80"
                >
                  {categoryLabel}
                </Link>
              </div>

              {product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tags:</span>
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {product.sku && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">SKU:</span>
                  <span className="text-xs font-mono">{product.sku}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Stock:</span>
                {product.isSoldOut ? (
                  <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    Sold Out
                  </span>
                ) : product.quantity <= 5 ? (
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    Low Stock: {product.quantity} left
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    In Stock
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <ProductTabs description={product.description} />

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
                      <span className="text-3xl text-muted-foreground/30">&#x1F0CF;</span>
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
    </>
  );
}
