import { forwardAdminDatabase } from "@/lib/admin-database-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  const { table } = await params;
  return forwardAdminDatabase(request, [table], true);
}
