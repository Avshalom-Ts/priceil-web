import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminAdminsPage() {
    await requireAdminPage();

    return (
        <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold">כל המנהלים</h1>
            <p className="text-sm text-muted-foreground">
                המימוש התחיל. הצעד הבא הוא הוספת אפשרות להעניק/לבטל הרשאות והגנה על המנהל העליון האחרון.
            </p>
        </div>
    );
}
