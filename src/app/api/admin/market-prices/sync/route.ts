import { NextResponse } from "next/server";
import { syncAllProducts } from "@/lib/services/marketPriceSync";

export async function POST() {
  try {
    const result = await syncAllProducts();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Sync all error:", err);
    return NextResponse.json(
      { error: "Failed to sync prices" },
      { status: 500 }
    );
  }
}
