import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MessageStatus = "unread" | "read";

const ALLOWED_FILTERS = ["unread", "read", "all"] as const;
type MessageFilter = (typeof ALLOWED_FILTERS)[number];

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status") ?? "unread";
  const status: MessageFilter = ALLOWED_FILTERS.includes(
    rawStatus as MessageFilter,
  )
    ? (rawStatus as MessageFilter)
    : "unread";

  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 20), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const adminClient = createSupabaseAdminClient();
  let query = adminClient
    .from("messages")
    .select(
      "id, user_id, sender_name, sender_email, subject, status, created_at, read_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") {
    query = query.eq("status", status as MessageStatus);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(Math.ceil((count ?? 0) / limit), 1),
    },
    filter: status,
  });
}
