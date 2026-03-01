import { Mail, MapPin, Clock } from "lucide-react";
import { SITE_NAME, BUSINESS } from "@/lib/constants";
import { ContactForm } from "@/components/contact/contact-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Polkemon Trading Co. We're here to help with orders, questions, and wholesale inquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Have a question or need help? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {/* Contact Form */}
        <ContactForm />

        {/* Contact Info */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Email</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              For general inquiries and customer support:
            </p>
            <a
              href={`mailto:${BUSINESS.email.support}`}
              className="mt-1 text-sm font-medium hover:underline"
            >
              {BUSINESS.email.support}
            </a>
          </div>

          <div className="rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Location</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {SITE_NAME}
              <br />
              {BUSINESS.address.line1}
              <br />
              {BUSINESS.address.city}, {BUSINESS.address.state} {BUSINESS.address.zip}
              <br />
              {BUSINESS.address.country}
            </p>
          </div>

          <div className="rounded-lg border border-border p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Business Hours</h3>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>Monday - Friday: 9am - 6pm EST</p>
              <p>Saturday: 10am - 4pm EST</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-accent/30 p-6">
            <h3 className="font-semibold">Wholesale Inquiries</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Interested in becoming a distribution partner? We&apos;d love to
              work with you. Select &quot;Wholesale / Distribution&quot; in the contact
              form or email us directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
