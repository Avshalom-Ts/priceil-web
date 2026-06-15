import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TIER_LIMITS: Record<string, { maxApps: number; maxKeysPerApp: number }> =
  {
    free: { maxApps: 1, maxKeysPerApp: 1 },
    basic: { maxApps: 3, maxKeysPerApp: 2 },
    premium: { maxApps: Infinity, maxKeysPerApp: Infinity },
  };

// POST /api/apps/[appId]/keys
// Body: { name: string }
// Generates a new API key for the app. Returns the raw key once — never stored.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { appId } = await params;

  // Verify the app belongs to this user.
  const { data: app, error: appError } = await supabase
    .from("registered_apps")
    .select("id")
    .eq("id", appId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }
  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Enforce the per-app key limit for the user's plan.
  const { data: planRow } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = planRow?.plan ?? "free";
  const limits = TIER_LIMITS[plan] ?? TIER_LIMITS.free;

  if (limits.maxKeysPerApp !== Infinity) {
    const { count, error: countError } = await supabase
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .eq("is_active", true); // revoked keys free up the slot

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= limits.maxKeysPerApp) {
      return NextResponse.json(
        {
          error: `Plan "${plan}" allows at most ${limits.maxKeysPerApp} key(s) per app`,
        },
        { status: 403 },
      );
    }
  }

  // Generate key: pil_<64 hex chars>. Only the sha256 hash is stored.
  const rawKey = `pil_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { data: keyRow, error: insertError } = await supabase
    .from("api_keys")
    .insert({ user_id: user.id, app_id: appId, name, key_hash: keyHash })
    .select("id, name, is_active, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Return the raw key here — this is the only time it will ever be visible.
  return NextResponse.json(
    { key: { ...keyRow, raw_key: rawKey } },
    { status: 201 },
  );
}
