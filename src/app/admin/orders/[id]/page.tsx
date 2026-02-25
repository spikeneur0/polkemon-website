import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";
import { OrderTrackingForm } from "@/components/admin/order-tracking-form";
import { OrderNotesForm } from "@/components/admin/order-notes-form";
import type { ShippingAddress } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const address = order.shippingAddress as ShippingAddress;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              order.paymentStatus === "PAID"
                ? "bg-green-100 text-green-800"
                : order.paymentStatus === "REFUNDED"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold">Order Items</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium">Product</th>
                    <th className="py-2 text-left font-medium">SKU</th>
                    <th className="py-2 text-center font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Unit Price</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3 font-medium">{item.productName}</td>
                      <td className="py-3 text-muted-foreground">
                        {item.productSku || "—"}
                      </td>
                      <td className="py-3 text-center tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {formatPrice(item.priceCents)}
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums">
                        {formatPrice(item.priceCents * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td colSpan={4} className="py-3 text-right font-medium">
                      Subtotal
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums">
                      {formatPrice(order.subtotalCents)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="py-1 text-right text-sm">
                      Shipping
                    </td>
                    <td className="py-1 text-right text-sm tabular-nums">
                      {formatPrice(order.shippingCents)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="py-1 text-right text-sm">
                      Tax
                    </td>
                    <td className="py-1 text-right text-sm tabular-nums">
                      {formatPrice(order.taxCents)}
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td
                      colSpan={4}
                      className="py-3 text-right text-base font-bold"
                    >
                      Total
                    </td>
                    <td className="py-3 text-right text-base font-bold tabular-nums">
                      {formatPrice(order.totalCents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tracking & Notes */}
          <div className="grid gap-6 sm:grid-cols-2">
            <OrderTrackingForm
              orderId={order.id}
              currentTracking={order.trackingNumber || ""}
            />
            <OrderNotesForm
              orderId={order.id}
              currentNotes={order.notes || ""}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold">Order Status</h3>
            <OrderStatusUpdater
              orderId={order.id}
              currentStatus={order.status}
            />
          </div>

          {/* Customer Info */}
          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold">Customer</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold">Shipping Address</h3>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {address.city}, {address.state} {address.zip}
              </p>
              <p>{address.country}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold">Payment</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{order.paymentStatus}</span>
              </div>
              {order.stripePaymentId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-xs">
                    {order.stripePaymentId.slice(0, 20)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
