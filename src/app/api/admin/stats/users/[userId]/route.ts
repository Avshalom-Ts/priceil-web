import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthUserById } from "@/lib/supabase/admin-users";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApi({ superAdminOnly: true });
  if (!auth.ok) return auth.response;

  const { userId } = await context.params;
  const adminClient = createSupabaseAdminClient();

  let user;
  try {
    user = await getAuthUserById(adminClient, userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load auth user";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [
    planResult,
    statusResult,
    usageHistoryResult,
    appCountResult,
    activeKeysCountResult,
    lastActivityResult,
  ] = await Promise.all([
    adminClient
      .from("user_plans")
      .select("plan, monthly_limit")
      .eq("user_id", userId)
      .maybeSingle(),

    adminClient
      .from("user_access_state")
      .select("status, reason, changed_at")
      .eq("user_id", userId)
      .maybeSingle(),

    adminClient
      .from("api_usage_monthly")
      .select("year_month, request_count")
      .eq("user_id", userId)
      .order("year_month", { ascending: false })
      .limit(12),

    adminClient
      .from("registered_apps")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    adminClient
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true),

    adminClient
      .from("api_keys")
      .select("last_used_at")
      .eq("user_id", userId)
      .not("last_used_at", "is", null)
      .order("last_used_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const error =
    planResult.error ||
    statusResult.error ||
    usageHistoryResult.error ||
    appCountResult.error ||
    activeKeysCountResult.error ||
    lastActivityResult.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user,
    role: auth.data.role,
    plan: planResult.data,
    accessState: statusResult.data ?? {
      status: "active",
      reason: null,
      changed_at: null,
    },
    stats: {
      appCount: appCountResult.count ?? 0,
      activeKeysCount: activeKeysCountResult.count ?? 0,
      lastActivityAt: lastActivityResult.data?.last_used_at ?? null,
      usageHistory: usageHistoryResult.data ?? [],
    },
  });
}
