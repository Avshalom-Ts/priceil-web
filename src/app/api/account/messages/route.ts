import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MessageRow = {
  id: string;
  subject: string;
  content: string;
  status: "unread" | "read";
  created_at: string;
  updated_at: string;
  read_at: string | null;
  reply_content: string | null;
  replied_at: string | null;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 50), 100);

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, subject, content, status, created_at, updated_at, read_at, reply_content, replied_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []) as MessageRow[],
  });
}
