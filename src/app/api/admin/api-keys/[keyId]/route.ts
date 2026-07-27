import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ keyId: string }>;
};

const SYSTEM_KEY_PREFIX = "unlimited-";

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { keyId } = await context.params;
  const adminClient = createSupabaseAdminClient();

  const { data: keyRow, error: lookupError } = await adminClient
    .from("api_keys")
    .select("id, user_id, app_id, name")
    .eq("id", keyId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!keyRow) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  if (!keyRow.name.startsWith(SYSTEM_KEY_PREFIX)) {
    return NextResponse.json(
      { error: "Only system-generated keys can be deleted here" },
      { status: 403 },
    );
  }

  const { error: deleteError } = await adminClient
    .from("api_keys")
    .delete()
    .eq("id", keyId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: auditError } = await adminClient
    .from("admin_audit_log")
    .insert({
      actor_user_id: auth.data.user.id,
      action: "admin_delete_generated_api_key",
      target_user_id: keyRow.user_id,
      metadata: {
        keyId: keyRow.id,
        appId: keyRow.app_id,
        name: keyRow.name,
      },
    });

  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
