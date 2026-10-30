import "server-only";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_DATABASE_TABLES } from "@/lib/api";

const noStore = { "Cache-Control": "no-store" };
function problem(status: number, message: string) {
  return NextResponse.json(
    {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    },
    { status, headers: noStore },
  );
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024 * 1024) {
        await reader.cancel();
        throw new Error("Body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

/** Authenticated forwarding only; the public /backend-api proxy is not used. */
export async function forwardAdminDatabase(
  request: Request,
  segments: string[],
  list = false,
): Promise<Response> {
  let auth: Awaited<ReturnType<typeof requireAdminApi>>;
  try {
    auth = await requireAdminApi();
  } catch {
    return problem(503, "לא ניתן לאמת הרשאות מנהל כרגע");
  }
  if (!auth.ok) {
    return problem(
      auth.response.status,
      auth.response.status === 401
        ? "יש להתחבר מחדש"
        : auth.response.status === 403
          ? "נדרשת הרשאת מנהל"
          : "לא ניתן לאמת הרשאות מנהל כרגע",
    );
  }
  if (auth.data.role !== "admin" && auth.data.role !== "super_admin")
    return problem(403, "נדרשת הרשאת מנהל");

  const mutation = request.method === "PATCH" || request.method === "DELETE";
  const metadata = segments.length === 1 && segments[0] === "tables";
  if (
    (!metadata &&
      !ADMIN_DATABASE_TABLES.some((table) => table === segments[0])) ||
    ![1, 2].includes(segments.length)
  )
    return problem(404, "טבלה לא קיימת");
  if (
    segments.length === 2 &&
    (!segments[1] ||
      segments[1].length > 255 ||
      segments[1] === "." ||
      segments[1] === ".." ||
      [...segments[1]].some(
        (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
      ))
  )
    return problem(400, "מזהה רשומה לא תקין");
  if (
    (request.method !== "GET" && !mutation) ||
    (mutation && segments.length !== 2)
  )
    return problem(405, "פעולה לא נתמכת");

  const incoming = new URL(request.url);
  let upstream: URL;
  try {
    const target =
      process.env.ADMIN_API_TARGET ||
      process.env.API_PROXY_TARGET ||
      process.env.NEXT_PUBLIC_API_URL;
    if (!target) throw new Error("Missing API target");
    upstream = new URL(target);
    if (
      !["http:", "https:"].includes(upstream.protocol) ||
      upstream.username ||
      upstream.password ||
      upstream.search ||
      upstream.hash ||
      upstream.pathname !== "/" ||
      upstream.origin === incoming.origin
    )
      throw new Error("Invalid API target");
    upstream.pathname = `/admin/database/${segments.map(encodeURIComponent).join("/")}`;
  } catch {
    return problem(503, "יש להגדיר כתובת ישירה לשרת ה-API בהגדרות השרת");
  }
  for (const [key] of incoming.searchParams) {
    if (
      !list ||
      !["q", "page", "limit"].includes(key) ||
      incoming.searchParams.getAll(key).length !== 1
    )
      return problem(400, "פרמטר חיפוש לא תקין");
  }
  upstream.search = incoming.search;

  let body: string | undefined;
  if (mutation) {
    let expectedOrigin: string;
    try {
      expectedOrigin = new URL(process.env.ADMIN_WEB_ORIGIN || incoming.origin)
        .origin;
    } catch {
      return problem(503, "כתובת האתר אינה מוגדרת כראוי");
    }
    if (
      request.headers.get("origin") !== expectedOrigin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return problem(403, "מקור הבקשה אינו מאושר");
    if (
      request.headers.get("content-type")?.split(";")[0].trim() !==
      "application/json"
    )
      return problem(415, "נדרש גוף בקשה מסוג JSON");
    let parsed: unknown;
    try {
      parsed = await readBody(request);
    } catch {
      return problem(400, "גוף הבקשה אינו תקין או גדול מדי");
    }
    if (
      !record(parsed) ||
      typeof parsed.revision !== "string" ||
      !/^[a-f0-9]{64}$/.test(parsed.revision) ||
      Object.keys(parsed).some(
        (key) =>
          ![
            "revision",
            ...(request.method === "PATCH" ? ["changes"] : []),
          ].includes(key),
      )
    )
      return problem(400, "נדרשת גרסה תקינה של הרשומה");
    if (
      request.method === "PATCH" &&
      (!record(parsed.changes) ||
        Object.keys(parsed.changes).length < 1 ||
        Object.keys(parsed.changes).length > 64 ||
        Object.entries(parsed.changes).some(
          ([key, value]) =>
            !/^[A-Za-z][A-Za-z0-9]*$/.test(key) ||
            !(
              value === null ||
              typeof value === "string" ||
              typeof value === "boolean" ||
              (typeof value === "number" && Number.isFinite(value))
            ),
        ))
    )
      return problem(400, "שדות העדכון אינם תקינים");
    body = JSON.stringify(parsed);
  }

  let accessToken: string;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    // Read only the token from storage; session.user is not an authenticated identity.
    if (error || !session?.access_token) return problem(401, "יש להתחבר מחדש");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(session.access_token);
    if (userError || !user || user.id !== auth.data.user.id)
      return problem(401, "יש להתחבר מחדש");
    accessToken = session.access_token;
  } catch {
    return problem(503, "לא ניתן לאמת את ההתחברות כרגע");
  }

  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const result: unknown = await response.json();
    if (!record(result)) return problem(502, "תשובה לא תקינה משרת ה-API");
    if (!response.ok) {
      const fieldErrors = record(result.fieldErrors)
        ? Object.fromEntries(
            Object.entries(result.fieldErrors).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          )
        : undefined;
      return NextResponse.json(
        {
          success: false,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
          message:
            typeof result.message === "string"
              ? result.message
              : "הבקשה לשרת ה-API נכשלה",
          ...(fieldErrors ? { fieldErrors } : {}),
        },
        {
          status: response.status,
          headers: {
            ...noStore,
            ...(response.headers.has("Retry-After")
              ? { "Retry-After": response.headers.get("Retry-After")! }
              : {}),
          },
        },
      );
    }
    if (result.success !== true || !("data" in result))
      return problem(502, "תשובה לא תקינה משרת ה-API");
    return NextResponse.json(result, { headers: noStore });
  } catch {
    return problem(502, "לא ניתן להגיע לשרת ה-API כרגע. יש לנסות שוב.");
  }
}
