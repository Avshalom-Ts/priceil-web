import { randomBytes, createHash } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  findAuthUserByEmail,
  getAuthUsersByIds,
} from "@/lib/supabase/admin-users";

type CreateUnlimitedKeysBody = {
  targetEmail?: string;
  appName?: string;
  appDescription?: string;
  keyNamePrefix?: string;
};

type GeneratedKeyRow = {
  id: string;
  user_id: string;
  app_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
};

type RegisteredAppRow = {
  id: string;
  name: string;
  description: string | null;
};

const SYSTEM_KEY_PREFIX = "unlimited-";

function generateRawKey(): string {
  return `pil_${randomBytes(32).toString("hex")}`;
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const adminClient = createSupabaseAdminClient();

  const { data: keys, error: keysError } = await adminClient
    .from("api_keys")
    .select("id, user_id, app_id, name, is_active, created_at, last_used_at")
    .like("name", `${SYSTEM_KEY_PREFIX}%`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (keysError) {
    return NextResponse.json({ error: keysError.message }, { status: 500 });
  }

  const keyRows = (keys ?? []) as GeneratedKeyRow[];
  const userIds = Array.from(new Set(keyRows.map((row) => row.user_id)));
  const appIds = Array.from(new Set(keyRows.map((row) => row.app_id)));

  let usersById: Record<string, { email: string | null }> = {};
  if (userIds.length > 0) {
    try {
      usersById = await getAuthUsersByIds(adminClient, userIds);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load auth users";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const appsById: Record<string, RegisteredAppRow> = {};
  if (appIds.length > 0) {
    const { data: apps, error: appsError } = await adminClient
      .from("registered_apps")
      .select("id, name, description")
      .in("id", appIds);

    if (appsError) {
      return NextResponse.json({ error: appsError.message }, { status: 500 });
    }

    for (const app of (apps ?? []) as RegisteredAppRow[]) {
      appsById[app.id] = app;
    }
  }

  return NextResponse.json({
    items: keyRows.map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      userId: row.user_id,
      userEmail: usersById[row.user_id]?.email ?? null,
      appId: row.app_id,
      appName: appsById[row.app_id]?.name ?? null,
      description: appsById[row.app_id]?.description ?? null,
    })),
  });
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

  const { error: planError } = await adminClient.from("user_plans").upsert(
    {
      user_id: targetUser.id,
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
    .eq("user_id", targetUser.id)
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
        user_id: targetUser.id,
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
  const { error: keysInsertError } = await adminClient.from("api_keys").insert({
    user_id: targetUser.id,
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
      target_user_id: targetUser.id,
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
        userId: targetUser.id,
        email: targetUser.email,
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
