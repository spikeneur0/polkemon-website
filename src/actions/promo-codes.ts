"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function getPromoCodes() {
  await requireAdmin();
  const promoCodes = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return promoCodes;
}

export async function createPromoCode(data: {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderCents: number | null;
  maxUses: number | null;
  isActive: boolean;
  expiresAt: string | null;
}) {
  await requireAdmin();

  const code = data.code.trim().toUpperCase();

  if (!code) {
    return { success: false, error: "Code is required" };
  }

  if (!["percentage", "fixed"].includes(data.discountType)) {
    return { success: false, error: "Invalid discount type" };
  }

  if (data.discountValue <= 0) {
    return { success: false, error: "Discount value must be greater than 0" };
  }

  if (data.discountType === "percentage" && data.discountValue > 100) {
    return { success: false, error: "Percentage cannot exceed 100" };
  }

  // Check uniqueness
  const existing = await db.promoCode.findUnique({ where: { code } });
  if (existing) {
    return { success: false, error: "A promo code with this code already exists" };
  }

  await db.promoCode.create({
    data: {
      code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderCents: data.minOrderCents,
      maxUses: data.maxUses,
      isActive: data.isActive,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  revalidatePath("/admin/promo-codes");
  return { success: true };
}

export async function updatePromoCode(
  id: string,
  data: {
    code: string;
    discountType: string;
    discountValue: number;
    minOrderCents: number | null;
    maxUses: number | null;
    isActive: boolean;
    expiresAt: string | null;
  }
) {
  await requireAdmin();

  const code = data.code.trim().toUpperCase();

  if (!code) {
    return { success: false, error: "Code is required" };
  }

  if (!["percentage", "fixed"].includes(data.discountType)) {
    return { success: false, error: "Invalid discount type" };
  }

  if (data.discountValue <= 0) {
    return { success: false, error: "Discount value must be greater than 0" };
  }

  if (data.discountType === "percentage" && data.discountValue > 100) {
    return { success: false, error: "Percentage cannot exceed 100" };
  }

  // Check uniqueness (excluding current record)
  const existing = await db.promoCode.findFirst({
    where: { code, NOT: { id } },
  });
  if (existing) {
    return { success: false, error: "A promo code with this code already exists" };
  }

  await db.promoCode.update({
    where: { id },
    data: {
      code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderCents: data.minOrderCents,
      maxUses: data.maxUses,
      isActive: data.isActive,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  revalidatePath("/admin/promo-codes");
  return { success: true };
}

export async function deletePromoCode(id: string) {
  await requireAdmin();
  await db.promoCode.delete({ where: { id } });
  revalidatePath("/admin/promo-codes");
  return { success: true };
}

export async function togglePromoCode(id: string) {
  await requireAdmin();
  const promoCode = await db.promoCode.findUnique({ where: { id } });
  if (!promoCode) return { success: false, error: "Promo code not found" };

  await db.promoCode.update({
    where: { id },
    data: { isActive: !promoCode.isActive },
  });

  revalidatePath("/admin/promo-codes");
  return { success: true };
}
