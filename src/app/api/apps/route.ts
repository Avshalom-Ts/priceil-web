import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Tier limits for app and key counts.
// -1 in monthly_limit means unlimited (premium).
const TIER_LIMITS: Record<string, { maxApps: number; maxKeysPerApp: number }> =
  {
    free: { maxApps: 1, maxKeysPerApp: 1 },
    basic: { maxApps: 3, maxKeysPerApp: 2 },
    premium: { maxApps: Infinity, maxKeysPerApp: Infinity },
  };

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

// GET /api/apps
// Returns the user's plan, this-month usage, and all apps with their keys.
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [planResult, usageResult, appsResult] = await Promise.all([
    supabase
      .from("user_plans")
      .select("plan, monthly_limit")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("api_usage_monthly")
      .select("request_count")
      .eq("user_id", user.id)
      .eq("year_month", currentYearMonth())
      .maybeSingle(),

    supabase
      .from("registered_apps")
      .select(
        "id, name, description, created_at, api_keys(id, name, is_active, created_at, last_used_at)",
      )
      .eq("user_id", user.id)
      .eq("api_keys.is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  if (appsResult.error) {
    return NextResponse.json(
      { error: appsResult.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    plan: planResult.data ?? { plan: "free", monthly_limit: 5000 },
    usage: usageResult.data?.request_count ?? 0,
    apps: appsResult.data ?? [],
  });
}

// POST /api/apps
// Body: { name: string, description?: string }
// Creates a new registered app, enforcing the tier's app limit.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Look up the user's plan, defaulting to free.
  const { data: planRow } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = planRow?.plan ?? "free";
  const limits = TIER_LIMITS[plan] ?? TIER_LIMITS.free;

  if (limits.maxApps !== Infinity) {
    const { count, error: countError } = await supabase
      .from("registered_apps")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= limits.maxApps) {
      return NextResponse.json(
        { error: `Plan "${plan}" allows at most ${limits.maxApps} app(s)` },
        { status: 403 },
      );
    }
  }

  const { data: app, error: insertError } = await supabase
    .from("registered_apps")
    .insert({
      user_id: user.id,
      name,
      description: body.description?.trim() || null,
    })
    .select("id, name, description, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ app }, { status: 201 });
}
