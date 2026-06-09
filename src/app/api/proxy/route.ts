import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.priceil.dev";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "/";
  const qs = searchParams.get("qs") ?? "";

  const upstream = `${API_BASE}${path}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(upstream, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reach upstream API",
        statusCode: 502,
      },
      { status: 502 },
    );
  }
}
