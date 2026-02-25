import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductGrid } from "@/components/products/product-grid";
import { CATEGORIES } from "@/lib/constants";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  const name = cat?.name || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: name,
    description: `Shop ${name} trading cards and accessories at Polkemon Trading Co.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { category } = await params;

  const cat = CATEGORIES.find((c) => c.slug === category);

  const products = await db.product.findMany({
    where: { category, isPublished: true },
    orderBy: { createdAt: "desc" },
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

  // If category doesn't exist in our constants and has no products, 404
  if (!cat && products.length === 0) notFound();

  const displayName = cat?.name || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">{displayName}</h1>
      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No products found in this category yet.</p>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
