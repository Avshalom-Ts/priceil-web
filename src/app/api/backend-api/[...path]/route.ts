import { NextRequest, NextResponse } from "next/server";

const API_TARGET = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://priceil.dev")
).replace(/\/$/, "");

const API_KEY = process.env.PRICEIL_APP_API_KEY;

async function forward(req: NextRequest, path: string[]) {
  const upstream = new URL(`${API_TARGET}/${path.join("/")}`);
  upstream.search = req.nextUrl.search;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (API_KEY) headers["x-api-key"] = API_KEY;

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method === "POST") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(upstream, init);
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forward(req, path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forward(req, path);
}
