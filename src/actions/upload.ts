"use server";

import { put, del } from "@vercel/blob";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const blob = await put(file.name, file, {
    access: "public",
  });

  return { url: blob.url };
}

export async function deleteImage(url: string) {
  await del(url);
  return { success: true };
}
