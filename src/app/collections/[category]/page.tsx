import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductGrid } from "@/components/products/product-grid";
import { CATEGORIES } from "@/lib/constants";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) return {};
  return {
    title: cat.name,
    description: `Shop ${cat.name} trading cards and accessories at Polkemon Trading Co.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { category } = await params;

  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">{cat.name}</h1>
      <ProductGrid products={products} />
    </div>
  );
}
