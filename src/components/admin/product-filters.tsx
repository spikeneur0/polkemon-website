"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

export function CategoryFilter({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("category", e.target.value);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`/admin/products?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">All Categories</option>
      {CATEGORIES.map((cat) => (
        <option key={cat.slug} value={cat.slug}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}

export function StatusFilter({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("status", e.target.value);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`/admin/products?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">All Status</option>
      <option value="published">Published</option>
      <option value="draft">Draft</option>
      <option value="soldout">Sold Out</option>
      <option value="market">Market Priced</option>
    </select>
  );
}
