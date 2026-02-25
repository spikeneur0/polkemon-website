import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${SITE_NAME}. Read our terms and conditions for using our website and services.`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Terms of Service</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-3 text-muted-foreground">
        Last updated: February 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p className="mt-3">
            By accessing and using the {SITE_NAME} website (&quot;Site&quot;), you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, please do not use our Site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            2. Products and Pricing
          </h2>
          <div className="mt-3 space-y-3">
            <p>
              All prices listed on our Site are in US Dollars (USD) and are
              subject to change without notice. We reserve the right to modify
              or discontinue products at any time.
            </p>
            <p>
              While we make every effort to display accurate product
              descriptions and images, we do not guarantee that descriptions
              are error-free or that images perfectly represent the actual
              product.
            </p>
            <p>
              In the event of a pricing error, we reserve the right to cancel
              any orders placed at the incorrect price and will notify you of
              the cancellation.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            3. Orders and Payment
          </h2>
          <div className="mt-3 space-y-3">
            <p>
              By placing an order, you represent that the information you
              provide is accurate and that you are authorized to use the payment
              method provided.
            </p>
            <p>
              We reserve the right to refuse or cancel any order for any reason,
              including but not limited to: product availability, errors in
              pricing, or suspected fraudulent activity.
            </p>
            <p>
              All payments are processed securely through Stripe. We do not
              store your full credit card information on our servers.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            4. Shipping and Delivery
          </h2>
          <p className="mt-3">
            Shipping times and costs are as described on our{" "}
            <Link href="/shipping" className="font-medium text-foreground underline">
              Shipping Information
            </Link>{" "}
            page. We are not responsible for delays caused by the shipping
            carrier, customs, or other circumstances beyond our control.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            5. Returns and Refunds
          </h2>
          <p className="mt-3">
            Returns and refunds are subject to our{" "}
            <Link href="/returns" className="font-medium text-foreground underline">
              Return Policy
            </Link>
            . Please review the policy before making a purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            6. Intellectual Property
          </h2>
          <p className="mt-3">
            All content on this Site, including text, images, logos, and
            graphics, is the property of {SITE_NAME} or its content suppliers
            and is protected by copyright laws. Trading card product names,
            logos, and images are trademarks of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            7. Limitation of Liability
          </h2>
          <p className="mt-3">
            {SITE_NAME} shall not be liable for any indirect, incidental,
            special, or consequential damages arising out of or in connection
            with the use of our Site or purchase of our products. Our total
            liability for any claim shall not exceed the amount you paid for
            the product giving rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            8. Changes to These Terms
          </h2>
          <p className="mt-3">
            We reserve the right to update or modify these Terms of Service at
            any time. Changes will be posted on this page with an updated
            effective date. Your continued use of the Site after changes are
            posted constitutes your acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            9. Contact Information
          </h2>
          <p className="mt-3">
            If you have any questions about these Terms of Service, please{" "}
            <Link href="/contact" className="font-medium text-foreground underline">
              contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
