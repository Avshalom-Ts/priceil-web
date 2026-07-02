import { requireAdminPage } from "@/lib/admin-auth";
import { redirect } from "next/dist/client/components/navigation";

export default async function AdminHomePage() {
    await requireAdminPage();
    redirect("/admin/stats");
}
