import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;

    if (!email) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    await db.subscriber.create({
      data: { email },
    });

    return NextResponse.redirect(new URL("/?subscribed=true", req.url));
  } catch {
    return NextResponse.redirect(new URL("/?subscribed=error", req.url));
  }
}
