import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import { AdminProductActions } from "@/components/admin/product-actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
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
                  No products yet. Add your first product to get started.
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
    </div>
  );
}
