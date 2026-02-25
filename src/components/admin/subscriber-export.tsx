"use client";

interface Props {
  subscribers: { email: string; date: string }[];
}

export function SubscriberExport({ subscribers }: Props) {
  function handleExport() {
    const csv = [
      "Email,Date",
      ...subscribers.map(
        (s) => `${s.email},${new Date(s.date).toLocaleDateString()}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
    >
      Export CSV
    </button>
  );
}
