import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_REQUIRED_PATHS = ["/developers/account", "/admin"];
const ADMIN_ONLY_PATHS = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = AUTH_REQUIRED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.startsWith("/admin") ? "/" : "/developers";
    return NextResponse.redirect(redirectUrl);
  }

  const isAdminPath = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath) {
    const { data: adminRole, error: adminRoleError } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminRoleError || !adminRole) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/developers/account/:path*", "/admin/:path*"],
};
