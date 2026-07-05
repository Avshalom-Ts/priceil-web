import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthUserById } from "@/lib/supabase/admin-users";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

type UpdateUserStateBody = {
  status?: "active" | "blocked" | "deleted_soft";
  reason?: string | null;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { userId } = await context.params;

  let body: UpdateUserStateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    body.status !== "active" &&
    body.status !== "blocked" &&
    body.status !== "deleted_soft"
  ) {
    return NextResponse.json(
      { error: "status must be active, blocked or deleted_soft" },
      { status: 400 },
    );
  }

  const reason = body.reason?.trim() || null;
  const adminClient = createSupabaseAdminClient();

  let targetUser;
  try {
    targetUser = await getAuthUserById(adminClient, userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load auth user";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error: upsertError } = await adminClient
    .from("user_access_state")
    .upsert(
      {
        user_id: userId,
        status: body.status,
        reason,
        changed_by: auth.data.user.id,
        changed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { error: auditError } = await adminClient
    .from("admin_audit_log")
    .insert({
      actor_user_id: auth.data.user.id,
      action: "admin_update_user_access_state",
      target_user_id: userId,
      metadata: {
        status: body.status,
        reason,
      },
    });

  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      userId,
      status: body.status,
      reason,
      changedAt: new Date().toISOString(),
    },
  });
}
