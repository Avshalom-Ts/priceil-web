import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminAuditPage() {
    await requireAdminPage();

    return (
        <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold">יומן פעולות</h1>
            <p className="text-sm text-muted-foreground">
                המימוש התחיל. השלב הבא הוא הצגת אירועי ביקורת ממוספרים מטבלת admin_audit_log.
            </p>
        </div>
    );
}
