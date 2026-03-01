import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribeLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit: 3 per IP per hour
    const ip = getClientIp(req);
    const { limited } = subscribeLimiter.check(ip);
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

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
