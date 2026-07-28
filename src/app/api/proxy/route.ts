import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.priceil.dev";
const API_KEY = process.env.PRICEIL_APP_API_KEY;

function buildUpstream(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "/";
  const qs = searchParams.get("qs") ?? "";
  return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (API_KEY) headers["x-api-key"] = API_KEY;
  return headers;
}

async function parseUpstreamBody(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function GET(req: NextRequest) {
  const upstream = buildUpstream(req);

  try {
    const res = await fetch(upstream, {
      headers: buildHeaders(),
      cache: "no-store",
    });
    const body = await parseUpstreamBody(res);
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

export async function POST(req: NextRequest) {
  const upstream = buildUpstream(req);

  try {
    const payload = await req.json();
    const upstreamBody = payload?.body ?? {};

    const res = await fetch(upstream, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(upstreamBody),
      cache: "no-store",
    });

    const body = await parseUpstreamBody(res);
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
