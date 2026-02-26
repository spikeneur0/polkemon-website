import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProductGrid } from "@/components/products/product-grid";
import { getShowLiveBadge } from "@/lib/settings-helpers";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductSearch } from "@/components/products/product-search";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const PRODUCTS_PER_PAGE = 24;

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse our collection of premium trading cards and accessories.",
};

interface Props {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
    page?: string;
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const where: Record<string, unknown> = { isPublished: true };
  if (params.category) where.category = params.category;
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.inStock === "true") {
    where.isSoldOut = false;
  }

  // Price filtering (params are in dollars, DB stores cents)
  const minPriceCents = params.minPrice ? Math.round(parseFloat(params.minPrice) * 100) : null;
  const maxPriceCents = params.maxPrice ? Math.round(parseFloat(params.maxPrice) * 100) : null;
  if (minPriceCents !== null || maxPriceCents !== null) {
    const priceFilter: Record<string, number> = {};
    if (minPriceCents !== null && !isNaN(minPriceCents)) priceFilter.gte = minPriceCents;
    if (maxPriceCents !== null && !isNaN(maxPriceCents)) priceFilter.lte = maxPriceCents;
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }
  }

  let orderBy: Record<string, string> = { createdAt: "desc" };
  switch (params.sort) {
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

  const [products, totalCount, showLiveBadge] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
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
    }),
    db.product.count({ where }),
    getShowLiveBadge(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE));
  const startItem = totalCount === 0 ? 0 : (page - 1) * PRODUCTS_PER_PAGE + 1;
  const endItem = Math.min(page * PRODUCTS_PER_PAGE, totalCount);

  // Build base query string preserving all non-page params
  function buildPageUrl(targetPage: number): string {
    const urlParams = new URLSearchParams();
    if (params.category) urlParams.set("category", params.category);
    if (params.sort) urlParams.set("sort", params.sort);
    if (params.q) urlParams.set("q", params.q);
    if (params.inStock) urlParams.set("inStock", params.inStock);
    if (params.minPrice) urlParams.set("minPrice", params.minPrice);
    if (params.maxPrice) urlParams.set("maxPrice", params.maxPrice);
    if (targetPage > 1) urlParams.set("page", targetPage.toString());
    const qs = urlParams.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {params.category
            ? products.length > 0
              ? `${params.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
              : "Products"
            : "All Products"}
        </h1>
        <Suspense>
          <ProductSearch />
        </Suspense>
      </div>
      <Suspense>
        <ProductFilters />
      </Suspense>
      <div className="mt-8">
        <ProductGrid products={products} showLiveBadge={showLiveBadge} />
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {totalCount} products
          </p>
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              buildPageUrl={buildPageUrl}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  buildPageUrl,
}: {
  currentPage: number;
  totalPages: number;
  buildPageUrl: (page: number) => string;
}) {
  // Generate page numbers to display
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {/* Previous button */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </Link>
      ) : (
        <span className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </span>
      )}

      {/* Page numbers */}
      {pageNumbers.map((item, index) =>
        item === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex items-center px-2 py-2 text-sm text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Link
            key={item}
            href={buildPageUrl(item as number)}
            className={
              item === currentPage
                ? "inline-flex items-center rounded-md border border-foreground bg-foreground px-3 py-2 text-sm font-medium text-background"
                : "inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
            }
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </Link>
        )
      )}

      {/* Next button */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Next
          <svg
            className="ml-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      ) : (
        <span className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
          Next
          <svg
            className="ml-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      )}
    </nav>
  );
}

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  if (currentPage > 3) {
    pages.push("...");
  }

  // Show pages around current
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("...");
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}
