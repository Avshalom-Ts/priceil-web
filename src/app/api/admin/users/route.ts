import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthUsersByIds } from "@/lib/supabase/admin-users";

type UserPlanRow = {
  user_id: string;
  plan: string;
  monthly_limit: number;
  updated_at: string;
};

type AccessRow = {
  user_id: string;
  status: "active" | "blocked" | "deleted_soft";
  reason: string | null;
  changed_at: string;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 25), 100);
  const statusFilter = searchParams.get("status");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const adminClient = createSupabaseAdminClient();

  const { data: adminRows, error: adminsError } = await adminClient
    .from("admin_users")
    .select("user_id");

  if (adminsError) {
    return NextResponse.json({ error: adminsError.message }, { status: 500 });
  }

  const adminUserIds = (adminRows ?? []).map((row) => row.user_id as string);

  let plansQuery = adminClient
    .from("user_plans")
    .select("user_id, plan, monthly_limit, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (adminUserIds.length > 0) {
    plansQuery = plansQuery.filter(
      "user_id",
      "not.in",
      `(${adminUserIds.join(",")})`,
    );
  }

  if (
    statusFilter === "active" ||
    statusFilter === "blocked" ||
    statusFilter === "deleted_soft"
  ) {
    const { data: statusRows, error: statusError } = await adminClient
      .from("user_access_state")
      .select("user_id")
      .eq("status", statusFilter);

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    const allowedIds = (statusRows ?? [])
      .map((row) => row.user_id as string)
      .filter((userId) => !adminUserIds.includes(userId));
    if (allowedIds.length === 0) {
      return NextResponse.json({
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    plansQuery = plansQuery.in("user_id", allowedIds);
  }

  const { data: planRows, error: plansError, count } = await plansQuery;

  if (plansError) {
    return NextResponse.json({ error: plansError.message }, { status: 500 });
  }

  const plans = (planRows ?? []) as UserPlanRow[];
  const userIds = plans.map((row) => row.user_id);

  if (userIds.length === 0) {
    return NextResponse.json({
      items: [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  }

  const yearMonth = currentYearMonth();

  let usersById: Record<
    string,
    { id: string; email: string | null; created_at: string }
  > = {};
  try {
    usersById = await getAuthUsersByIds(adminClient, userIds);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load auth users";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const [accessResult, usageResult] = await Promise.all([
    adminClient
      .from("user_access_state")
      .select("user_id, status, reason, changed_at")
      .in("user_id", userIds),
    adminClient
      .from("api_usage_monthly")
      .select("user_id, request_count")
      .eq("year_month", yearMonth)
      .in("user_id", userIds),
  ]);

  const error = accessResult.error || usageResult.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const accessById = ((accessResult.data ?? []) as AccessRow[]).reduce(
    (acc, row) => {
      acc[row.user_id] = row;
      return acc;
    },
    {} as Record<string, AccessRow>,
  );

  const usageById = (usageResult.data ?? []).reduce(
    (acc, row) => {
      const userId = row.user_id as string;
      const requestCount = (row.request_count as number | null) ?? 0;
      acc[userId] = requestCount;
      return acc;
    },
    {} as Record<string, number>,
  );

  return NextResponse.json({
    items: plans.map((row) => {
      const user = usersById[row.user_id] ?? null;
      const access = accessById[row.user_id];

      return {
        userId: row.user_id,
        email: user?.email ?? null,
        createdAt: user?.created_at ?? null,
        plan: row.plan,
        monthlyLimit: row.monthly_limit,
        monthRequests: usageById[row.user_id] ?? 0,
        accessState: {
          status: access?.status ?? "active",
          reason: access?.reason ?? null,
          changedAt: access?.changed_at ?? null,
        },
      };
    }),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
