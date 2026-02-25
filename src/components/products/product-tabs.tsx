"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProductTabsProps {
  description: string;
}

const TABS = [
  { id: "description", label: "Description" },
  { id: "shipping", label: "Shipping" },
  { id: "returns", label: "Returns" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProductTabs({ description }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  return (
    <div className="mt-10 border-t border-border pt-8">
      {/* Tab headers */}
      <div className="flex gap-6 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "pb-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {activeTab === "description" && (
          <div className="space-y-4">
            <p>{description}</p>
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="space-y-4">
            <p>
              We ship within <strong className="text-foreground">1-2 business days</strong> of
              receiving your order. All items are carefully packaged to ensure
              they arrive in perfect condition.
            </p>
            <div className="rounded-lg border border-border p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 font-semibold text-foreground">Method</th>
                    <th className="pb-2 font-semibold text-foreground">Delivery</th>
                    <th className="pb-2 font-semibold text-foreground">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2">Standard</td>
                    <td className="py-2">5-7 business days</td>
                    <td className="py-2">$4.99</td>
                  </tr>
                  <tr>
                    <td className="py-2">Priority</td>
                    <td className="py-2">2-3 business days</td>
                    <td className="py-2">$9.99</td>
                  </tr>
                  <tr>
                    <td className="py-2">Express</td>
                    <td className="py-2">1-2 business days</td>
                    <td className="py-2">$14.99</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <strong className="text-foreground">Free shipping</strong> on orders
              over $75! See our full{" "}
              <Link href="/shipping" className="font-medium text-foreground underline">
                shipping policy
              </Link>{" "}
              for more details.
            </p>
          </div>
        )}

        {activeTab === "returns" && (
          <div className="space-y-4">
            <p>
              We accept returns within <strong className="text-foreground">14 days</strong> of
              delivery for sealed products in their original condition.
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Items must be factory sealed and unopened</li>
              <li>Proof of purchase required (order confirmation email)</li>
              <li>Return shipping is the responsibility of the customer</li>
              <li>Refunds processed within 3-5 business days after receipt</li>
            </ul>
            <p>
              <strong className="text-foreground">Note:</strong> Opened trading card
              products, single cards, and gift cards cannot be returned.
            </p>
            <p>
              See our full{" "}
              <Link href="/returns" className="font-medium text-foreground underline">
                return policy
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="font-medium text-foreground underline">
                contact us
              </Link>{" "}
              to initiate a return.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
