import type { Metadata } from "next";
import { DatabaseManager } from "@/components/admin/database-manager";

export const metadata: Metadata = { title: "ניהול נתוני הקטלוג" };

export default function AdminDatabasePage() {
  return <DatabaseManager />;
}
