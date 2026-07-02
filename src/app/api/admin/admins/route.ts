import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminRow = {
  user_id: string;
  role: "admin" | "super_admin";
  created_at: string;
};

type AuthUserRow = {
  id: string;
  email: string | null;
};

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const adminClient = createSupabaseAdminClient();
  const { data: admins, error } = await adminClient
    .from("admin_users")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const adminRows = (admins ?? []) as AdminRow[];
  const userIds = adminRows.map((row) => row.user_id);

  let userById: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: users, error: usersError } = await adminClient
      .schema("auth")
      .from("users")
      .select("id, email")
      .in("id", userIds);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    userById = ((users ?? []) as AuthUserRow[]).reduce(
      (acc, user) => {
        acc[user.id] = user.email;
        return acc;
      },
      {} as Record<string, string | null>,
    );
  }

  return NextResponse.json({
    items: adminRows.map((row) => ({
      userId: row.user_id,
      email: userById[row.user_id] ?? null,
      role: row.role,
      createdAt: row.created_at,
    })),
  });
}
