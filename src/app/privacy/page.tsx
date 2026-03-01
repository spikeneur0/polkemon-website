import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_NAME, BUSINESS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE_NAME}. Learn how we collect, use, and protect your personal information.`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Privacy Policy</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-muted-foreground">
        Last updated: February 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            1. Information We Collect
          </h2>
          <div className="mt-3 space-y-3">
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <strong className="text-foreground">Order Information:</strong> Name,
                email address, shipping address, and payment information when
                you make a purchase.
              </li>
              <li>
                <strong className="text-foreground">Account Information:</strong> Email
                address when you sign up for our newsletter.
              </li>
              <li>
                <strong className="text-foreground">Communication Data:</strong> Name,
                email, and message content when you contact us through our
                contact form.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            2. How We Use Your Information
          </h2>
          <div className="mt-3 space-y-3">
            <p>We use the information we collect to:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send promotional emails and newsletters (with your consent)</li>
              <li>Improve our website and product offerings</li>
              <li>Prevent fraud and ensure the security of transactions</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            3. Payment Processing
          </h2>
          <p className="mt-3">
            All payment transactions are processed through Stripe, our
            third-party payment processor. We do not store your full credit card
            number, expiration date, or CVV on our servers. Stripe&apos;s use of
            your personal information is governed by their{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            4. Information Sharing
          </h2>
          <div className="mt-3 space-y-3">
            <p>
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information only in the following
              circumstances:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <strong className="text-foreground">Service Providers:</strong> With
                trusted service providers who assist in operating our website,
                processing payments, and delivering orders (e.g., Stripe, USPS,
                UPS).
              </li>
              <li>
                <strong className="text-foreground">Legal Requirements:</strong> When
                required by law or in response to valid legal processes.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            5. Cookies and Analytics
          </h2>
          <p className="mt-3">
            Our website may use cookies to enhance your browsing experience.
            These are small text files stored on your device that help us
            remember your preferences and understand how you interact with our
            Site. You can control cookie settings through your browser
            preferences.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            6. Data Security
          </h2>
          <p className="mt-3">
            We implement reasonable security measures to protect your personal
            information from unauthorized access, alteration, disclosure, or
            destruction. However, no method of transmission over the internet is
            100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            7. Your Rights
          </h2>
          <div className="mt-3 space-y-3">
            <p>You have the right to:</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Unsubscribe from marketing communications at any time</li>
            </ul>
            <p>
              To exercise any of these rights, please{" "}
              <Link href="/contact" className="font-medium text-foreground underline">
                contact us
              </Link>
              .
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            8. Children&apos;s Privacy
          </h2>
          <p className="mt-3">
            Our Site is not intended for children under the age of 13. We do not
            knowingly collect personal information from children. If you believe
            a child has provided us with personal information, please contact us
            so we can remove it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            9. Changes to This Policy
          </h2>
          <p className="mt-3">
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated effective date. We encourage you
            to review this policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            10. Contact Us
          </h2>
          <p className="mt-3">
            If you have any questions about this Privacy Policy, please{" "}
            <Link href="/contact" className="font-medium text-foreground underline">
              contact us
            </Link>{" "}
            or email us at{" "}
            <a
              href={`mailto:${BUSINESS.email.support}`}
              className="font-medium text-foreground underline"
            >
              {BUSINESS.email.support}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
