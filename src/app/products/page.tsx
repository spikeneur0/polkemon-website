import { Suspense } from "react";
import { db } from "@/lib/db";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductSearch } from "@/components/products/product-search";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse our collection of premium trading cards and accessories.",
};

interface Props {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const where: Record<string, unknown> = { isPublished: true };
  if (params.category) where.category = params.category;
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
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
    },
  });

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
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
