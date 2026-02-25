"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateFeaturedProducts(productIds: string[]) {
  // Unflag all currently featured products
  await db.product.updateMany({
    where: { isFeatured: true },
    data: { isFeatured: false, featuredOrder: null },
  });

  // Flag selected products as featured with order
  for (let i = 0; i < productIds.length; i++) {
    await db.product.update({
      where: { id: productIds[i] },
      data: { isFeatured: true, featuredOrder: i },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/featured");

  return { success: true };
}
