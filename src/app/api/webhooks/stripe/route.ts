import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { sendOrderConfirmation } from "@/lib/email";
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

    let productData: {
      productId: string;
      name: string;
      sku: string | null;
      price: number;
      quantity: number;
    }[] = [];
    try {
      const parsed = JSON.parse(session.metadata?.productData || "[]");
      if (Array.isArray(parsed)) {
        productData = parsed;
      } else {
        console.error("Invalid productData format in Stripe metadata");
      }
    } catch (parseError) {
      console.error("Failed to parse productData from Stripe metadata:", parseError);
      // Don't fail the webhook — log the error but still mark payment as received
      // The order may need manual correction
    }

    // Stripe returns shipping_details on the session object but the SDK types
    // nest it under collected_information. Use a typed assertion for the raw response.
    const sessionData = session as Stripe.Checkout.Session & {
      shipping_details?: {
        name?: string;
        address?: {
          line1?: string;
          line2?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
        };
      };
    };
    const shippingDetails = sessionData.shipping_details;
    const customerDetails = sessionData.customer_details;

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

    // Read promo code info from session metadata (set by checkout route)
    const promoCode = session.metadata?.promoCode || null;
    const discountCents = parseInt(session.metadata?.discountCents || "0", 10);

    // Use transaction to ensure order creation and inventory decrement are atomic
    const order = await db.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          status: "CONFIRMED",
          customerEmail: customerDetails?.email || "",
          customerName: shippingDetails?.name || customerDetails?.name || "",
          shippingAddress,
          subtotalCents,
          discountCents,
          promoCode,
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

      // Decrement inventory atomically within the same transaction
      for (const item of productData) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      return createdOrder;
    });

    // Send order confirmation email (non-blocking, don't fail the webhook)
    try {
      await sendOrderConfirmation({
        orderNumber: order.orderNumber,
        customerName: shippingDetails?.name || customerDetails?.name || "",
        customerEmail: customerDetails?.email || "",
        items: productData.map((item) => ({
          productName: item.name,
          quantity: item.quantity,
          priceCents: item.price,
        })),
        subtotalCents,
        totalCents: session.amount_total || subtotalCents,
        shippingAddress,
      });
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
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
