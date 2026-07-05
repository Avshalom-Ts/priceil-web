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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, subject, content, status, created_at, updated_at, read_at, reply_content, replied_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ item: data as MessageRow });
}
