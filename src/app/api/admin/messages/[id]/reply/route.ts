import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ReplyBody = {
  replyContent?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let body: ReplyBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const replyContent = body.replyContent?.trim();
  if (!replyContent) {
    return NextResponse.json(
      { error: "replyContent is required" },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("messages")
    .update({
      reply_content: replyContent,
      replied_at: new Date().toISOString(),
      replied_by: auth.data.user.id,
      status: "read",
      read_at: new Date().toISOString(),
      read_by: auth.data.user.id,
    })
    .eq("id", id)
    .select(
      "id, reply_content, replied_at, replied_by, status, read_at, read_by, updated_at",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}
