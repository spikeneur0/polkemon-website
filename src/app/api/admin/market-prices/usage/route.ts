import { NextResponse } from "next/server";
import { getApiUsage } from "@/lib/services/justTcg";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const usage = await getApiUsage();

    const recentLogs = await db.marketPriceSyncLog.findMany({
      take: 50,
      orderBy: { startedAt: "desc" },
    });

    const enabledCount = await db.product.count({
      where: { marketPriceEnabled: true, tcgplayerId: { not: null } },
    });

    return NextResponse.json({
      usage,
      recentLogs,
      enabledProductCount: enabledCount,
      estimatedBulkCalls: Math.ceil(enabledCount / 20),
      apiKeyConfigured: !!process.env.JUSTTCG_API_KEY,
    });
  } catch (err) {
    console.error("Usage fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
