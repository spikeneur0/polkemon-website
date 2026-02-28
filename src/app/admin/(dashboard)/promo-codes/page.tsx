import { db } from "@/lib/db";
import PromoCodesTable from "./promo-codes-table";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const promoCodes = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-8">
      <PromoCodesTable promoCodes={promoCodes} />
    </div>
  );
}
