import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "admin" | "super_admin";

interface AdminUserRow {
  role: AdminRole;
}

interface AdminAuthSuccess {
  user: User;
  role: AdminRole;
}

type AdminAuthResult =
  | { ok: true; data: AdminAuthSuccess }
  | { ok: false; response: NextResponse };

async function getAdminRow(userId: string): Promise<AdminUserRow | null> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminUserRow | null;
}

export async function requireAdminApi(options?: {
  superAdminOnly?: boolean;
}): Promise<AdminAuthResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  let adminRow: AdminUserRow | null;
  try {
    adminRow = await getAdminRow(user.id);
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unable to verify admin role" },
        { status: 500 },
      ),
    };
  }

  if (!adminRow) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (options?.superAdminOnly && adminRow.role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    data: {
      user,
      role: adminRow.role,
    },
  };
}

export async function requireAdminPage(options?: {
  superAdminOnly?: boolean;
}): Promise<AdminAuthSuccess> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/developers");
  }

  let adminRow: AdminUserRow | null;
  try {
    adminRow = await getAdminRow(user.id);
  } catch {
    redirect("/");
  }

  if (!adminRow) {
    redirect("/");
  }

  if (options?.superAdminOnly && adminRow.role !== "super_admin") {
    redirect("/admin");
  }

  return {
    user,
    role: adminRow.role,
  };
}
