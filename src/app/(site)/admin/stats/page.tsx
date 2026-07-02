import { requireAdminPage } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function currentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

async function loadGlobalStats() {
    const adminClient = createSupabaseAdminClient();
    const yearMonth = currentYearMonth();

    const [
        totalUsersResult,
        blockedUsersResult,
        deletedUsersResult,
        monthlyUsageResult,
        plansResult,
    ] = await Promise.all([
        adminClient
            .from("user_plans")
            .select("user_id", { count: "exact", head: true }),
        adminClient
            .from("user_access_state")
            .select("user_id", { count: "exact", head: true })
            .eq("status", "blocked"),
        adminClient
            .from("user_access_state")
            .select("user_id", { count: "exact", head: true })
            .eq("status", "deleted_soft"),
        adminClient
            .from("api_usage_monthly")
            .select("request_count")
            .eq("year_month", yearMonth),
        adminClient.from("user_plans").select("plan"),
    ]);

    const error =
        totalUsersResult.error ||
        blockedUsersResult.error ||
        deletedUsersResult.error ||
        monthlyUsageResult.error ||
        plansResult.error;

    if (error) {
        throw new Error(error.message);
    }

    const totalUsers = totalUsersResult.count ?? 0;
    const blockedUsers = blockedUsersResult.count ?? 0;
    const deletedUsers = deletedUsersResult.count ?? 0;
    const activeUsers = Math.max(totalUsers - blockedUsers - deletedUsers, 0);

    const totalRequestsThisMonth = (monthlyUsageResult.data ?? []).reduce(
        (acc, row) => acc + (row.request_count ?? 0),
        0,
    );

    const planDistribution = (plansResult.data ?? []).reduce(
        (acc, row) => {
            const key = row.plan ?? "free";
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    return {
        totalUsers,
        activeUsers,
        blockedUsers,
        deletedUsers,
        totalRequestsThisMonth,
        planDistribution,
    };
}

export default async function AdminStatsPage() {
    await requireAdminPage();
    const stats = await loadGlobalStats();

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">סטטיסטיקות האפליקצייה</h1>
                <p className="text-sm text-muted-foreground">מדדים גלובליים של האפליקציה.</p>
            </header>

            <section className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                <article className="rounded-lg border p-4">
                    <h2 className="text-sm text-muted-foreground">כל המשתמשים</h2>
                    <p className="text-2xl font-semibold">{stats.totalUsers}</p>
                </article>
                <article className="rounded-lg border p-4">
                    <h2 className="text-sm text-muted-foreground">משתמשים פעילים</h2>
                    <p className="text-2xl font-semibold">{stats.activeUsers}</p>
                </article>
                <article className="rounded-lg border p-4">
                    <h2 className="text-sm text-muted-foreground">משתמשים חסומים</h2>
                    <p className="text-2xl font-semibold">{stats.blockedUsers}</p>
                </article>
                <article className="rounded-lg border p-4">
                    <h2 className="text-sm text-muted-foreground">משתמשים שנמחקו</h2>
                    <p className="text-2xl font-semibold">{stats.deletedUsers}</p>
                </article>
                <article className="rounded-lg border p-4">
                    <h2 className="text-sm text-muted-foreground">בקשות מכל החודש הנוכחי</h2>
                    <p className="text-2xl font-semibold">{stats.totalRequestsThisMonth}</p>
                </article>
            </section>

            <section className="rounded-lg border p-4">
                <h2 className="mb-3 text-base font-semibold">Plan distribution</h2>
                <div className="grid gap-2 sm:grid-cols-3">
                    {Object.entries(stats.planDistribution).map(([plan, count]) => (
                        <div key={plan} className="rounded border p-3">
                            <p className="text-sm text-muted-foreground">{plan}</p>
                            <p className="text-xl font-semibold">{count}</p>
                        </div>
                    ))}
                    {Object.keys(stats.planDistribution).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No plan data available.</p>
                    ) : null}
                </div>
            </section>
        </div>
    );
}
