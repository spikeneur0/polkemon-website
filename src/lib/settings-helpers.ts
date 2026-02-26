import { db } from "@/lib/db";

export async function getShowLiveBadge(): Promise<boolean> {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: { marketPriceShowBadge: true, marketPriceMasterEnabled: true },
    });
    return (settings?.marketPriceMasterEnabled && settings?.marketPriceShowBadge) ?? false;
  } catch {
    return false;
  }
}
