import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthUsersByIds } from "@/lib/supabase/admin-users";

type AuditRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 50), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const adminClient = createSupabaseAdminClient();
  const { data, error, count } = await adminClient
    .from("admin_audit_log")
    .select("id, actor_user_id, action, target_user_id, metadata, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as AuditRow[];
  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.actor_user_id, row.target_user_id])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  let emailById: Record<string, string | null> = {};
  if (userIds.length > 0) {
    try {
      const usersById = await getAuthUsersByIds(adminClient, userIds);
      emailById = Object.fromEntries(
        Object.entries(usersById).map(([userId, user]) => [userId, user.email]),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load auth users";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      action: row.action,
      metadata: row.metadata,
      createdAt: row.created_at,
      actor: {
        userId: row.actor_user_id,
        email: row.actor_user_id
          ? (emailById[row.actor_user_id] ?? null)
          : null,
      },
      target: {
        userId: row.target_user_id,
        email: row.target_user_id
          ? (emailById[row.target_user_id] ?? null)
          : null,
      },
    })),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
