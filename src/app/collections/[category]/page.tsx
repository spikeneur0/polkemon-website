import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { ProductGrid } from "@/components/products/product-grid";
import { CollectionFilters } from "@/components/products/collection-filters";
import { CATEGORIES } from "@/lib/constants";
import { getShowLiveBadge } from "@/lib/settings-helpers";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  pokemon:
    "Browse our selection of Pokemon TCG booster boxes, booster packs, and sealed products.",
  "one-piece":
    "One Piece Trading Card Game sealed products and booster packs.",
  "magic-the-gathering":
    "Magic: The Gathering boosters, commander decks, and sealed products.",
  "yu-gi-oh":
    "Yu-Gi-Oh! booster boxes, booster packs, and sealed products.",
  "weiss-schwarz":
    "Weiss Schwarz booster boxes, trial decks, and sealed products.",
  lorcana:
    "Disney Lorcana booster boxes, starter decks, and sealed products.",
  digimon:
    "Digimon Card Game booster boxes, starter decks, and sealed products.",
  "other-tcgs":
    "Explore other trading card games including niche and emerging titles.",
  "pokemon-singles-jp":
    "Individual Japanese Pokemon cards, holos, and rare pulls.",
  "pokemon-singles-eng":
    "Individual English Pokemon cards, holos, and rare pulls.",
  "digimon-singles":
    "Individual Digimon cards and rare pulls.",
  supplies:
    "Card sleeves, deck boxes, binders, toploaders, and other TCG accessories.",
  "blind-boxes":
    "Mystery blind boxes and surprise collectible figures.",
  figures:
    "Collectible figures and statues from your favorite franchises.",
  plush:
    "Soft and cuddly plush toys from popular anime and gaming series.",
  models:
    "Model kits and buildable collectibles.",
  keychains:
    "Keychains and bag charms featuring popular characters.",
  clothing:
    "Anime and gaming themed apparel and accessories.",
  "jewelry-pins":
    "Enamel pins, jewelry, and wearable collectibles.",
  "food-drink":
    "Imported snacks, candy, and drinks from Japan and beyond.",
  other:
    "Other collectibles and miscellaneous products.",
};

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    sort?: string;
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  const name =
    cat?.name ||
    category
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: name,
    description:
      CATEGORY_DESCRIPTIONS[category] ||
      `Shop ${name} trading cards and accessories at Polkemon Trading Co.`,
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { sort, inStock, minPrice, maxPrice } = await searchParams;

  const cat = CATEGORIES.find((c) => c.slug === category);

  let orderBy: Record<string, string> = { createdAt: "desc" };
  switch (sort) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
  }

  // Build where clause with filters
  const where: Prisma.ProductWhereInput = {
    category,
    isPublished: true,
  };

  if (inStock === "true") {
    where.isSoldOut = false;
  }

  // Price filter (convert dollars to cents)
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      const minCents = Math.round(parseFloat(minPrice) * 100);
      if (!isNaN(minCents)) where.price.gte = minCents;
    }
    if (maxPrice) {
      const maxCents = Math.round(parseFloat(maxPrice) * 100);
      if (!isNaN(maxCents)) where.price.lte = maxCents;
    }
  }

  const products = await db.product.findMany({
    where,
    orderBy,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      images: true,
      isSoldOut: true,
      category: true,
      marketPriceEnabled: true,
    },
  });

  const showLiveBadge = await getShowLiveBadge();

  // Get total count without filters for display
  const totalCount = await db.product.count({
    where: { category, isPublished: true },
  });

  // If category doesn't exist in our constants and has no products, 404
  if (!cat && totalCount === 0) notFound();

  const displayName =
    cat?.name ||
    category
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const description = CATEGORY_DESCRIPTIONS[category] || null;
  const isFiltered = inStock || minPrice || maxPrice;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{displayName}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-muted-foreground">
            {isFiltered
              ? `${products.length} of ${totalCount}`
              : `${totalCount} ${totalCount === 1 ? "product" : "products"}`}
          </span>
        </div>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="mb-6">
        <CollectionFilters />
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            {isFiltered
              ? "No products match your filters. Try adjusting your criteria."
              : "No products found in this category yet."}
          </p>
        </div>
      ) : (
        <ProductGrid products={products} showLiveBadge={showLiveBadge} />
      )}
    </div>
  );
}
