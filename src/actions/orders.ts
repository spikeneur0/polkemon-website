"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await db.order.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}

export async function updateTrackingNumber(id: string, trackingNumber: string) {
  await db.order.update({
    where: { id },
    data: { trackingNumber },
  });

  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}

export async function addOrderNote(id: string, notes: string) {
  await db.order.update({
    where: { id },
    data: { notes },
  });

  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}
