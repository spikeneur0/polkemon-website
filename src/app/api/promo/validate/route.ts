import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotalCents } = body as {
      code: string;
      subtotalCents: number;
    };

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Promo code is required" },
        { status: 400 }
      );
    }

    if (typeof subtotalCents !== "number" || subtotalCents < 0) {
      return NextResponse.json(
        { valid: false, error: "Invalid subtotal" },
        { status: 400 }
      );
    }

    // Look up code (case-insensitive, stored uppercase in DB)
    const promo = await db.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code" },
        { status: 200 }
      );
    }

    // Check isActive
    if (!promo.isActive) {
      return NextResponse.json(
        { valid: false, error: "This promo code is no longer active" },
        { status: 200 }
      );
    }

    // Check expiresAt hasn't passed
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return NextResponse.json(
        { valid: false, error: "This promo code has expired" },
        { status: 200 }
      );
    }

    // Check maxUses hasn't been reached
    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      return NextResponse.json(
        { valid: false, error: "This promo code has reached its usage limit" },
        { status: 200 }
      );
    }

    // Check minOrderCents
    if (promo.minOrderCents !== null && subtotalCents < promo.minOrderCents) {
      const minOrder = (promo.minOrderCents / 100).toFixed(2);
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order of $${minOrder} required for this code`,
        },
        { status: 200 }
      );
    }

    // Calculate discountCents
    let discountCents: number;
    if (promo.discountType === "percentage") {
      discountCents = Math.round((subtotalCents * promo.discountValue) / 100);
    } else {
      // fixed - discountValue is already in cents
      discountCents = promo.discountValue;
    }

    // Don't let discount exceed subtotal
    discountCents = Math.min(discountCents, subtotalCents);

    // Build a user-friendly message
    const message =
      promo.discountType === "percentage"
        ? `${promo.discountValue}% off applied!`
        : `$${(promo.discountValue / 100).toFixed(2)} off applied!`;

    return NextResponse.json({
      valid: true,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountCents,
      message,
    });
  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
