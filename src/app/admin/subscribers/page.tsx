import { db } from "@/lib/db";
import { SubscriberExport } from "@/components/admin/subscriber-export";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const subscribers = await db.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {subscribers.length} total subscribers
          </p>
        </div>
        <SubscriberExport subscribers={subscribers.map((s) => ({ email: s.email, date: s.createdAt.toISOString() }))} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No subscribers yet
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">{sub.email}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
