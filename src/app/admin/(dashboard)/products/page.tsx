import Link from "next/link";
import Image from "next/image";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { AdminProductActions } from "@/components/admin/product-actions";
import { CategoryFilter, StatusFilter } from "@/components/admin/product-filters";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.q || "";
  const category = params.category || "";
  const status = params.status || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  // Build where clause
  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (status === "published") {
    where.isPublished = true;
  } else if (status === "draft") {
    where.isPublished = false;
  } else if (status === "soldout") {
    where.isSoldOut = true;
  } else if (status === "market") {
    where.marketPriceEnabled = true;
  }

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Build URL helper for filters
  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { q: search, category, status, page: "1", ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    // Reset to page 1 when changing filters (unless page is explicitly set)
    if (!overrides.page && overrides.page !== undefined) p.delete("page");
    return `/admin/products?${p.toString()}`;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} product{totalCount !== 1 ? "s" : ""}
            {(search || category || status) && " matching filters"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <form action="/admin/products" method="GET" className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            type="text"
            placeholder="Search products..."
            defaultValue={search}
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {category && <input type="hidden" name="category" value={category} />}
          {status && <input type="hidden" name="status" value={status} />}
        </form>

        {/* Category filter */}
        <CategoryFilter value={category} />

        {/* Status filter */}
        <StatusFilter value={status} />

        {/* Clear filters */}
        {(search || category || status) && (
          <Link
            href="/admin/products"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Products table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-center font-medium">Stock</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Sold Out</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {search || category || status
                    ? "No products match your filters."
                    : "No products yet. Add your first product to get started."}
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const categoryLabel =
                  CATEGORIES.find((c) => c.slug === product.category)?.name ||
                  product.category;
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
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
                        <div>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="font-medium hover:underline"
                          >
                            {product.name}
                          </Link>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">
                              {product.sku}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {categoryLabel}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatPrice(product.price)}
                      {product.marketPriceEnabled && (
                        <span
                          className="ml-1 inline-flex rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700"
                          title="Market priced"
                        >
                          M
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {product.quantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.isPublished
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {product.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminProductActions
                        productId={product.id}
                        isSoldOut={product.isSoldOut}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm opacity-50">
                <ChevronLeft className="h-4 w-4" />
                Prev
              </span>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
                      {p}
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={buildUrl({ page: String(p) })}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm ${
                        p === page
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:bg-accent"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
            </div>

            {page < totalPages ? (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm opacity-50">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
