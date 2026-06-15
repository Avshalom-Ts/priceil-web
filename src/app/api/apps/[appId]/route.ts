import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// DELETE /api/apps/[appId]
// Deletes the app and cascades to its api_keys.
export async function DELETE(
  _request: Request,
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

  const { appId } = await params;

  const { error } = await supabase
    .from("registered_apps")
    .delete()
    .eq("id", appId)
    .eq("user_id", user.id); // ensures ownership

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
