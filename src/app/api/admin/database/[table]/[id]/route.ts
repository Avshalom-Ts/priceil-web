import { forwardAdminDatabase } from "@/lib/admin-database-proxy";

type Context = { params: Promise<{ table: string; id: string }> };
async function forward(request: Request, { params }: Context) {
  const { table, id } = await params;
  return forwardAdminDatabase(request, [table, id]);
}
export const GET = forward;
export const PATCH = forward;
export const DELETE = forward;
