import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// DELETE /api/apps/[appId]/keys/[keyId]
// Revokes a key by setting is_active = false. The row is kept for audit purposes.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appId: string; keyId: string }> },
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appId, keyId } = await params;

  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", keyId)
    .eq("app_id", appId)
    .eq("user_id", user.id); // ensures ownership

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
