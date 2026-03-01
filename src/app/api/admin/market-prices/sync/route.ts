import { NextResponse } from "next/server";
import { syncAllProducts } from "@/lib/services/marketPriceSync";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await syncAllProducts();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("Sync all error:", err);
    return NextResponse.json(
      { error: "Failed to sync prices" },
      { status: 500 }
    );
  }
}
