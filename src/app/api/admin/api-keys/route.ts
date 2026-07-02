import { randomBytes, createHash } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateUnlimitedKeysBody = {
  targetEmail?: string;
  appName?: string;
  appDescription?: string;
  keyNamePrefix?: string;
};

type AuthUserRow = {
  id: string;
  email: string | null;
};

function generateRawKey(): string {
  return `pil_${randomBytes(32).toString("hex")}`;
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let body: CreateUnlimitedKeysBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetEmail = body.targetEmail?.trim().toLowerCase();
  const appName = body.appName?.trim();
  const appDescription = body.appDescription?.trim() || null;
  const keyNamePrefix = body.keyNamePrefix?.trim() || "unlimited";

  if (!targetEmail) {
    return NextResponse.json(
      { error: "targetEmail is required" },
      { status: 400 },
    );
  }

  if (!appName) {
    return NextResponse.json({ error: "appName is required" }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();

  const { data: targetUser, error: targetUserError } = await adminClient
    .schema("auth")
    .from("users")
    .select("id, email")
    .eq("email", targetEmail)
    .maybeSingle();

  if (targetUserError) {
    return NextResponse.json(
      { error: targetUserError.message },
      { status: 500 },
    );
  }

  if (!targetUser) {
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 },
    );
  }

  const userRow = targetUser as AuthUserRow;

  const { error: planError } = await adminClient.from("user_plans").upsert(
    {
      user_id: userRow.id,
      plan: "premium",
      monthly_limit: -1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  const { data: existingApp, error: appLookupError } = await adminClient
    .from("registered_apps")
    .select("id, name")
    .eq("user_id", userRow.id)
    .eq("name", appName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (appLookupError) {
    return NextResponse.json(
      { error: appLookupError.message },
      { status: 500 },
    );
  }

  let appId = existingApp?.id;
  if (!appId) {
    const { data: createdApp, error: appInsertError } = await adminClient
      .from("registered_apps")
      .insert({
        user_id: userRow.id,
        name: appName,
        description: appDescription,
      })
      .select("id")
      .single();

    if (appInsertError) {
      return NextResponse.json(
        { error: appInsertError.message },
        { status: 500 },
      );
    }

    appId = createdApp.id;
  }

  const now = new Date().toISOString();
  const rawKey = generateRawKey();
  const { error: keysInsertError } = await adminClient
    .from("api_keys")
    .insert({
      user_id: userRow.id,
      app_id: appId,
      name: `${keyNamePrefix}-${now}`,
      key_hash: createHash("sha256").update(rawKey).digest("hex"),
    });
  if (keysInsertError) {
    return NextResponse.json(
      { error: keysInsertError.message },
      { status: 500 },
    );
  }

  const { error: auditError } = await adminClient
    .from("admin_audit_log")
    .insert({
      actor_user_id: auth.data.user.id,
      action: "admin_generate_unlimited_api_keys",
      target_user_id: userRow.id,
      metadata: {
        targetEmail,
        appId,
        appName,
        quantity: 1,
        keyNamePrefix,
      },
    });

  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      target: {
        userId: userRow.id,
        email: userRow.email,
      },
      appId,
      appName,
      quantity: 1,
      plan: {
        plan: "premium",
        monthly_limit: -1,
      },
      key: rawKey,
    },
    { status: 201 },
  );
}
