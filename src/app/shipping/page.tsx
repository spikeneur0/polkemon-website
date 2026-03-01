import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_NAME, BUSINESS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: `Shipping policies and delivery information for ${SITE_NAME}. Fast shipping across the United States.`,
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Shipping Information</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">
        Shipping Information
      </h1>
      <p className="mt-3 text-muted-foreground">
        Everything you need to know about our shipping process.
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Domestic Shipping</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We currently ship to all 50 US states. Orders are processed within
              1-2 business days and shipped via USPS or UPS depending on the
              package size.
            </p>
            <div className="rounded-lg border border-border p-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-foreground">
                    <th className="pb-2 font-semibold">Method</th>
                    <th className="pb-2 font-semibold">Estimated Delivery</th>
                    <th className="pb-2 font-semibold">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2">Standard Shipping</td>
                    <td className="py-2">5-7 business days</td>
                    <td className="py-2">$4.99</td>
                  </tr>
                  <tr>
                    <td className="py-2">Priority Shipping</td>
                    <td className="py-2">2-3 business days</td>
                    <td className="py-2">$9.99</td>
                  </tr>
                  <tr>
                    <td className="py-2">Express Shipping</td>
                    <td className="py-2">1-2 business days</td>
                    <td className="py-2">$14.99</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <strong className="text-foreground">Free shipping</strong> on all
              orders over {BUSINESS.freeShippingThresholdDisplay}!
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Order Processing</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Orders placed before 2:00 PM EST on business days are typically
              processed the same day. Orders placed after 2:00 PM EST or on
              weekends/holidays will be processed the next business day.
            </p>
            <p>
              You will receive a confirmation email with tracking information
              once your order has shipped.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Packaging</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              All trading card products are carefully packaged to ensure they
              arrive in perfect condition. Booster boxes and ETBs are wrapped in
              bubble wrap and shipped in sturdy corrugated boxes. Single cards
              and smaller items are shipped in padded mailers with top loaders
              for protection.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">International Shipping</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We currently do not offer international shipping. We are working on
              expanding our shipping options and hope to offer international
              delivery in the near future. Please check back for updates!
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Lost or Damaged Packages</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              If your package arrives damaged or is lost in transit, please{" "}
              <Link href="/contact" className="font-medium text-foreground underline">
                contact us
              </Link>{" "}
              within 7 days of the expected delivery date. We will work with the
              carrier to resolve the issue and ensure you receive your order.
            </p>
          </div>
        </section>

        <div className="rounded-lg border border-border bg-accent/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Have questions about shipping?{" "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline"
            >
              Contact us
            </Link>{" "}
            and we&apos;ll be happy to help.
          </p>
        </div>
      </div>
    </div>
  );
}
