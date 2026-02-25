"use client";

import { useState } from "react";
import { subscribe } from "@/actions/subscribe";

export function NewsletterSignup() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const result = await subscribe(formData);

    if (result.success) {
      setStatus("success");
      setMessage("Thanks for subscribing!");
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus("error");
      setMessage(result.error || "Something went wrong");
    }

    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
      <input
        type="email"
        name="email"
        required
        placeholder="your@email.com"
        className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Subscribe"}
      </button>
      {message && (
        <p
          className={`absolute mt-12 text-sm ${
            status === "success" ? "text-green-600" : "text-destructive"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
