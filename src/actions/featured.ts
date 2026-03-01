"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function updateFeaturedProducts(productIds: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  // Batch all updates in a single transaction (1 DB round-trip instead of N)
  await db.$transaction([
    // Unflag all currently featured products not in the new list
    db.product.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false, featuredOrder: null },
    }),
    // Set featured status with ordering for each selected product
    ...productIds.map((id, index) =>
      db.product.update({
        where: { id },
        data: { isFeatured: true, featuredOrder: index },
      })
    ),
  ]);

  revalidatePath("/", "layout");

  return { success: true };
}
