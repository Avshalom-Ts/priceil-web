import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  findAuthUserByEmail,
  getAuthUsersByIds,
} from "@/lib/supabase/admin-users";

type AdminRow = {
  user_id: string;
  role: "admin" | "super_admin";
  created_at: string;
};

type CreateAdminBody = {
  targetEmail?: string;
  role?: "admin" | "super_admin";
};

type UpdateAdminBody = {
  userId?: string;
  role?: "admin" | "super_admin";
};

type DeleteAdminBody = {
  userId?: string;
};

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const adminClient = createSupabaseAdminClient();
  const { data: admins, error } = await adminClient
    .from("admin_users")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const adminRows = (admins ?? []) as AdminRow[];
  const userIds = adminRows.map((row) => row.user_id);

  let userById: Record<string, string | null> = {};
  if (userIds.length > 0) {
    try {
      const usersById = await getAuthUsersByIds(adminClient, userIds);
      userById = Object.fromEntries(
        Object.entries(usersById).map(([userId, user]) => [userId, user.email]),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load auth users";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    items: adminRows.map((row) => ({
      userId: row.user_id,
      email: userById[row.user_id] ?? null,
      role: row.role,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi({ superAdminOnly: true });
  if (!auth.ok) return auth.response;

  let body: CreateAdminBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetEmail = body.targetEmail?.trim().toLowerCase();
  const role = body.role === "super_admin" ? "super_admin" : "admin";

  if (!targetEmail) {
    return NextResponse.json(
      { error: "targetEmail is required" },
      { status: 400 },
    );
  }

  const adminClient = createSupabaseAdminClient();

  let targetUser;
  try {
    targetUser = await findAuthUserByEmail(adminClient, targetEmail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load auth users";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!targetUser) {
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 },
    );
  }

  const { error: upsertError } = await adminClient.from("admin_users").upsert(
    {
      user_id: targetUser.id,
      role,
      created_by: auth.data.user.id,
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
      action: "admin_set_admin_role",
      target_user_id: targetUser.id,
      metadata: {
        role,
        targetEmail,
      },
    });

  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      item: {
        userId: targetUser.id,
        email: targetUser.email,
        role,
      },
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi({ superAdminOnly: true });
  if (!auth.ok) return auth.response;

  let body: UpdateAdminBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (body.role !== "admin" && body.role !== "super_admin") {
    return NextResponse.json(
      { error: "role must be admin or super_admin" },
      { status: 400 },
    );
  }

  const adminClient = createSupabaseAdminClient();
  const { error: updateError } = await adminClient
    .from("admin_users")
    .update({ role: body.role })
    .eq("user_id", body.userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const { error: auditError } = await adminClient
    .from("admin_audit_log")
    .insert({
      actor_user_id: auth.data.user.id,
      action: "admin_update_admin_role",
      target_user_id: body.userId,
      metadata: {
        role: body.role,
      },
    });

  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi({ superAdminOnly: true });
  if (!auth.ok) return auth.response;

  let body: DeleteAdminBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();

  const { error: deleteError } = await adminClient
    .from("admin_users")
    .delete()
    .eq("user_id", body.userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  const { error: auditError } = await adminClient
    .from("admin_audit_log")
    .insert({
      actor_user_id: auth.data.user.id,
      action: "admin_remove_admin_role",
      target_user_id: body.userId,
      metadata: {},
    });

  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
