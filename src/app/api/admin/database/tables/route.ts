import { forwardAdminDatabase } from "@/lib/admin-database-proxy";

export function GET(request: Request) {
  return forwardAdminDatabase(request, ["tables"]);
}
