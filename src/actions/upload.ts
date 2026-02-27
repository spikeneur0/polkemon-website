"use server";

import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadImage(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." };
  if (file.size > MAX_SIZE) return { error: "File too large. Maximum size is 10MB." };

  const blob = await put(file.name, file, {
    access: "public",
  });

  return { url: blob.url };
}

export async function deleteImage(url: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  await del(url);
  return { success: true };
}
