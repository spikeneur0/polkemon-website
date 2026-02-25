import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      isFeatured: true,
      featuredOrder: true,
      category: true,
    },
  });
  return NextResponse.json(products);
}
