import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { CartClearer } from "./cart-clearer";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/cart");
  }

  let verified = false;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    verified = session.payment_status === "paid";
  } catch {
    // Invalid session ID
    verified = false;
  }

  if (!verified) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6">
        <AlertTriangle className="h-16 w-16 text-yellow-600" />
        <h1 className="mt-6 text-2xl font-bold">Payment Not Verified</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn&apos;t verify your payment. If you believe this is an error,
          please contact us.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/cart"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6">
      <CartClearer />
      <CheckCircle className="h-16 w-16 text-green-600" />
      <h1 className="mt-6 text-2xl font-bold">Thank you for your order!</h1>
      <p className="mt-3 text-muted-foreground">
        Your payment was successful. You&apos;ll receive a confirmation email
        shortly with your order details.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/products"
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
