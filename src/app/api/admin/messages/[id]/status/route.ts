import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type StatusBody = {
  status?: "read" | "unread";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let body: StatusBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextStatus = body.status;
  if (nextStatus !== "read" && nextStatus !== "unread") {
    return NextResponse.json(
      { error: "status must be either 'read' or 'unread'" },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const adminClient = createSupabaseAdminClient();

  const updates =
    nextStatus === "read"
      ? {
          status: "read" as const,
          read_at: new Date().toISOString(),
          read_by: auth.data.user.id,
        }
      : {
          status: "unread" as const,
          read_at: null,
          read_by: null,
        };

  const { data, error } = await adminClient
    .from("messages")
    .update(updates)
    .eq("id", id)
    .select("id, status, read_at, read_by, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}
