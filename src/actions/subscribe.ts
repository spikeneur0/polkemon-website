"use server";

import { db } from "@/lib/db";

export async function subscribe(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required" };

  try {
    await db.subscriber.create({
      data: { email },
    });
    return { success: true };
  } catch {
    // Likely duplicate email
    return { error: "Already subscribed" };
  }
}
