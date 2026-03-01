import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 60;

export async function GET() {
  try {
    // First try to get featured products
    let products = await db.product.findMany({
      where: { isFeatured: true, isPublished: true, isSoldOut: false },
      orderBy: { featuredOrder: "asc" },
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

    // Fall back to newest products if not enough featured
    if (products.length < 4) {
      products = await db.product.findMany({
        where: { isPublished: true, isSoldOut: false },
        orderBy: { createdAt: "desc" },
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
    }

    return NextResponse.json(products, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
