import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalRevenue, totalOrders, totalProducts, totalSubscribers, recentOrders] =
    await Promise.all([
      db.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalCents: true },
      }),
      db.order.count(),
      db.product.count(),
      db.subscriber.count(),
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
    ]);

  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(totalRevenue._sum.totalCents || 0),
      icon: DollarSign,
    },
    { label: "Total Orders", value: totalOrders.toString(), icon: ShoppingCart },
    { label: "Total Products", value: totalProducts.toString(), icon: Package },
    { label: "Subscribers", value: totalSubscribers.toString(), icon: Users },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Payment</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-accent px-2 py-0.5 text-xs font-medium">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-800"
                            : order.paymentStatus === "REFUNDED"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatPrice(order.totalCents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
