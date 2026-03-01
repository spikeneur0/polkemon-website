import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_NAME, BUSINESS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return Policy",
  description: `Return and refund policy for ${SITE_NAME}. Learn about our hassle-free return process.`,
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Return Policy</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">Return Policy</h1>
      <p className="mt-3 text-muted-foreground">
        We want you to be completely satisfied with your purchase.
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Return Eligibility</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We accept returns within <strong className="text-foreground">{BUSINESS.returnWindowDays} days</strong> of
              delivery for sealed products in their original, unopened condition.
              To be eligible for a return, the item must be:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>In its original, factory-sealed packaging</li>
              <li>Unopened and undamaged</li>
              <li>Accompanied by proof of purchase (order confirmation email)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Non-Returnable Items</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>The following items cannot be returned:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Opened or unsealed trading card products (booster packs, boxes, etc.)</li>
              <li>Single cards and graded cards</li>
              <li>Gift cards</li>
              <li>Items marked as final sale</li>
              <li>Products with visible damage caused by the customer</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How to Initiate a Return</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <ol className="ml-4 list-decimal space-y-2">
              <li>
                <Link href="/contact" className="font-medium text-foreground underline">
                  Contact us
                </Link>{" "}
                with your order number and reason for the return.
              </li>
              <li>
                Our team will review your request and provide a return
                authorization number (RMA) and shipping instructions.
              </li>
              <li>
                Ship the item back to us using a trackable shipping method at:
                <br />
                <strong className="text-foreground">
                  {SITE_NAME}, {BUSINESS.address.full}
                </strong>
                <br />
                Return shipping costs are the responsibility of the customer
                unless the return is due to our error.
              </li>
              <li>
                Once we receive and inspect the returned item, we will process
                your refund within 3-5 business days.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Refunds</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Refunds will be issued to the original payment method. Please allow
              5-10 business days for the refund to appear on your statement after
              it has been processed.
            </p>
            <p>
              Original shipping costs are non-refundable unless the return is due
              to a defective product or an error on our part.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Damaged or Defective Items</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              If you receive a damaged or defective item, please{" "}
              <Link href="/contact" className="font-medium text-foreground underline">
                contact us
              </Link>{" "}
              within 48 hours of delivery with photos of the damage. We will
              arrange a replacement or full refund at no additional cost to you.
            </p>
          </div>
        </section>

        <div className="rounded-lg border border-border bg-accent/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need to start a return?{" "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline"
            >
              Contact our support team
            </Link>{" "}
            and we&apos;ll guide you through the process.
          </p>
        </div>
      </div>
    </div>
  );
}
