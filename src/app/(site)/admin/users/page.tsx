import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminUsersPage() {
    await requireAdminPage();

    return (
        <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
            <p className="text-sm text-muted-foreground">
                המימוש התחיל. השלב הבא הוא חיבור הרשימה, חסימה/ביטול חסימה, ופעולות מחיקה רכה.
            </p>
        </div>
    );
}
