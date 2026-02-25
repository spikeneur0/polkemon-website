import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Prevent duplicate orders
    const existingOrder = await db.order.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (existingOrder) {
      return NextResponse.json({ received: true });
    }

    const productData = JSON.parse(session.metadata?.productData || "[]") as {
      productId: string;
      name: string;
      sku: string | null;
      price: number;
      quantity: number;
    }[];

    const shippingDetails = session.shipping_details;
    const customerDetails = session.customer_details;

    const shippingAddress = shippingDetails?.address
      ? {
          line1: shippingDetails.address.line1 || "",
          line2: shippingDetails.address.line2 || "",
          city: shippingDetails.address.city || "",
          state: shippingDetails.address.state || "",
          zip: shippingDetails.address.postal_code || "",
          country: shippingDetails.address.country || "US",
        }
      : { line1: "", city: "", state: "", zip: "", country: "US" };

    const subtotalCents = productData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: "CONFIRMED",
        customerEmail: customerDetails?.email || "",
        customerName: shippingDetails?.name || customerDetails?.name || "",
        shippingAddress,
        subtotalCents,
        totalCents: session.amount_total || subtotalCents,
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent as string,
        paymentStatus: "PAID",
        items: {
          create: productData.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productSku: item.sku,
            quantity: item.quantity,
            priceCents: item.price,
          })),
        },
      },
    });

    // Decrement inventory
    for (const item of productData) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          quantity: { decrement: item.quantity },
        },
      });
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    if (charge.payment_intent) {
      await db.order.updateMany({
        where: { stripePaymentId: charge.payment_intent as string },
        data: { paymentStatus: "REFUNDED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
