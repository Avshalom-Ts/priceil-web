import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/admin-auth";


export default async function AdminMessagesLayout({ children }: { children: ReactNode }) {
    await requireAdminPage();

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 min-h-screen">
            {children}
        </div>
    );
}