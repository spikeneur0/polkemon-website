import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body as {
      items: { productId: string; quantity: number }[];
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Fetch products from DB (never trust client prices)
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isPublished: true },
    });

    // Validate all products exist and none are sold out
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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      metadata: {
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
      },
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
