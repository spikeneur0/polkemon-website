import { NextResponse } from "next/server";
import { syncAllProducts } from "@/lib/services/marketPriceSync";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if sync is due based on configured frequency
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings?.marketPriceMasterEnabled) {
    return NextResponse.json({ skipped: true, reason: "Master toggle disabled" });
  }

  // Check last sync time
  const lastLog = await db.marketPriceSyncLog.findFirst({
    where: { triggeredBy: { in: ["cron", "manual"] } },
    orderBy: { startedAt: "desc" },
  });

  if (lastLog?.startedAt) {
    const frequencyMs = parseFrequency(settings.marketPriceSyncFrequency);
    const elapsed = Date.now() - lastLog.startedAt.getTime();

    if (elapsed < frequencyMs) {
      return NextResponse.json({
        skipped: true,
        reason: `Last sync was ${Math.round(elapsed / 60_000)}min ago, frequency is ${settings.marketPriceSyncFrequency}`,
      });
    }
  }

  try {
    const result = await syncAllProducts();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Cron sync error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}

function parseFrequency(freq: string): number {
  switch (freq) {
    case "6h":
      return 6 * 60 * 60 * 1000;
    case "12h":
      return 12 * 60 * 60 * 1000;
    case "24h":
    default:
      return 24 * 60 * 60 * 1000;
  }
}
