import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json([]);
  }

  const products = await db.product.findMany({
    where: {
      isPublished: true,
      name: {
        contains: q,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
      category: true,
      isSoldOut: true,
    },
    take: 8,
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(products);
}
