import { NextResponse } from "next/server";
import { syncSingleProduct } from "@/lib/services/marketPriceSync";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  try {
    const result = await syncSingleProduct(productId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Single sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync price" },
      { status: 500 }
    );
  }
}
