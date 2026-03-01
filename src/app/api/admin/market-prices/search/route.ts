import { NextResponse } from "next/server";
import { searchCards } from "@/lib/services/justTcg";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ data: [], meta: {} });
  }

  if (!process.env.JUSTTCG_API_KEY) {
    return NextResponse.json(
      { error: "JUSTTCG_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const results = await searchCards(q.trim());
    return NextResponse.json(results, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("Card search error:", err);
    return NextResponse.json(
      { error: "Failed to search cards" },
      { status: 500 }
    );
  }
}
