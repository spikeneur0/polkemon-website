import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, promoCode } = body as {
      items: { productId: string; quantity: number }[];
      promoCode?: string | null;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Fetch products from DB (never trust client prices)
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isPublished: true },
    });

    // Validate all products exist, none are sold out, and have enough stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (product.isSoldOut) {
        return NextResponse.json(
          { error: `Product is sold out: ${product.name}` },
          { status: 400 }
        );
      }
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Not enough stock for ${product.name}. Only ${product.quantity} available.`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate server-side subtotal
    const subtotalCents = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    // Validate and apply promo code if provided
    let discountCents = 0;
    let validatedPromoCode: string | null = null;
    let stripeCouponId: string | null = null;

    if (promoCode && typeof promoCode === "string") {
      const promo = await db.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });

      if (!promo) {
        return NextResponse.json(
          { error: "Invalid promo code" },
          { status: 400 }
        );
      }

      if (!promo.isActive) {
        return NextResponse.json(
          { error: "This promo code is no longer active" },
          { status: 400 }
        );
      }

      if (promo.expiresAt && new Date() > promo.expiresAt) {
        return NextResponse.json(
          { error: "This promo code has expired" },
          { status: 400 }
        );
      }

      if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
        return NextResponse.json(
          { error: "This promo code has reached its usage limit" },
          { status: 400 }
        );
      }

      if (promo.minOrderCents !== null && subtotalCents < promo.minOrderCents) {
        const minOrder = (promo.minOrderCents / 100).toFixed(2);
        return NextResponse.json(
          { error: `Minimum order of $${minOrder} required for this code` },
          { status: 400 }
        );
      }

      // Calculate discount
      if (promo.discountType === "percentage") {
        discountCents = Math.round(
          (subtotalCents * promo.discountValue) / 100
        );
      } else {
        discountCents = promo.discountValue;
      }

      // Don't let discount exceed subtotal
      discountCents = Math.min(discountCents, subtotalCents);

      // Create a one-time Stripe coupon
      const coupon = await stripe.coupons.create(
        promo.discountType === "percentage"
          ? {
              percent_off: promo.discountValue,
              duration: "once",
              name: `Promo: ${promo.code}`,
            }
          : {
              amount_off: discountCents,
              currency: "usd",
              duration: "once",
              name: `Promo: ${promo.code}`,
            }
      );

      stripeCouponId = coupon.id;
      validatedPromoCode = promo.code;

      // Increment currentUses
      await db.promoCode.update({
        where: { id: promo.id },
        data: { currentUses: { increment: 1 } },
      });
    }

    // Build Stripe line items from DB prices
    const lineItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: product.images.length > 0 ? [product.images[0]] : [],
            metadata: { productId: product.id },
          },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      };
    });

    // Build session metadata
    const metadata: Stripe.MetadataParam = {
      productData: JSON.stringify(
        items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            quantity: item.quantity,
          };
        })
      ),
    };

    if (validatedPromoCode) {
      metadata.promoCode = validatedPromoCode;
      metadata.discountCents = String(discountCents);
    }

    // Build session create params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      metadata,
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cart`,
    };

    // Apply coupon discount if we created one
    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
