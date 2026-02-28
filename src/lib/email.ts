import { Resend } from "resend";
import OrderConfirmationEmail from "@/emails/order-confirmation";
import ContactNotificationEmail from "@/emails/contact-notification";

// Lazy init so build doesn't fail when RESEND_API_KEY isn't available
let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendOrderConfirmation(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { productName: string; quantity: number; priceCents: number }[];
  subtotalCents: number;
  totalCents: number;
  shippingAddress: { line1: string; city: string; state: string; zip: string };
}) {
  const { data, error } = await getResend().emails.send({
    from: "Polkemon Trading Co <orders@polkemontradingco.com>",
    to: order.customerEmail,
    subject: `Order Confirmed — ${order.orderNumber}`,
    react: OrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items,
      subtotalCents: order.subtotalCents,
      totalCents: order.totalCents,
      shippingAddress: order.shippingAddress,
    }),
  });

  if (error) {
    throw new Error(`Failed to send order confirmation: ${error.message}`);
  }

  return data;
}

export async function sendContactNotification(message: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: "Polkemon Trading Co <noreply@polkemontradingco.com>",
    to: "hello@polkemontradingco.com",
    replyTo: message.email,
    subject: `Contact Form: ${message.subject}`,
    react: ContactNotificationEmail({
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
    }),
  });

  if (error) {
    throw new Error(`Failed to send contact notification: ${error.message}`);
  }

  return data;
}
