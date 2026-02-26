"use server";

import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priceStr = formData.get("price") as string;
  const compareAtStr = formData.get("compareAtPrice") as string;
  const category = formData.get("category") as string;
  const sku = formData.get("sku") as string;
  const quantityStr = formData.get("quantity") as string;
  const tagsStr = formData.get("tags") as string;
  const imagesStr = formData.get("images") as string;

  const price = Math.round(parseFloat(priceStr) * 100);
  const compareAtPrice = compareAtStr
    ? Math.round(parseFloat(compareAtStr) * 100)
    : null;
  const quantity = parseInt(quantityStr) || 0;
  const tags = tagsStr
    ? tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const images = imagesStr ? JSON.parse(imagesStr) : [];

  let slug = slugify(name);
  const existingSlug = await db.product.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const product = await db.product.create({
    data: {
      name,
      slug,
      description,
      price,
      compareAtPrice,
      category,
      sku: sku || null,
      quantity,
      tags,
      images,
    },
  });

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/");

  return { success: true, productId: product.id };
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priceStr = formData.get("price") as string;
  const compareAtStr = formData.get("compareAtPrice") as string;
  const category = formData.get("category") as string;
  const sku = formData.get("sku") as string;
  const quantityStr = formData.get("quantity") as string;
  const tagsStr = formData.get("tags") as string;
  const imagesStr = formData.get("images") as string;
  const isSoldOut = formData.get("isSoldOut") === "true";
  const isPublished = formData.get("isPublished") === "true";

  const price = Math.round(parseFloat(priceStr) * 100);
  const compareAtPrice = compareAtStr
    ? Math.round(parseFloat(compareAtStr) * 100)
    : null;
  const quantity = parseInt(quantityStr) || 0;
  const tags = tagsStr
    ? tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const images = imagesStr ? JSON.parse(imagesStr) : [];

  // Check if market pricing is active — don't overwrite the synced price
  const existing = await db.product.findUnique({
    where: { id },
    select: { marketPriceEnabled: true },
  });

  const priceData = existing?.marketPriceEnabled
    ? { manualPrice: price } // Save as fallback only
    : { price }; // Normal: set product.price directly

  await db.product.update({
    where: { id },
    data: {
      name,
      description,
      ...priceData,
      compareAtPrice,
      category,
      sku: sku || null,
      quantity,
      tags,
      images,
      isSoldOut,
      isPublished,
    },
  });

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/");

  return { success: true };
}

export async function deleteProduct(id: string) {
  await db.product.delete({ where: { id } });
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

export async function toggleSoldOut(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { success: false };

  await db.product.update({
    where: { id },
    data: { isSoldOut: !product.isSoldOut },
  });

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

export async function togglePublished(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { success: false };

  await db.product.update({
    where: { id },
    data: { isPublished: !product.isPublished },
  });

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}
