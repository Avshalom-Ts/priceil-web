import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const adminClient = createSupabaseAdminClient();
  const yearMonth = currentYearMonth();

  const [
    totalUsersResult,
    blockedUsersResult,
    deletedUsersResult,
    monthlyUsageResult,
    plansResult,
  ] = await Promise.all([
    adminClient
      .from("user_plans")
      .select("user_id", { count: "exact", head: true }),

    adminClient
      .from("user_access_state")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "blocked"),

    adminClient
      .from("user_access_state")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "deleted_soft"),

    adminClient
      .from("api_usage_monthly")
      .select("request_count")
      .eq("year_month", yearMonth),

    adminClient.from("user_plans").select("plan"),
  ]);

  const error =
    totalUsersResult.error ||
    blockedUsersResult.error ||
    deletedUsersResult.error ||
    monthlyUsageResult.error ||
    plansResult.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalUsers = totalUsersResult.count ?? 0;
  const blockedUsers = blockedUsersResult.count ?? 0;
  const deletedUsers = deletedUsersResult.count ?? 0;
  const activeUsers = Math.max(totalUsers - blockedUsers - deletedUsers, 0);

  const totalRequestsThisMonth = (monthlyUsageResult.data ?? []).reduce(
    (acc, row) => acc + (row.request_count ?? 0),
    0,
  );

  const planDistribution = (plansResult.data ?? []).reduce(
    (acc, row) => {
      const key = row.plan ?? "free";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return NextResponse.json({
    role: auth.data.role,
    metrics: {
      totalUsers,
      activeUsers,
      blockedUsers,
      deletedUsers,
      totalRequestsThisMonth,
      planDistribution,
    },
  });
}
