import { Mail, MapPin, Clock } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
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
        <div className="rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold">Send a Message</h2>
          <form className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Subject</label>
              <select className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>General Inquiry</option>
                <option>Order Support</option>
                <option>Wholesale / Distribution</option>
                <option>Returns & Refunds</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Message</label>
              <textarea
                rows={5}
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Send Message
            </button>
          </form>
        </div>

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
              href="mailto:hello@polkemontradingco.com"
              className="mt-1 text-sm font-medium hover:underline"
            >
              hello@polkemontradingco.com
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
              Ann Arbor, MI
              <br />
              United States
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
