import { NextResponse } from "next/server";
import { syncSingleProduct } from "@/lib/services/marketPriceSync";
import { auth } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  try {
    const result = await syncSingleProduct(productId);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("Single sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync price" },
      { status: 500 }
    );
  }
}
